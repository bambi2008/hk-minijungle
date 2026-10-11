import XCTest
@testable import PlantMonster

final class CreatureInterpreterTests: XCTestCase {
    func testSubstrateDrynessBecomesThirstyFeeling() {
        let telemetry = PlantTelemetry(
            temperatureCelsius: 22,
            airHumidityPercent: 56,
            substrateMoisturePercent: 24,
            lightLux: 400,
            isTouched: false,
            isMoving: false,
            receivedAt: .now
        )

        XCTAssertEqual(CreatureInterpreter.feeling(for: telemetry, hour: 12).kind, .thirsty)
    }

    func testDryAirNeverPretendsTheSubstrateIsThirsty() {
        let telemetry = PlantTelemetry(
            temperatureCelsius: 22,
            airHumidityPercent: 28,
            substrateMoisturePercent: 48,
            lightLux: 400,
            isTouched: false,
            isMoving: false,
            receivedAt: .now
        )

        XCTAssertEqual(CreatureInterpreter.feeling(for: telemetry, hour: 12).kind, .dryAir)
    }

    func testMovementTakesPriorityAsTheImmediateMoment() {
        let telemetry = PlantTelemetry(
            temperatureCelsius: 22,
            airHumidityPercent: 56,
            substrateMoisturePercent: 24,
            lightLux: 80,
            isTouched: false,
            isMoving: true,
            receivedAt: .now
        )

        XCTAssertEqual(CreatureInterpreter.feeling(for: telemetry, hour: 12).kind, .curious)
    }

    func testEvidenceKeepsAirAndSubstrateHumiditySeparate() {
        let telemetry = PlantTelemetry.sample
        let evidence = CreatureInterpreter.evidence(for: telemetry)

        XCTAssertNotNil(evidence.first { $0.id == "airHumidity" })
        XCTAssertNotNil(evidence.first { $0.id == "substrate" })
        XCTAssertEqual(evidence.count, 4)
    }
}
