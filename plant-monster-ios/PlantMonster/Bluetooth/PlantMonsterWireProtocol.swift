import Foundation

struct PlantMonsterCommandAcknowledgement: Equatable, Sendable {
    enum Status: Equatable, Sendable {
        case applied
        case unsupported
        case invalidPayload
        case busy
        case failed(code: UInt8)

        init(wireValue: UInt8) {
            switch wireValue {
            case 1: self = .applied
            case 2: self = .unsupported
            case 3: self = .invalidPayload
            case 4: self = .busy
            default: self = .failed(code: wireValue)
            }
        }
    }

    let sequence: UInt8
    let status: Status
}

struct PlantMonsterTelemetryUpdate: Equatable, Sendable {
    let telemetry: PlantTelemetry
    let expression: PlantExpression?
    let acknowledgement: PlantMonsterCommandAcknowledgement?
}

enum PlantMonsterWireProtocolError: Error, Equatable {
    case invalidLength(expected: Int, actual: Int)
    case invalidMagic
    case unsupportedVersion(UInt8)
    case unexpectedPacketType(UInt8)
    case checksumMismatch
    case invalidTelemetryValue
    case invalidExpression
}

enum PlantMonsterWireProtocol {
    static let magic: UInt8 = 0xA5
    static let version: UInt8 = 0x01
    static let telemetryPacketType: UInt8 = 0x01
    static let commandPacketType: UInt8 = 0x10
    static let telemetryPacketLength = 20
    static let commandPacketLength = 8

    static func encodeCommand(_ command: PlantMonsterCommand, sequence: UInt8) throws -> Data {
        guard sequence != 0 else { throw PlantMonsterBLEError.invalidCommand }

        let commandID: UInt8
        let value: UInt8
        switch command {
        case .identify:
            commandID = 0x01
            value = 0
        case let .showExpression(expression):
            commandID = 0x02
            value = expression.protocolID
        }

        var bytes: [UInt8] = [
            magic,
            version,
            commandPacketType,
            sequence,
            commandID,
            value,
            0
        ]
        bytes.append(crc8(bytes))
        return Data(bytes)
    }

    static func decodeTelemetry(_ data: Data) throws -> PlantMonsterTelemetryUpdate {
        let bytes = [UInt8](data)
        guard bytes.count == telemetryPacketLength else {
            throw PlantMonsterWireProtocolError.invalidLength(
                expected: telemetryPacketLength,
                actual: bytes.count
            )
        }
        guard bytes[0] == magic else { throw PlantMonsterWireProtocolError.invalidMagic }
        guard bytes[1] == version else {
            throw PlantMonsterWireProtocolError.unsupportedVersion(bytes[1])
        }
        guard bytes[2] == telemetryPacketType else {
            throw PlantMonsterWireProtocolError.unexpectedPacketType(bytes[2])
        }
        guard crc8(bytes.dropLast()) == bytes[19] else {
            throw PlantMonsterWireProtocolError.checksumMismatch
        }

        let flags = bytes[3]
        guard flags & 0xFC == 0 else {
            throw PlantMonsterWireProtocolError.invalidTelemetryValue
        }
        let temperature = Double(Int16(bitPattern: uint16(bytes, at: 6))) / 100
        let airHumidity = Double(uint16(bytes, at: 8)) / 100
        let substrateRaw = uint16(bytes, at: 10)
        let substrateMoisture = substrateRaw == UInt16.max ? nil : Double(substrateRaw) / 100
        let light = Double(uint32(bytes, at: 12))

        guard (-40...85).contains(temperature),
              (0...100).contains(airHumidity),
              substrateMoisture.map({ (0...100).contains($0) }) ?? true,
              (0...200_000).contains(light)
        else {
            throw PlantMonsterWireProtocolError.invalidTelemetryValue
        }

        let expression: PlantExpression?
        if bytes[16] == 0 {
            expression = nil
        } else {
            guard let decodedExpression = PlantExpression(protocolID: bytes[16]) else {
                throw PlantMonsterWireProtocolError.invalidExpression
            }
            expression = decodedExpression
        }

        let acknowledgement: PlantMonsterCommandAcknowledgement?
        if bytes[18] == 0 {
            acknowledgement = nil
        } else {
            guard bytes[17] != 0 else {
                throw PlantMonsterWireProtocolError.invalidTelemetryValue
            }
            acknowledgement = PlantMonsterCommandAcknowledgement(
                sequence: bytes[17],
                status: .init(wireValue: bytes[18])
            )
        }

        return PlantMonsterTelemetryUpdate(
            telemetry: PlantTelemetry(
                temperatureCelsius: temperature,
                airHumidityPercent: airHumidity,
                substrateMoisturePercent: substrateMoisture,
                lightLux: light,
                isTouched: flags & 0x01 != 0,
                isMoving: flags & 0x02 != 0,
                receivedAt: .now
            ),
            expression: expression,
            acknowledgement: acknowledgement
        )
    }

    static func crc8<C: Collection>(_ bytes: C) -> UInt8 where C.Element == UInt8 {
        var checksum: UInt8 = 0
        for byte in bytes {
            checksum ^= byte
            for _ in 0..<8 {
                if checksum & 0x80 != 0 {
                    checksum = (checksum << 1) ^ 0x07
                } else {
                    checksum <<= 1
                }
            }
        }
        return checksum
    }

    private static func uint16(_ bytes: [UInt8], at offset: Int) -> UInt16 {
        UInt16(bytes[offset]) | (UInt16(bytes[offset + 1]) << 8)
    }

    private static func uint32(_ bytes: [UInt8], at offset: Int) -> UInt32 {
        UInt32(bytes[offset])
            | (UInt32(bytes[offset + 1]) << 8)
            | (UInt32(bytes[offset + 2]) << 16)
            | (UInt32(bytes[offset + 3]) << 24)
    }
}
