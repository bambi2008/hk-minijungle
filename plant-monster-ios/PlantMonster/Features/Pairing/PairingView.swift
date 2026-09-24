import SwiftUI

struct PairingView: View {
    @EnvironmentObject private var model: AppModel
    @ScaledMetric(relativeTo: .largeTitle) private var titleSize: CGFloat = 44

    var body: some View {
        ZStack {
            Color.pmPaleSage.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("pairing.eyebrow")
                        .font(.caption.weight(.semibold))
                        .tracking(1.4)
                        .foregroundStyle(Color.pmAubergine.opacity(0.72))
                        .padding(.top, 20)

                    Image("plant-monster-product")
                        .resizable()
                        .scaledToFit()
                        .frame(maxWidth: 330)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 10)
                        .accessibilityLabel(Text("pairing.productImage"))

                    Text("pairing.title")
                        .font(.system(size: titleSize, weight: .semibold))
                        .tracking(-1)
                        .foregroundStyle(Color.pmAubergine)
                        .padding(.top, 10)

                    Text("pairing.body")
                        .font(.body)
                        .foregroundStyle(Color.pmAubergine.opacity(0.72))
                        .lineSpacing(4)
                        .padding(.top, 12)

                    if case let .failed(message) = model.connectionState {
                        Label(message, systemImage: "exclamationmark.circle.fill")
                            .font(.footnote)
                            .foregroundStyle(.red)
                            .padding(.top, 14)
                    }

                    Button(action: model.startPairing) {
                        HStack(spacing: 10) {
                            if isBusy {
                                ProgressView()
                                    .tint(.pmBone)
                            }
                            Text(primaryButtonTitle)
                                .font(.headline)
                        }
                        .frame(maxWidth: .infinity, minHeight: 54)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(Color.pmBone)
                    .background(Color.pmAubergine)
                    .clipShape(RoundedRectangle(cornerRadius: PMTheme.controlCornerRadius, style: .continuous))
                    .disabled(isBusy)
                    .padding(.top, 28)

                    Button("pairing.demo", action: model.enterDemoMode)
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity, minHeight: PMTheme.minimumTapTarget)
                        .padding(.top, 8)

                    Text("pairing.privacy")
                        .font(.caption)
                        .foregroundStyle(Color.pmAubergine.opacity(0.58))
                        .frame(maxWidth: .infinity)
                        .multilineTextAlignment(.center)
                        .padding(.top, 6)
                        .padding(.bottom, 28)
                }
                .padding(.horizontal, PMTheme.pagePadding)
            }
        }
    }

    private var isBusy: Bool {
        switch model.connectionState {
        case .waitingForBluetooth, .scanning, .connecting, .discovering: true
        default: false
        }
    }

    private var primaryButtonTitle: LocalizedStringKey {
        switch model.connectionState {
        case .waitingForBluetooth: "pairing.waiting"
        case .scanning: "pairing.searching"
        case .connecting, .discovering: "pairing.connecting"
        default: "pairing.start"
        }
    }
}

#Preview {
    PairingView()
        .environmentObject(AppModel(client: MockPlantMonsterBLEClient()))
}
