import SwiftUI

struct PairingView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        ZStack {
            PMBackgroundView(signalStrength: isBusy ? 0.82 : 0.36)

            GeometryReader { viewport in
                ScrollView {
                    VStack(alignment: .center, spacing: 0) {
                    PMEditorialHeader(
                        section: "pairing.editorial.section",
                        status: model.connectionLabel,
                        actionTitle: "pairing.skip",
                        action: model.enterDemoMode
                    )
                    .padding(.top, 10)

                    Text("pairing.editorial.headline")
                        .accessibilityIdentifier("pairing.title")
                        .pmEditorialTitle(size: 32)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, 18)

                    Text("pairing.editorial.subtitle")
                        .font(.subheadline)
                        .foregroundStyle(Color.white.opacity(0.52))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, 9)

                    ZStack {
                        PlantMonsterTurntableView(
                            hapticsEnabled: model.hapticsEnabled,
                            controlColor: .white
                        )
                    }
                    .frame(width: min(viewport.size.width - PMTheme.pagePadding * 2, viewport.size.height * 0.47))
                    .padding(.top, 24)

                    VStack(spacing: 8) {
                        HStack(spacing: 8) {
                            Image(systemName: "circle.fill")
                                .font(.system(size: 8, weight: .bold))
                                .foregroundStyle(Color.pmOLEDGreen)
                                .symbolEffect(.pulse, options: .repeating, value: isBusy)
                            Text(pairingStatusTitle)
                        }
                        .font(.system(.caption, design: .monospaced, weight: .semibold))
                        .tracking(1.8)
                        .foregroundStyle(Color.white.opacity(0.74))

                        Text("pairing.editorial.searchingFor")
                            .font(.system(.caption2, design: .monospaced, weight: .medium))
                            .tracking(2.4)
                            .foregroundStyle(Color.white.opacity(0.48))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 8)

                    if case let .failed(message) = model.connectionState {
                        Label(message, systemImage: "exclamationmark.triangle")
                            .font(.caption)
                            .foregroundStyle(.red)
                            .padding(.top, 14)
                    }

                    Button(action: model.startPairing) {
                        HStack(spacing: 10) {
                            if isBusy {
                                ProgressView().tint(.pmInk)
                            }
                            Text(primaryButtonTitle)
                            Spacer()
                            Image(systemName: "arrow.right")
                        }
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.pmInk)
                        .padding(.horizontal, 18)
                        .frame(maxWidth: .infinity, minHeight: 56)
                        .background(Color.pmLilac, in: Capsule())
                    }
                    .buttonStyle(PMTactileButtonStyle())
                    .accessibilityIdentifier("pairing.connect")
                    .disabled(isBusy)
                    .padding(.top, 22)

                    Text("pairing.privacy")
                        .font(.system(.caption2, design: .monospaced))
                        .foregroundStyle(Color.white.opacity(0.42))
                        .frame(maxWidth: .infinity)
                        .multilineTextAlignment(.center)
                        .padding(.top, 12)
                        .padding(.bottom, 26)
                }
                    .frame(
                        width: max(0, viewport.size.width - (PMTheme.pagePadding * 2)),
                        alignment: .leading
                    )
                    .padding(.horizontal, PMTheme.pagePadding)
                }
                .scrollIndicators(.hidden)
            }
        }
        .preferredColorScheme(.dark)
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

    private var pairingStatusTitle: LocalizedStringKey {
        isBusy ? primaryButtonTitle : "pairing.editorial.ready"
    }
}

#Preview {
    PairingView()
        .environmentObject(AppModel(client: MockPlantMonsterBLEClient()))
}
