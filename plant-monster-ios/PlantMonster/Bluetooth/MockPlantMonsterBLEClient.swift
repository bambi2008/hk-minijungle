import Foundation

final class MockPlantMonsterBLEClient: PlantMonsterBLEClient {
    weak var delegate: (any PlantMonsterBLEClientDelegate)?

    private var timer: Timer?
    private var connectWorkItem: DispatchWorkItem?
    private var tick = 0.0

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

    func send(_ command: PlantMonsterCommand) throws {
        if case let .showExpression(expression) = command {
            delegate?.plantMonsterClient(
                self,
                didReceive: .sample,
                expression: expression
            )
        }
    }

    private func startTelemetry() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 3, repeats: true) { [weak self] _ in
            guard let self else { return }
            self.tick += 0.65
            let sample = PlantTelemetry(
                temperatureCelsius: 22 + sin(self.tick) * 0.8,
                airHumidityPercent: 56 + cos(self.tick * 0.7) * 2.5,
                lightLux: 92 + sin(self.tick * 0.4) * 18,
                isTouched: false,
                isMoving: false,
                receivedAt: .now
            )
            self.delegate?.plantMonsterClient(self, didReceive: sample, expression: nil)
        }
    }
}

