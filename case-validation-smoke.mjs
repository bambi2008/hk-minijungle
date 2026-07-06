import { buildCaseValidationSuite, caseValidationStats } from "./case-validation.mjs";
import { matchPathologyConditions } from "./pathology-library.mjs";

const suite = buildCaseValidationSuite();
const stats = caseValidationStats(suite);
if (!stats.ready || stats.conditions !== 44 || stats.photoFixtures < 176 || stats.minPhotosPerCondition < 3) {
  throw new Error(`Case validation coverage mismatch: ${JSON.stringify(stats)}`);
}

const failures = [];
suite.cases.forEach((item) => {
  item.photoFixtures.slice(0, 3).forEach((fixture) => {
    const matches = matchPathologyConditions(fixture.state, { visionLabels: fixture.visionLabels });
    if (!matches.slice(0, 5).some((match) => match.id === item.conditionId)) {
      failures.push(`${item.conditionId}:${fixture.fixtureKind}`);
    }
  });
});

if (failures.length) {
  throw new Error(`Case validation fixtures did not match expected condition: ${failures.slice(0, 12).join(", ")}`);
}

console.log(`case-validation-smoke-ok conditions=${stats.conditions} photoFixtures=${stats.photoFixtures}`);
