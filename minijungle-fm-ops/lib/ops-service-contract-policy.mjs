import { randomUUID } from "node:crypto";

export const serviceContractMigrationVersion = "2026-09-06.service-contracts-v1";
export const postgresServiceContractMigrationVersion = "2026-09-06.postgres-service-contracts-v1";
export const serviceContractVersionMigrationVersion = "2026-09-07.service-contract-versions-v1";
export const postgresServiceContractVersionMigrationVersion = "2026-09-07.postgres-service-contract-versions-v1";
export const contractChangeTypes = new Set(["amendment", "renewal"]);
export const contractChangeStatuses = new Set(["pending", "approved", "rejected"]);
export const contractStatuses = new Set(["draft", "active", "suspended", "terminated"]);
export const contractPriorities = ["critical", "high", "normal", "low"];
export const defaultContractSla = Object.freeze({
  critical: { responseHours: 1, resolutionHours: 4 },
  high: { responseHours: 4, resolutionHours: 12 },
  normal: { responseHours: 8, resolutionHours: 24 },
  low: { responseHours: 24, resolutionHours: 72 }
});

export function contractError(message, code = "SERVICE_CONTRACT_VALIDATION_ERROR", status = 400) {
  const error = new Error(message); error.code = code; error.status = status; return error;
}

function required(value, field) { const result=String(value||"").trim(); if(!result)throw contractError(`${field} is required`); return result; }
function dateOnly(value, field) { const result=String(value||"").slice(0,10); if(!/^\d{4}-\d{2}-\d{2}$/.test(result)||Number.isNaN(Date.parse(`${result}T00:00:00Z`)))throw contractError(`${field} must be YYYY-MM-DD`); return result; }
function timeOnly(value, field) { const result=String(value||"").trim(); if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(result))throw contractError(`${field} must be HH:MM`); return result; }
function positiveNumber(value, field, {allowZero=false}={}) { const number=Number(value); if(!Number.isFinite(number)||(allowZero?number<0:number<=0))throw contractError(`${field} must be ${allowZero?"zero or greater":"greater than zero"}`); return Math.round(number*100)/100; }

export function normalizeContractSla(input = defaultContractSla) {
  const result={};
  for(const priority of contractPriorities){const source=input?.[priority]||defaultContractSla[priority];const responseHours=positiveNumber(source?.responseHours,`${priority}.responseHours`);const resolutionHours=positiveNumber(source?.resolutionHours,`${priority}.resolutionHours`);if(responseHours>resolutionHours)throw contractError(`${priority} responseHours cannot exceed resolutionHours`);result[priority]={responseHours,resolutionHours};}
  return result;
}

export function normalizeServiceContract(input) {
  const startDate=dateOnly(input?.startDate,"startDate"); const endDate=dateOnly(input?.endDate,"endDate"); if(endDate<startDate)throw contractError("endDate cannot be before startDate");
  const wallIds=[...new Set((Array.isArray(input?.wallIds)?input.wallIds:[]).map((value)=>String(value||"").trim()).filter(Boolean))];
  if(!wallIds.length)throw contractError("wallIds must include at least one living asset");
  const serviceWindowStart=timeOnly(input?.serviceWindowStart||"09:00","serviceWindowStart"); const serviceWindowEnd=timeOnly(input?.serviceWindowEnd||"18:00","serviceWindowEnd"); if(serviceWindowEnd<=serviceWindowStart)throw contractError("serviceWindowEnd must be after serviceWindowStart");
  const now=new Date().toISOString();
  return {id:required(input?.id||`SVC-${randomUUID()}`,"id"),clientId:required(input?.clientId,"clientId"),contractNumber:required(input?.contractNumber,"contractNumber").toUpperCase(),planName:required(input?.planName,"planName"),status:"draft",startDate,endDate,currency:required(input?.currency||"HKD","currency").toUpperCase(),monthlyFee:positiveNumber(input?.monthlyFee??0,"monthlyFee",{allowZero:true}),visitsPerMonth:Math.round(positiveNumber(input?.visitsPerMonth||1,"visitsPerMonth")),serviceWindowStart,serviceWindowEnd,evidenceRequired:input?.evidenceRequired!==false,sla:normalizeContractSla(input?.sla),wallIds,note:required(input?.note||"Service contract created","note"),createdBy:required(input?.createdBy||"system","createdBy"),createdAt:now,updatedAt:now};
}

const transitions={draft:new Set(["activate","terminate"]),active:new Set(["suspend","terminate"]),suspended:new Set(["resume","terminate"]),terminated:new Set()};
export function normalizeContractAction(existing,input){const action=required(input?.action,"action").toLowerCase();if(!transitions[existing.status]?.has(action))throw contractError(`${action} is not allowed from ${existing.status}`,"SERVICE_CONTRACT_TRANSITION_INVALID",409);return{action,note:required(input?.note,"note"),expectedUpdatedAt:required(input?.expectedUpdatedAt,"expectedUpdatedAt"),actor:required(input?.actor||"system","actor"),occurredAt:new Date().toISOString()};}
export function actionStatus(action){return action==="activate"||action==="resume"?"active":action==="suspend"?"suspended":"terminated";}
export function effectiveContractState(contract,at=new Date().toISOString()) { if(contract.status!=="active")return contract.status;const day=String(at).slice(0,10);if(day<contract.startDate)return"scheduled";if(day>contract.endDate)return"expired";return"active"; }
export function contractSlaDueAt(contract,priority="normal",from=new Date().toISOString()){const normalized=contractPriorities.includes(priority)?priority:"normal";const hours=Number(contract.sla?.[normalized]?.resolutionHours||defaultContractSla[normalized].resolutionHours);return{priority:normalized,responseHours:Number(contract.sla?.[normalized]?.responseHours||defaultContractSla[normalized].responseHours),resolutionHours:hours,dueAt:new Date(new Date(from).getTime()+hours*3600000).toISOString()};}
