import { readFile } from "node:fs/promises";
import { flattenPathologyLibrary, pathologyLibrary } from "./pathology-library.mjs";

const fixturePath = new URL("./data/public-photo-fixtures.json", import.meta.url);
const fixtures = JSON.parse(await readFile(fixturePath, "utf8"));
const conditions = new Set(flattenPathologyLibrary(pathologyLibrary).map((condition) => condition.id));
const sourceIds = new Set(fixtures.sources.map((source) => source.id));

function assert(value, message) {
  if (!value) throw new Error(message);
}

assert(fixtures.version === "fivecrop-public-print-fixtures-v1", "Unexpected public fixture version");
assert(fixtures.usePolicy?.doNotBundleCopyrightedImages === true, "Fixture policy must avoid bundling copyrighted images");
assert(fixtures.minimumPlan?.minimumTotalPhoneCaptures >= 100, "Public print plan must cover at least 100 phone captures");
assert(Array.isArray(fixtures.captureProtocol) && fixtures.captureProtocol.length >= 5, "Capture protocol is too thin");
assert(Array.isArray(fixtures.sources) && fixtures.sources.length >= 5, "Expected at least one source per crop");
assert(Array.isArray(fixtures.fixtureGroups) && fixtures.fixtureGroups.length === 5, "Expected five public print fixture groups");

for (const source of fixtures.sources) {
  assert(source.id && source.title && source.url, `Source is incomplete: ${JSON.stringify(source)}`);
  assert(/^https:\/\//.test(source.url), `Source must be an https URL: ${source.id}`);
  assert(Array.isArray(source.bestFor) && source.bestFor.length, `Source needs bestFor notes: ${source.id}`);
  assert(Array.isArray(source.limits) && source.limits.length, `Source needs limits notes: ${source.id}`);
}

for (const group of fixtures.fixtureGroups) {
  assert(group.id && group.cropKey && group.expectedConditionId, `Fixture group is incomplete: ${JSON.stringify(group)}`);
  assert(conditions.has(group.expectedConditionId), `Unknown expected condition id: ${group.expectedConditionId}`);
  for (const conditionId of group.secondaryConditionIds || []) {
    assert(conditions.has(conditionId), `Unknown secondary condition id: ${conditionId}`);
  }
  assert(group.minimumSourcePhotos >= 5, `Fixture group needs at least five source photos: ${group.id}`);
  assert(Array.isArray(group.photoTypes) && group.photoTypes.length, `Fixture group needs photo types: ${group.id}`);
  assert(Array.isArray(group.sourceRefs) && group.sourceRefs.length, `Fixture group needs sources: ${group.id}`);
  assert(Array.isArray(group.evidenceChecklist) && group.evidenceChecklist.length >= 4, `Fixture group needs expert evidence checklist: ${group.id}`);
  assert(Array.isArray(group.passFailRules) && group.passFailRules.length >= 3, `Fixture group needs pass/fail rules: ${group.id}`);
  for (const ref of group.sourceRefs) {
    assert(sourceIds.has(ref.sourceId), `Unknown source ref ${ref.sourceId} in ${group.id}`);
    assert(ref.role, `Source ref needs role in ${group.id}`);
    assert(Array.isArray(ref.printTargets) && ref.printTargets.length, `Source ref needs print targets in ${group.id}`);
  }
}

console.log(`public-photo-fixtures-smoke-ok groups=${fixtures.fixtureGroups.length} sources=${fixtures.sources.length}`);
