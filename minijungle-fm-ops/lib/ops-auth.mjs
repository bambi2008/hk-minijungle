export const authPolicyVersion = "2026-07-15.auth-boundary-v1";

const roleDefinitions = {
  "platform-admin": {
    label: "Platform Admin",
    description: "Full platform operator with all tenants, storage and action permissions.",
    permissions: ["*"],
    actionTypes: ["*"]
  },
  "fm-lead": {
    label: "FM Lead",
    description: "Hong Kong operations lead with full operational read/write access.",
    permissions: [
      "portfolio.read",
      "assets.read",
      "ops.events.read",
      "ops.events.write",
      "ops.state.read",
      "ops.state.write.action",
      "ops.state.write.snapshot",
      "storage.read",
      "data.model.read",
      "data.quality.read",
      "production.seed.read",
      "auth.policy.read",
      "master.data.read",
      "master.data.write",
      "master.data.import",
      "master.data.validate",
      "mobile.route.read",
      "mobile.capture.read",
      "mobile.capture.write"
    ],
    actionTypes: ["*"]
  },
  "field-tech": {
    label: "Field Technician",
    description: "Scoped field operator who can read assigned accounts and perform service actions only.",
    permissions: [
      "portfolio.read",
      "assets.read",
      "ops.events.read",
      "ops.state.read",
      "ops.state.write.action",
      "mobile.route.read",
      "mobile.capture.read",
      "mobile.capture.write"
    ],
    actionTypes: [
      "workorder.complete",
      "dispatch.stage",
      "sensor.acknowledge",
      "quickTask.create",
      "quickTask.close"
    ]
  },
  "client-viewer": {
    label: "Client Viewer",
    description: "Client-side read-only account viewer with no operational write permissions.",
    permissions: [
      "portfolio.read",
      "assets.read",
      "ops.events.read",
      "ops.state.read"
    ],
    actionTypes: []
  },
  "esg-auditor": {
    label: "ESG Auditor",
    description: "Read-only auditor for portfolio, evidence and data-quality checks.",
    permissions: [
      "portfolio.read",
      "assets.read",
      "ops.events.read",
      "ops.state.read",
      "data.model.read",
      "data.quality.read",
      "auth.policy.read"
    ],
    actionTypes: []
  }
};

const demoPrincipals = {
  "ops-admin": {
    id: "ops-admin",
    token: "drf-demo-admin",
    name: "DR FOREST Platform Admin",
    roleId: "platform-admin",
    tenantId: "dr-forest-hk",
    clientIds: ["*"]
  },
  "fm-lead": {
    id: "fm-lead",
    token: "drf-demo-fm-lead",
    name: "Hong Kong FM Lead",
    roleId: "fm-lead",
    tenantId: "dr-forest-hk",
    clientIds: ["*"]
  },
  "field-tech-show-suite": {
    id: "field-tech-show-suite",
    token: "drf-demo-field-show-suite",
    name: "Show Suite Field Technician",
    roleId: "field-tech",
    tenantId: "dr-forest-hk",
    clientIds: ["show-suite"]
  },
  "client-show-suite": {
    id: "client-show-suite",
    token: "drf-demo-client-show-suite",
    name: "Property Show Suite Client Viewer",
    roleId: "client-viewer",
    tenantId: "client-show-suite",
    clientIds: ["show-suite"]
  },
  "esg-auditor": {
    id: "esg-auditor",
    token: "drf-demo-esg-auditor",
    name: "ESG Evidence Auditor",
    roleId: "esg-auditor",
    tenantId: "dr-forest-hk",
    clientIds: ["*"]
  }
};

const defaultPrincipalId = "fm-lead";

function authError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function roleFor(principal) {
  return roleDefinitions[principal.roleId] || roleDefinitions["client-viewer"];
}

function publicPrincipal(principal, isDefault = false) {
  const role = roleFor(principal);
  return {
    id: principal.id,
    name: principal.name,
    roleId: principal.roleId,
    roleLabel: role.label,
    tenantId: principal.tenantId,
    clientIds: principal.clientIds,
    clientScope: principal.clientIds.includes("*") ? "all" : "scoped",
    permissions: role.permissions,
    actionTypes: role.actionTypes,
    isDefault
  };
}

function tokenFromRequest(req) {
  const headerPrincipal = req.headers["x-dr-forest-principal"];
  const headerSession = req.headers["x-dr-forest-session"];
  const authHeader = req.headers.authorization || "";
  const bearer = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
  return String(headerPrincipal || headerSession || bearer || "").trim();
}

export function resolveAuthContext(req) {
  const token = tokenFromRequest(req);
  const isDefault = !token;
  const principal = token
    ? Object.values(demoPrincipals).find((item) => item.id === token || item.token === token)
    : demoPrincipals[defaultPrincipalId];

  if (!principal) {
    throw authError(401, "Unknown DR FOREST demo principal", "AUTH_UNKNOWN_PRINCIPAL");
  }

  return publicPrincipal(principal, isDefault);
}

export function hasPermission(auth, permission) {
  return auth.permissions.includes("*") || auth.permissions.includes(permission);
}

export function requirePermission(auth, permission) {
  if (hasPermission(auth, permission)) return;
  throw authError(403, `Permission denied: ${permission}`, "AUTH_PERMISSION_DENIED");
}

export function canAccessClient(auth, clientId) {
  if (auth.clientIds.includes("*")) return true;
  if (!clientId) return false;
  return auth.clientIds.includes(clientId);
}

export function requireClientAccess(auth, clientId, operation = "client access") {
  if (canAccessClient(auth, clientId)) return;
  throw authError(403, `Client scope denied for ${operation}`, "AUTH_CLIENT_SCOPE_DENIED");
}

export function requireActionAccess(auth, action) {
  requirePermission(auth, "ops.state.write.action");
  if (!auth.actionTypes.includes("*") && !auth.actionTypes.includes(action.type)) {
    throw authError(403, `Action type denied: ${action.type}`, "AUTH_ACTION_DENIED");
  }
  requireClientAccess(auth, action.clientId || null, action.type);
}

export function requireEventWriteAccess(auth, event) {
  requirePermission(auth, "ops.events.write");
  requireClientAccess(auth, event.clientId || null, event.type);
}

export function requireSnapshotWriteAccess(auth, event = null) {
  requirePermission(auth, "ops.state.write.snapshot");
  if (event?.clientId) requireClientAccess(auth, event.clientId, "state snapshot");
}

export function filterByClientScope(auth, records, getClientId) {
  if (auth.clientIds.includes("*")) return records;
  return records.filter((record) => canAccessClient(auth, getClientId(record)));
}

export function authPolicySummary() {
  return {
    version: authPolicyVersion,
    defaultPrincipalId,
    authHeaders: ["Authorization: Bearer <demo-token>", "x-dr-forest-principal: <principal-id>"],
    roles: roleDefinitions,
    principals: Object.values(demoPrincipals).map((principal) => publicPrincipal(principal))
  };
}
