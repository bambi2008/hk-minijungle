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

    var data: Data? {
        let object: [String: String]
        switch self {
        case .identify:
            object = ["command": "identify"]
        case let .showExpression(expression):
            object = ["command": "expression", "value": expression.rawValue]
        }
        return try? JSONSerialization.data(withJSONObject: object)
    }
}

protocol PlantMonsterBLEClientDelegate: AnyObject {
    func plantMonsterClient(
        _ client: any PlantMonsterBLEClient,
        didChange state: PlantMonsterConnectionState
    )
    func plantMonsterClient(
        _ client: any PlantMonsterBLEClient,
        didReceive telemetry: PlantTelemetry,
        expression: PlantExpression?
    )
}

protocol PlantMonsterBLEClient: AnyObject {
    var delegate: (any PlantMonsterBLEClientDelegate)? { get set }
    func startPairing()
    func disconnect()
    func send(_ command: PlantMonsterCommand) throws
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

