param(
    [Parameter(Mandatory = $true)][string]$ScreensDirectory,
    [Parameter(Mandatory = $true)][string]$OutputPath
)

# Assemble unmodified simulator captures for review; this does not generate UI.
Add-Type -AssemblyName System.Drawing
$screens = @(
    @{ File = 'pairing.png'; Label = '01  配对' },
    @{ File = 'companion.png'; Label = '02  首屏舞台' },
    @{ File = 'companion-narrative.png'; Label = '03  陪伴与装扮' },
    @{ File = 'care.png'; Label = '04  照护' },
    @{ File = 'memories.png'; Label = '05  记忆' }
)
$panelWidth = 288
$gap = 16
$top = 92
$canvas = [System.Drawing.Bitmap]::new(1536, 750)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.Clear([System.Drawing.Color]::FromArgb(20, 21, 25))
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$titleFont = [System.Drawing.Font]::new('Microsoft YaHei UI', 20, [System.Drawing.FontStyle]::Bold)
$labelFont = [System.Drawing.Font]::new('Microsoft YaHei UI', 12)
$white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(239, 239, 243))
$muted = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(190, 185, 207))
try {
    $graphics.DrawString('植灵兽 · A / 潮玩硬件展台', $titleFont, $white, 16, 12)
    $graphics.DrawString('中文 iPhone 模拟器原始截图 · 传感器与步数为演示数据 · 非概念图', $labelFont, $muted, 16, 49)
    for ($i = 0; $i -lt $screens.Count; $i++) {
        $source = [System.Drawing.Image]::FromFile((Join-Path $ScreensDirectory $screens[$i].File))
        try {
            $x = 16 + $i * ($panelWidth + $gap)
            $height = [int][math]::Round($panelWidth * $source.Height / $source.Width)
            $graphics.DrawImage($source, [System.Drawing.Rectangle]::new($x, $top, $panelWidth, $height))
            $graphics.DrawString($screens[$i].Label, $labelFont, $muted, $x, $top + $height + 12)
        } finally { $source.Dispose() }
    }
    $canvas.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
    $graphics.Dispose()
    $canvas.Dispose()
    $titleFont.Dispose()
    $labelFont.Dispose()
    $white.Dispose()
    $muted.Dispose()
}
