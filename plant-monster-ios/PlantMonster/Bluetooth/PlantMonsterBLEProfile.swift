import CoreBluetooth

struct PlantMonsterBLEProfile: Sendable {
    /// Replace these nil values when the ESP32-C3 firmware team freezes the GATT contract.
    /// Keeping the UUIDs in one file prevents UI code from depending on transport details.
    static let production = PlantMonsterBLEProfile(
        advertisedNamePrefixes: ["Plant Monster", "PlantMonster", "ZhiLingShou"],
        serviceUUIDString: nil,
        telemetryCharacteristicUUIDString: nil,
        commandCharacteristicUUIDString: nil
    )

    let advertisedNamePrefixes: [String]
    let serviceUUIDString: String?
    let telemetryCharacteristicUUIDString: String?
    let commandCharacteristicUUIDString: String?

    var serviceUUID: CBUUID? { serviceUUIDString.map(CBUUID.init(string:)) }
    var telemetryCharacteristicUUID: CBUUID? {
        telemetryCharacteristicUUIDString.map(CBUUID.init(string:))
    }
    var commandCharacteristicUUID: CBUUID? {
        commandCharacteristicUUIDString.map(CBUUID.init(string:))
    }
}

