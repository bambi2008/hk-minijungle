import XCTest
@testable import PlantMonster

final class TelemetryPacketDecoderTests: XCTestCase {
    func testDecodesProvisionalFirmwarePacket() throws {
        let data = Data(#"{"t":22.4,"rh":56,"lux":320,"touch":true,"moving":false,"expr":"T02"}"#.utf8)

        let result = try TelemetryPacketDecoder.decode(data)

        XCTAssertEqual(result.telemetry.temperatureCelsius, 22.4, accuracy: 0.001)
        XCTAssertEqual(result.telemetry.airHumidityPercent, 56, accuracy: 0.001)
        XCTAssertEqual(result.telemetry.lightLux, 320, accuracy: 0.001)
        XCTAssertTrue(result.telemetry.isTouched)
        XCTAssertFalse(result.telemetry.isMoving)
        XCTAssertEqual(result.expression, .pet)
    }

    func testRejectsIncompletePacket() {
        let data = Data(#"{"t":22.4,"rh":56}"#.utf8)
        XCTAssertThrowsError(try TelemetryPacketDecoder.decode(data))
    }

    func testExpressionAssetsAreUnique() {
        let names = PlantExpression.allCases.map(\.assetName)
        XCTAssertEqual(Set(names).count, PlantExpression.allCases.count)
    }
}

