import Foundation

enum PlantMonsterConnectionState: Equatable, Sendable {
    case disconnected
    case waitingForBluetooth
    case scanning
    case connecting(name: String)
    case discovering
    case connected(name: String)
    case demo
    case failed(message: String)
}

enum PlantMonsterCommand: Sendable {
    case identify
    case showExpression(PlantExpression)
}

protocol PlantMonsterBLEClientDelegate: AnyObject {
    func plantMonsterClient(
        _ client: any PlantMonsterBLEClient,
        didChange state: PlantMonsterConnectionState
    )
    func plantMonsterClient(
        _ client: any PlantMonsterBLEClient,
        didReceive update: PlantMonsterTelemetryUpdate
    )
}

protocol PlantMonsterBLEClient: AnyObject {
    var delegate: (any PlantMonsterBLEClientDelegate)? { get set }
    func startPairing()
    func disconnect()
    @discardableResult
    func send(_ command: PlantMonsterCommand) throws -> UInt8
}

enum PlantMonsterBLEClientFactory {
    static func makeDefault() -> any PlantMonsterBLEClient {
#if targetEnvironment(simulator)
        return MockPlantMonsterBLEClient()
#else
        return CoreBluetoothPlantMonsterClient(profile: .production)
#endif
    }
}
