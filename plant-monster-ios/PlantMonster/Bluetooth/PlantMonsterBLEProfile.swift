import CoreBluetooth

struct PlantMonsterBLEProfile: Sendable {
    /// Plant Monster BLE Protocol V1. These values are frozen and must match the ESP32-C3 firmware.
    static let production = PlantMonsterBLEProfile(
        advertisedNamePrefixes: ["Plant Monster", "PlantMonster", "ZhiLingShou"],
        serviceUUIDString: "7A3E0001-7E5B-4B7C-A1A0-6C6B504D0001",
        telemetryCharacteristicUUIDString: "7A3E0002-7E5B-4B7C-A1A0-6C6B504D0001",
        commandCharacteristicUUIDString: "7A3E0003-7E5B-4B7C-A1A0-6C6B504D0001"
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
