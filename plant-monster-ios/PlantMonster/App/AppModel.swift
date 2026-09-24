import Combine
import Foundation
import UIKit

@MainActor
final class AppModel: ObservableObject {
    @Published private(set) var connectionState: PlantMonsterConnectionState = .disconnected
    @Published private(set) var telemetry: PlantTelemetry = .sample
    @Published private(set) var currentExpression: PlantExpression = .idleMean
    @Published private(set) var memories: [MemoryEvent] = MemoryEvent.samples
    @Published private(set) var isTouchActive = false
    @Published var hapticsEnabled = true

    private let client: any PlantMonsterBLEClient
    private var expressionResetTask: Task<Void, Never>?
    private var previousTelemetry = PlantTelemetry.sample
    private var isDemoActive = false

    init(client: any PlantMonsterBLEClient) {
        self.client = client
        self.client.delegate = self
    }

    var isReady: Bool {
        switch connectionState {
        case .connected, .demo: true
        default: false
        }
    }

    var connectionLabel: String {
        switch connectionState {
        case .connected: String(localized: "status.aliveWithYou")
        case .demo: String(localized: "status.demo")
        case .scanning: String(localized: "status.searching")
        case .connecting, .discovering, .waitingForBluetooth: String(localized: "status.connecting")
        case .failed: String(localized: "status.needsAttention")
        case .disconnected: String(localized: "status.offline")
        }
    }

    var careHeadline: String {
        if telemetry.temperatureCelsius < 16 { return String(localized: "care.warmUp") }
        if telemetry.temperatureCelsius > 30 { return String(localized: "care.coolDown") }
        if telemetry.lightLux < 150 { return String(localized: "care.findLight") }
        if telemetry.lightLux > 1_200 { return String(localized: "care.lessLight") }
        return String(localized: "care.comfortable")
    }

    var careDetail: String {
        if telemetry.temperatureCelsius < 16 { return String(localized: "care.detail.cold") }
        if telemetry.temperatureCelsius > 30 { return String(localized: "care.detail.hot") }
        if telemetry.lightLux < 150 { return String(localized: "care.detail.lowLight") }
        if telemetry.lightLux > 1_200 { return String(localized: "care.detail.bright") }
        return String(localized: "care.detail.good")
    }

    func startPairing() {
        isDemoActive = false
        client.startPairing()
    }

    func enterDemoMode() {
        isDemoActive = true
        client.disconnect()
        connectionState = .demo
        telemetry = .sample
        currentExpression = .idleMean
    }

    func disconnect() {
        isDemoActive = false
        client.disconnect()
    }

    func recordLightMoment() {
        memories.insert(
            MemoryEvent(
                date: .now,
                title: String(localized: "memory.savedLight"),
                kind: .light,
                expression: currentExpression
            ),
            at: 0
        )
        if hapticsEnabled {
            UISelectionFeedbackGenerator().selectionChanged()
        }
    }

    func pet() {
        expressionResetTask?.cancel()
        isTouchActive = true
        currentExpression = .pet

        if hapticsEnabled {
            UIImpactFeedbackGenerator(style: .soft).impactOccurred()
        }

        memories.insert(
            MemoryEvent(
                date: .now,
                title: String(localized: "memory.youWereHere"),
                kind: .touch,
                expression: .pet
            ),
            at: 0
        )

        try? client.send(.showExpression(.pet))
        expressionResetTask = Task { [weak self] in
            try? await Task<Never, Never>.sleep(for: .milliseconds(1_400))
            guard !Task.isCancelled, let self else { return }
            self.isTouchActive = false
            self.currentExpression = self.inferredExpression(from: self.telemetry)
        }
    }

    private func apply(_ telemetry: PlantTelemetry, expression: PlantExpression?) {
        let wasMoving = previousTelemetry.isMoving
        let wasTouched = previousTelemetry.isTouched
        previousTelemetry = telemetry
        self.telemetry = telemetry

        if let expression {
            currentExpression = expression
        } else if !isTouchActive {
            currentExpression = inferredExpression(from: telemetry)
        }

        if telemetry.isMoving && !wasMoving {
            memories.insert(
                MemoryEvent(
                    date: .now,
                    title: String(localized: "memory.pickedUp"),
                    kind: .motion,
                    expression: .pickup
                ),
                at: 0
            )
        }

        if telemetry.isTouched && !wasTouched {
            pet()
        }
    }

    private func inferredExpression(from telemetry: PlantTelemetry) -> PlantExpression {
        if telemetry.isMoving { return .pickup }
        if telemetry.temperatureCelsius < 16 { return .cold }
        if telemetry.temperatureCelsius > 30 { return .hot }
        if telemetry.lightLux < 150 { return .findLight }
        if telemetry.lightLux > 1_200 { return .tooBright }
        if (250...900).contains(telemetry.lightLux) { return .sunComfy }
        return .idleMean
    }
}

extension AppModel: PlantMonsterBLEClientDelegate {
    nonisolated func plantMonsterClient(
        _ client: any PlantMonsterBLEClient,
        didChange state: PlantMonsterConnectionState
    ) {
        Task { @MainActor [weak self] in
            guard let self, !self.isDemoActive else { return }
            self.connectionState = state
        }
    }

    nonisolated func plantMonsterClient(
        _ client: any PlantMonsterBLEClient,
        didReceive telemetry: PlantTelemetry,
        expression: PlantExpression?
    ) {
        Task { @MainActor [weak self] in
            self?.apply(telemetry, expression: expression)
        }
    }
}
