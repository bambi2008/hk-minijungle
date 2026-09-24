import CoreBluetooth
import Foundation

enum PlantMonsterBLEError: LocalizedError {
    case gattProfileNotConfigured
    case commandCharacteristicUnavailable
    case invalidCommand

    var errorDescription: String? {
        switch self {
        case .gattProfileNotConfigured:
            "The Bluetooth profile has not been configured."
        case .commandCharacteristicUnavailable:
            "Plant Monster is connected, but its command channel is unavailable."
        case .invalidCommand:
            "The command could not be encoded."
        }
    }
}

final class CoreBluetoothPlantMonsterClient: NSObject, PlantMonsterBLEClient {
    weak var delegate: (any PlantMonsterBLEClientDelegate)?

    private let profile: PlantMonsterBLEProfile
    private var central: CBCentralManager?
    private var peripheral: CBPeripheral?
    private var commandCharacteristic: CBCharacteristic?
    private var pairingRequested = false
    private var scanTimeoutWorkItem: DispatchWorkItem?

    init(profile: PlantMonsterBLEProfile) {
        self.profile = profile
        super.init()
    }

    func startPairing() {
        pairingRequested = true
        if central == nil {
            delegate?.plantMonsterClient(self, didChange: .waitingForBluetooth)
            central = CBCentralManager(delegate: self, queue: .main)
        } else {
            beginScanWhenReady()
        }
    }

    func disconnect() {
        pairingRequested = false
        scanTimeoutWorkItem?.cancel()
        central?.stopScan()
        if let peripheral {
            central?.cancelPeripheralConnection(peripheral)
        }
        self.peripheral = nil
        commandCharacteristic = nil
        delegate?.plantMonsterClient(self, didChange: .disconnected)
    }

    func send(_ command: PlantMonsterCommand) throws {
        guard let data = command.data else { throw PlantMonsterBLEError.invalidCommand }
        guard let peripheral, let commandCharacteristic else {
            throw PlantMonsterBLEError.commandCharacteristicUnavailable
        }
        let writeType: CBCharacteristicWriteType
        if commandCharacteristic.properties.contains(.write) {
            writeType = .withResponse
        } else if commandCharacteristic.properties.contains(.writeWithoutResponse) {
            writeType = .withoutResponse
        } else {
            throw PlantMonsterBLEError.commandCharacteristicUnavailable
        }
        peripheral.writeValue(data, for: commandCharacteristic, type: writeType)
    }

    private func beginScanWhenReady() {
        guard pairingRequested, let central else { return }
        guard central.state == .poweredOn else {
            delegate?.plantMonsterClient(self, didChange: .waitingForBluetooth)
            return
        }
        central.stopScan()
        let services = profile.serviceUUID.map { [$0] }
        delegate?.plantMonsterClient(self, didChange: .scanning)
        central.scanForPeripherals(
            withServices: services,
            options: [CBCentralManagerScanOptionAllowDuplicatesKey: false]
        )
        scanTimeoutWorkItem?.cancel()
        let timeout = DispatchWorkItem { [weak self] in
            guard let self, self.pairingRequested, self.peripheral == nil else { return }
            self.central?.stopScan()
            self.delegate?.plantMonsterClient(
                self,
                didChange: .failed(message: "No Plant Monster was found nearby.")
            )
        }
        scanTimeoutWorkItem = timeout
        DispatchQueue.main.asyncAfter(deadline: .now() + 15, execute: timeout)
    }

    private func matchesExpectedDevice(_ peripheral: CBPeripheral, advertisementData: [String: Any]) -> Bool {
        guard profile.serviceUUID == nil else { return true }
        let name = (advertisementData[CBAdvertisementDataLocalNameKey] as? String) ?? peripheral.name ?? ""
        return profile.advertisedNamePrefixes.contains { prefix in
            name.localizedCaseInsensitiveContains(prefix)
        }
    }
}

