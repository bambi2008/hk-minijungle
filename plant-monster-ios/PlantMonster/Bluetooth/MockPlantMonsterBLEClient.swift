import Foundation

final class MockPlantMonsterBLEClient: PlantMonsterBLEClient {
    weak var delegate: (any PlantMonsterBLEClientDelegate)?

    private var timer: Timer?
    private var connectWorkItem: DispatchWorkItem?
    private var tick = 0.0
    private var nextCommandSequence: UInt8 = 1

    func startPairing() {
        connectWorkItem?.cancel()
        delegate?.plantMonsterClient(self, didChange: .scanning)

        let item = DispatchWorkItem { [weak self] in
            guard let self else { return }
            self.delegate?.plantMonsterClient(self, didChange: .connecting(name: "Moss 01"))

            let finish = DispatchWorkItem { [weak self] in
                guard let self else { return }
                self.delegate?.plantMonsterClient(self, didChange: .connected(name: "Moss 01"))
                self.startTelemetry()
            }
            self.connectWorkItem = finish
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8, execute: finish)
        }
        connectWorkItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.9, execute: item)
    }

    func disconnect() {
        connectWorkItem?.cancel()
        timer?.invalidate()
        timer = nil
        delegate?.plantMonsterClient(self, didChange: .disconnected)
    }

    @discardableResult
    func send(_ command: PlantMonsterCommand) throws -> UInt8 {
        let sequence = nextCommandSequence
        nextCommandSequence = sequence == UInt8.max ? 1 : sequence + 1

        if case let .showExpression(expression) = command {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) { [weak self] in
                guard let self else { return }
                self.delegate?.plantMonsterClient(
                    self,
                    didReceive: PlantMonsterTelemetryUpdate(
                        telemetry: .sample,
                        expression: expression,
                        acknowledgement: PlantMonsterCommandAcknowledgement(
                            sequence: sequence,
                            status: .applied
                        )
                    )
                )
            }
        }
        return sequence
    }

    private func startTelemetry() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 3, repeats: true) { [weak self] _ in
            guard let self else { return }
            self.tick += 0.65
            let sample = PlantTelemetry(
                temperatureCelsius: 22 + sin(self.tick) * 0.8,
                airHumidityPercent: 56 + cos(self.tick * 0.7) * 2.5,
                substrateMoisturePercent: 43 + sin(self.tick * 0.2) * 1.5,
                lightLux: 92 + sin(self.tick * 0.4) * 18,
                isTouched: false,
                isMoving: Int(self.tick.rounded()) % 9 == 0,
                receivedAt: .now
            )
            self.delegate?.plantMonsterClient(
                self,
                didReceive: PlantMonsterTelemetryUpdate(
                    telemetry: sample,
                    expression: nil,
                    acknowledgement: nil
                )
            )
        }
    }
}
