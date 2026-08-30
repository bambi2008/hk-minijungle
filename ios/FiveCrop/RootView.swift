import Combine
import SwiftUI

@MainActor
final class FiveCropWebModel: ObservableObject {
    @Published var isLoading = true
    @Published var errorMessage: String?
    @Published var reloadToken = 0

    func retry() {
        errorMessage = nil
        isLoading = true
        reloadToken += 1
    }
}

struct RootView: View {
    @StateObject private var model = FiveCropWebModel()

    var body: some View {
        ZStack {
            Color(red: 0.97, green: 0.95, blue: 0.90)
                .ignoresSafeArea()

            if let configurationError = AppEnvironment.configurationError {
                FailureView(
                    title: "FiveCrop is not configured",
                    message: configurationError,
                    actionTitle: nil,
                    action: nil
                )
            } else {
                FiveCropWebView(model: model)
                    .ignoresSafeArea(edges: .bottom)

                if model.isLoading {
                    ProgressView("Opening FiveCrop…")
                        .padding(.horizontal, 22)
                        .padding(.vertical, 16)
                        .background(.ultraThinMaterial, in: Capsule())
                }

                if let errorMessage = model.errorMessage {
                    FailureView(
                        title: "FiveCrop could not connect",
                        message: errorMessage,
                        actionTitle: "Try again",
                        action: model.retry
                    )
                }
            }
        }
        .tint(Color(red: 0.78, green: 0.12, blue: 0.10))
    }
}

private struct FailureView: View {
    let title: String
    let message: String
    let actionTitle: String?
    let action: (() -> Void)?

    var body: some View {
        VStack(spacing: 18) {
            Image(systemName: "leaf.circle.fill")
                .font(.system(size: 48))
                .foregroundStyle(Color(red: 0.12, green: 0.28, blue: 0.18))
            Text(title)
                .font(.title2.weight(.semibold))
                .multilineTextAlignment(.center)
            Text(message)
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
            }
        }
        .padding(28)
        .frame(maxWidth: 420)
        .background(.white.opacity(0.94), in: RoundedRectangle(cornerRadius: 28, style: .continuous))
        .padding(24)
    }
}
