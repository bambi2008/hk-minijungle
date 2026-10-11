import CoreMotion
import Combine
import Foundation

@MainActor
final class SharedJourneyStore: ObservableObject {
    enum State: Equatable {
        case idle
        case loading
        case active
        case denied
        case unavailable
        case failed
    }

    @Published private(set) var stepsToday = 0
    @Published private(set) var distanceMeters: Double?
    @Published private(set) var state: State = .idle

    private let pedometer = CMPedometer()
    private var isUpdating = false

    init() {
#if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-ui-testing") {
            stepsToday = 3_842
            distanceMeters = 2_640
            state = .active
        }
#endif
    }

    func begin() {
        guard !isUpdating else { return }
        guard CMPedometer.isStepCountingAvailable() else {
            state = .unavailable
            return
        }

        let authorization = CMPedometer.authorizationStatus()
        guard authorization != .denied, authorization != .restricted else {
            state = .denied
            return
        }

        state = .loading
        isUpdating = true
        let startOfDay = Calendar.current.startOfDay(for: .now)

        pedometer.queryPedometerData(from: startOfDay, to: .now) { [weak self] data, error in
            Task { @MainActor in
                guard let self else { return }
                self.apply(data, error: error)
                if error == nil {
                    self.startLiveUpdates(from: startOfDay)
                }
            }
        }
    }

    func stop() {
        pedometer.stopUpdates()
        isUpdating = false
    }

    private func apply(_ data: CMPedometerData?, error: Error?) {
        if error != nil {
            let authorization = CMPedometer.authorizationStatus()
            state = authorization == .denied || authorization == .restricted ? .denied : .failed
            pedometer.stopUpdates()
            isUpdating = false
            return
        }

        guard let data else { return }
        stepsToday = data.numberOfSteps.intValue
        distanceMeters = data.distance?.doubleValue
        state = .active
    }

    private func startLiveUpdates(from startDate: Date) {
        pedometer.startUpdates(from: startDate) { [weak self] data, error in
            Task { @MainActor in
                self?.apply(data, error: error)
            }
        }
    }
}
