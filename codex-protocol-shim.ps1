param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Url
)

$ErrorActionPreference = "Stop"

$markerPath = Join-Path $PSScriptRoot "codex-protocol-shim-hit.txt"
$kind = if ($Url.StartsWith("codex://connector/oauth_callback", [System.StringComparison]::OrdinalIgnoreCase)) {
  "connector-oauth-callback"
} else {
  "other-codex-link"
}
Set-Content -LiteralPath $markerPath -Value "$(Get-Date -Format o) $kind started" -Encoding UTF8

$code = @'
using System;
using System.Runtime.InteropServices;

[ComImport, Guid("2e941141-7f97-4756-ba1d-9decde894a3d")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IApplicationActivationManager {
  [PreserveSig]
  int ActivateApplication(
    [MarshalAs(UnmanagedType.LPWStr)] string appUserModelId,
    [MarshalAs(UnmanagedType.LPWStr)] string arguments,
    uint options,
    out uint processId);
  [PreserveSig]
  int ActivateForFile(
    [MarshalAs(UnmanagedType.LPWStr)] string appUserModelId,
    IntPtr itemArray,
    [MarshalAs(UnmanagedType.LPWStr)] string verb,
    out uint processId);
  [PreserveSig]
  int ActivateForProtocol(
    [MarshalAs(UnmanagedType.LPWStr)] string appUserModelId,
    IntPtr itemArray,
    out uint processId);
}

[ComImport, Guid("45BA127D-10A8-46EA-8AB7-56EA9078943C")]
class ApplicationActivationManager {}

public static class CodexAppxActivator {
  static Guid IID_IShellItem = new Guid("43826D1E-E718-42EE-BC55-A1E261C37BFE");
  static Guid IID_IShellItemArray = new Guid("B63EA76D-1F85-456F-A19C-48159EFA858B");

  [DllImport("shell32.dll", CharSet = CharSet.Unicode, PreserveSig = true)]
  static extern int SHCreateItemFromParsingName(
    [MarshalAs(UnmanagedType.LPWStr)] string pszPath,
    IntPtr pbc,
    ref Guid riid,
    out IntPtr ppv);

  [DllImport("shell32.dll", PreserveSig = true)]
  static extern int SHCreateShellItemArrayFromShellItem(
    IntPtr psi,
    ref Guid riid,
    out IntPtr ppv);

  public static uint ActivateProtocol(string appId, string uri) {
    IntPtr item = IntPtr.Zero;
    IntPtr itemArray = IntPtr.Zero;

    try {
      var hr = SHCreateItemFromParsingName(uri, IntPtr.Zero, ref IID_IShellItem, out item);
      if (hr < 0) Marshal.ThrowExceptionForHR(hr);

      hr = SHCreateShellItemArrayFromShellItem(item, ref IID_IShellItemArray, out itemArray);
      if (hr < 0) Marshal.ThrowExceptionForHR(hr);

      var manager = (IApplicationActivationManager)new ApplicationActivationManager();
      uint pid;
      hr = manager.ActivateForProtocol(appId, itemArray, out pid);
      if (hr < 0) Marshal.ThrowExceptionForHR(hr);
      return pid;
    } finally {
      if (itemArray != IntPtr.Zero) Marshal.Release(itemArray);
      if (item != IntPtr.Zero) Marshal.Release(item);
    }
  }
}
'@

if (-not ("CodexAppxActivator" -as [type])) {
  Add-Type $code
}

try {
  [CodexAppxActivator]::ActivateProtocol("OpenAI.Codex_2p2nqsd0c76g0!App", $Url) | Out-Null
  Add-Content -LiteralPath $markerPath -Value "$(Get-Date -Format o) $kind activated" -Encoding UTF8
} catch {
  $hresult = "unknown"
  if ($_.Exception.HResult) {
    $hresult = ("0x{0:X8}" -f ($_.Exception.HResult -band 0xffffffff))
  }
  Add-Content -LiteralPath $markerPath -Value "$(Get-Date -Format o) $kind activation-failed $hresult" -Encoding UTF8
  throw
}
