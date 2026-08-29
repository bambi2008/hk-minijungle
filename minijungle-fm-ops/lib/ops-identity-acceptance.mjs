export const identityAcceptanceVersion = "2026-08-29.oidc-role-scope-acceptance-v1";

export function evaluateIdentityAcceptance(results = []) {
  const failures = results.filter((item) => !item.passed).map((item) => item.detail || item.id);
  return {
    version: identityAcceptanceVersion,
    status: failures.length ? "blocked" : "verified",
    checks: results,
    failures,
    limitation: "This matrix proves the supplied tokens' current role and client-scope behavior. MFA enrollment, role change propagation and token revocation still need an IdP-admin acceptance record."
  };
}
