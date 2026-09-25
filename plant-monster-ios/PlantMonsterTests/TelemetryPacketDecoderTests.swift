import XCTest
@testable import PlantMonster

final class TelemetryPacketDecoderTests: XCTestCase {
    func testDecodesLegacyJSONFirmwarePacketDuringMigration() throws {
        let data = Data(#"{"t":22.4,"rh":56,"sm":43,"lux":320,"touch":true,"moving":false,"expr":"T02"}"#.utf8)

        let result = try TelemetryPacketDecoder.decode(data)

        XCTAssertEqual(result.telemetry.temperatureCelsius, 22.4, accuracy: 0.001)
        XCTAssertEqual(result.telemetry.airHumidityPercent, 56, accuracy: 0.001)
        XCTAssertEqual(try XCTUnwrap(result.telemetry.substrateMoisturePercent), 43, accuracy: 0.001)
        XCTAssertEqual(result.telemetry.lightLux, 320, accuracy: 0.001)
        XCTAssertTrue(result.telemetry.isTouched)
        XCTAssertFalse(result.telemetry.isMoving)
        XCTAssertEqual(result.expression, .pet)
        XCTAssertNil(result.acknowledgement)
    }

    func testAllowsOlderPacketWithoutSubstrateMoisture() throws {
        let data = Data(#"{"t":22.4,"rh":56,"lux":320}"#.utf8)

        let result = try TelemetryPacketDecoder.decode(data)

        XCTAssertNil(result.telemetry.substrateMoisturePercent)
    }

    func testRejectsIncompletePacket() {
        let data = Data(#"{"t":22.4,"rh":56}"#.utf8)
        XCTAssertThrowsError(try TelemetryPacketDecoder.decode(data))
    }

    func testExpressionAssetsAreUnique() {
        let names = PlantExpression.allCases.map(\.assetName)
        XCTAssertEqual(Set(names).count, PlantExpression.allCases.count)
    }

    func testDecodesV1BinaryTelemetryAndAcknowledgement() throws {
        let packet = makeTelemetryPacket(
            flags: 0x03,
            temperatureCentiCelsius: 2_240,
            airHumidityCentiPercent: 5_600,
            substrateCentiPercent: 4_300,
            lux: 320,
            expressionID: PlantExpression.pet.protocolID,
            acknowledgedSequence: 9,
            acknowledgementStatus: 1
        )

        let result = try TelemetryPacketDecoder.decode(Data(packet))

        XCTAssertEqual(result.telemetry.temperatureCelsius, 22.4, accuracy: 0.001)
        XCTAssertEqual(result.telemetry.airHumidityPercent, 56, accuracy: 0.001)
        XCTAssertEqual(try XCTUnwrap(result.telemetry.substrateMoisturePercent), 43, accuracy: 0.001)
        XCTAssertEqual(result.telemetry.lightLux, 320, accuracy: 0.001)
        XCTAssertTrue(result.telemetry.isTouched)
        XCTAssertTrue(result.telemetry.isMoving)
        XCTAssertEqual(result.expression, .pet)
        XCTAssertEqual(
            result.acknowledgement,
            PlantMonsterCommandAcknowledgement(sequence: 9, status: .applied)
        )
    }

    func testV1UsesUnavailableSubstrateSentinel() throws {
        let packet = makeTelemetryPacket(substrateCentiPercent: UInt16.max)
        let result = try TelemetryPacketDecoder.decode(Data(packet))
        XCTAssertNil(result.telemetry.substrateMoisturePercent)
    }

    func testRejectsV1PacketWithInvalidChecksum() {
        var packet = makeTelemetryPacket()
        packet[8] ^= 0x01
        XCTAssertThrowsError(try TelemetryPacketDecoder.decode(Data(packet))) { error in
            XCTAssertEqual(error as? PlantMonsterWireProtocolError, .checksumMismatch)
        }
    }

    func testEncodesTouchCommandWithSequence() throws {
        let data = try PlantMonsterWireProtocol.encodeCommand(.showExpression(.pet), sequence: 9)
        let bytes = [UInt8](data)

        XCTAssertEqual(bytes.count, 8)
        XCTAssertEqual(Array(bytes.prefix(7)), [0xA5, 0x01, 0x10, 0x09, 0x02, 0x0D, 0x00])
        XCTAssertEqual(bytes[7], PlantMonsterWireProtocol.crc8(bytes.prefix(7)))
    }

    func testCRC8ATMStandardVector() {
        XCTAssertEqual(PlantMonsterWireProtocol.crc8(Array("123456789".utf8)), 0xF4)
    }

    func testExpressionProtocolIDsRoundTrip() {
        for expression in PlantExpression.allCases {
            XCTAssertEqual(PlantExpression(protocolID: expression.protocolID), expression)
        }
    }

    private func makeTelemetryPacket(
        flags: UInt8 = 0,
        temperatureCentiCelsius: Int16 = 2_200,
        airHumidityCentiPercent: UInt16 = 5_600,
        substrateCentiPercent: UInt16 = 4_300,
        lux: UInt32 = 86,
        expressionID: UInt8 = 0,
        acknowledgedSequence: UInt8 = 0,
        acknowledgementStatus: UInt8 = 0
    ) -> [UInt8] {
        var bytes: [UInt8] = [0xA5, 0x01, 0x01, flags, 0x01, 0x00]
        append(UInt16(bitPattern: temperatureCentiCelsius), to: &bytes)
        append(airHumidityCentiPercent, to: &bytes)
        append(substrateCentiPercent, to: &bytes)
        append(lux, to: &bytes)
        bytes.append(expressionID)
        bytes.append(acknowledgedSequence)
        bytes.append(acknowledgementStatus)
        bytes.append(PlantMonsterWireProtocol.crc8(bytes))
        return bytes
    }

    private func append(_ value: UInt16, to bytes: inout [UInt8]) {
        bytes.append(UInt8(truncatingIfNeeded: value))
        bytes.append(UInt8(truncatingIfNeeded: value >> 8))
    }

    private func append(_ value: UInt32, to bytes: inout [UInt8]) {
        bytes.append(UInt8(truncatingIfNeeded: value))
        bytes.append(UInt8(truncatingIfNeeded: value >> 8))
        bytes.append(UInt8(truncatingIfNeeded: value >> 16))
        bytes.append(UInt8(truncatingIfNeeded: value >> 24))
    }
}