extension CoreBluetoothPlantMonsterClient: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        switch central.state {
        case .poweredOn:
            beginScanWhenReady()
        case .poweredOff:
            delegate?.plantMonsterClient(self, didChange: .failed(message: "Bluetooth is turned off."))
        case .unauthorized:
            delegate?.plantMonsterClient(self, didChange: .failed(message: "Bluetooth access was not allowed."))
        case .unsupported:
            delegate?.plantMonsterClient(self, didChange: .failed(message: "Bluetooth Low Energy is not supported on this device."))
        case .resetting, .unknown:
            delegate?.plantMonsterClient(self, didChange: .waitingForBluetooth)
        @unknown default:
            delegate?.plantMonsterClient(self, didChange: .failed(message: "Bluetooth is unavailable."))
        }
    }

    func centralManager(
        _ central: CBCentralManager,
        didDiscover peripheral: CBPeripheral,
        advertisementData: [String: Any],
        rssi RSSI: NSNumber
    ) {
        guard matchesExpectedDevice(peripheral, advertisementData: advertisementData) else { return }
        scanTimeoutWorkItem?.cancel()
        central.stopScan()
        self.peripheral = peripheral
        peripheral.delegate = self
        let name = peripheral.name ?? "Plant Monster"
        delegate?.plantMonsterClient(self, didChange: .connecting(name: name))
        central.connect(peripheral)
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        scanTimeoutWorkItem?.cancel()
        let name = peripheral.name ?? "Plant Monster"
        if profile.serviceUUID == nil {
            delegate?.plantMonsterClient(self, didChange: .connected(name: name))
            return
        }
        delegate?.plantMonsterClient(self, didChange: .discovering)
        peripheral.discoverServices(profile.serviceUUID.map { [$0] })
    }

    func centralManager(
        _ central: CBCentralManager,
        didFailToConnect peripheral: CBPeripheral,
        error: Error?
    ) {
        delegate?.plantMonsterClient(
            self,
            didChange: .failed(message: error?.localizedDescription ?? "Could not connect to Plant Monster.")
        )
    }

    func centralManager(
        _ central: CBCentralManager,
        didDisconnectPeripheral peripheral: CBPeripheral,
        error: Error?
    ) {
        self.peripheral = nil
        commandCharacteristic = nil
        if pairingRequested, let error {
            delegate?.plantMonsterClient(self, didChange: .failed(message: error.localizedDescription))
        } else {
            delegate?.plantMonsterClient(self, didChange: .disconnected)
        }
    }
}

extension CoreBluetoothPlantMonsterClient: CBPeripheralDelegate {
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        if let error {
            delegate?.plantMonsterClient(self, didChange: .failed(message: error.localizedDescription))
            return
        }
        guard
            let serviceUUID = profile.serviceUUID,
            let service = peripheral.services?.first(where: { $0.uuid == serviceUUID })
        else {
            delegate?.plantMonsterClient(self, didChange: .failed(message: "Plant Monster service was not found."))
            return
        }
        let ids = [profile.telemetryCharacteristicUUID, profile.commandCharacteristicUUID].compactMap { $0 }
        peripheral.discoverCharacteristics(ids, for: service)
    }

    func peripheral(
        _ peripheral: CBPeripheral,
        didDiscoverCharacteristicsFor service: CBService,
        error: Error?
    ) {
        if let error {
            delegate?.plantMonsterClient(self, didChange: .failed(message: error.localizedDescription))
            return
        }

        for characteristic in service.characteristics ?? [] {
            if let telemetryUUID = profile.telemetryCharacteristicUUID,
               characteristic.uuid == telemetryUUID {
                peripheral.setNotifyValue(true, for: characteristic)
            }
            if let commandUUID = profile.commandCharacteristicUUID,
               characteristic.uuid == commandUUID {
                commandCharacteristic = characteristic
            }
        }
        delegate?.plantMonsterClient(
            self,
            didChange: .connected(name: peripheral.name ?? "Plant Monster")
        )
    }

    func peripheral(
        _ peripheral: CBPeripheral,
        didUpdateValueFor characteristic: CBCharacteristic,
        error: Error?
    ) {
        guard error == nil, let data = characteristic.value else { return }
        guard let decoded = try? TelemetryPacketDecoder.decode(data) else { return }
        delegate?.plantMonsterClient(
            self,
            didReceive: decoded.telemetry,
            expression: decoded.expression
        )
    }
}
