import SwiftUI

struct CompanionView: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var showsDeviceSheet = false
    @State private var handledCareScrollRequest = 0
    @State private var scrollOffset: CGFloat = 0
    @State private var isTurntableEngaged = false
    @State private var isScrollCueFloating = false

    let onForgetDevice: () -> Void
    var careScrollRequest = 0

    private let careSectionID = "companion-care-section"

    private var scrollProgress: CGFloat {
        guard !reduceMotion else { return 0 }
        return min(max(-scrollOffset / 620, 0), 1)
    }

    var body: some View {
        GeometryReader { viewport in
            ZStack {
                PMBackgroundView(signalStrength: model.isTouchActive ? 1 : 0.34)

                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 0) {
                            GeometryReader { geometry in
                                Color.clear.preference(
                                    key: CompanionScrollOffsetKey.self,
                                    value: geometry.frame(in: .named("companionScroll")).minY
                                )
                            }
                            .frame(height: 0)

                            companionScene
                                .frame(minHeight: max(viewport.size.height - 24, 720), alignment: .topLeading)

                            CareSectionContent()
                                .id(careSectionID)
                                .padding(.top, 26)
                                .padding(.bottom, 46)
                                .scrollTransition(
                                    .animated(.easeInOut(duration: 0.34)),
                                    axis: .vertical
                                ) { content, phase in
                                    content
                                        .opacity(phase.isIdentity ? 1 : 0.22)
                                        .scaleEffect(phase.isIdentity ? 1 : 0.96, anchor: .top)
                                }
                        }
                        .padding(.horizontal, PMTheme.pagePadding)
                    }
                    .scrollIndicators(.hidden)
                    .coordinateSpace(name: "companionScroll")
                    .onPreferenceChange(CompanionScrollOffsetKey.self) { scrollOffset = $0 }
                    .task(id: careScrollRequest) {
                        guard careScrollRequest > handledCareScrollRequest else { return }
                        handledCareScrollRequest = careScrollRequest
                        await Task.yield()
                        withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.52)) {
                            proxy.scrollTo(careSectionID, anchor: .top)
                        }
                    }
                }
            }
        }
        .preferredColorScheme(.dark)
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.28), value: model.isTouchActive)
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.2), value: model.touchDeliveryState)
        .sheet(isPresented: $showsDeviceSheet) {
            DeviceSheet(onForgetDevice: onForgetDevice)
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
        }
    }

    private var companionScene: some View {
        VStack(alignment: .leading, spacing: 0) {
            PMEditorialHeader(
                section: "editorial.plantMonster",
                status: model.connectionLabel,
                actionTitle: "editorial.settings",
                action: { showsDeviceSheet = true }
            )
            .padding(.top, 10)

            ZStack {
                if model.isTouchActive {
                    PMSignalRingsView(active: true)
                        .transition(.opacity)
                }

                PlantMonsterTurntableView(
                    hapticsEnabled: model.hapticsEnabled,
                    controlColor: .white,
                    onTap: model.pet,
                    onInteractionChanged: { isTurntableEngaged = $0 }
                )
                .opacity(model.isTouchActive ? 0.2 : 1)
                .scaleEffect(model.isTouchActive && !reduceMotion ? 0.86 : 1)

                if model.isTouchActive {
                    OLEDExpressionView(
                        expression: model.currentExpression,
                        width: 280,
                        tint: .white,
                        isActive: true
                    )
                    .transition(.scale(scale: 0.72).combined(with: .opacity))
                }
            }
            .frame(maxWidth: 390)
            .frame(maxWidth: .infinity)
            .scaleEffect(1 - scrollProgress * 0.12, anchor: .bottom)
            .offset(y: scrollProgress * 28)
            .padding(.top, 8)

            Text(editorialHeadline)
                .pmEditorialTitle(size: 60)
                .contentTransition(.opacity)
                .padding(.top, 4)

            Text(editorialBody)
                .font(.system(.caption, design: .monospaced, weight: .medium))
                .tracking(2.2)
                .lineSpacing(5)
                .foregroundStyle(Color.white.opacity(0.58))
                .textCase(.uppercase)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 12)

            Button(action: model.pet) {
                HStack(spacing: 10) {
                    Image(systemName: model.isTouchActive ? "wave.3.right" : "hand.tap")
                        .symbolEffect(.pulse, value: model.isTouchActive)
                    Text(
                        LocalizedStringKey(
                            model.isTouchActive
                                ? "companion.touchActiveAction"
                                : "companion.touchAction"
                        )
                    )
                }
                .font(.system(.caption, design: .monospaced, weight: .semibold))
                .tracking(1.3)
                .foregroundStyle(model.isTouchActive ? Color.pmInk : Color.white)
                .frame(maxWidth: .infinity, minHeight: 50)
                .background(model.isTouchActive ? Color.pmOLEDGreen : Color.white.opacity(0.04))
                .overlay {
                    Rectangle().stroke(model.isTouchActive ? Color.pmOLEDGreen : PMTheme.hairline, lineWidth: 1)
                }
            }
            .buttonStyle(PMTactileButtonStyle())
            .disabled(model.touchDeliveryState == .sending)
            .padding(.top, 18)

            Spacer(minLength: 24)

            HStack(spacing: 9) {
                Text("companion.scrollCare")
                Image(systemName: "arrow.down")
                    .offset(y: reduceMotion ? 0 : (isScrollCueFloating ? 3 : -2))
            }
            .font(.system(.caption2, design: .monospaced, weight: .medium))
            .tracking(1.2)
            .foregroundStyle(Color.white.opacity(0.52))
            .frame(minHeight: PMTheme.minimumTapTarget)
            .accessibilityElement(children: .combine)
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(.easeInOut(duration: 1.05).repeatForever(autoreverses: true)) {
                    isScrollCueFloating = true
                }
            }

            Color.clear
                .frame(height: 18)
        }
    }

    private var editorialHeadline: LocalizedStringKey {
        switch model.touchDeliveryState {
        case .sending: "companion.editorial.sending"
        case .delivered, .receivedOnDevice: "companion.editorial.received"
        case .sentWithoutReply: "companion.editorial.sent"
        case .preview: "companion.editorial.preview"
        case .unavailable: "companion.editorial.unavailable"
        case .idle: "companion.editorial.idle"
        }
    }

    private var editorialBody: LocalizedStringKey {
        switch model.touchDeliveryState {
        case .sending: "companion.editorial.sendingBody"
        case .delivered, .receivedOnDevice: "companion.editorial.receivedBody"
        case .sentWithoutReply: "companion.editorial.sentBody"
        case .preview: "companion.editorial.previewBody"
        case .unavailable: "companion.editorial.unavailableBody"
        case .idle: "companion.editorial.idleBody"
        }
    }
}

private struct CompanionScrollOffsetKey: PreferenceKey {
    static var defaultValue: CGFloat = 0

    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}

private struct DeviceSheet: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss
    @AppStorage("plantMonster.soundscapeEnabled") private var soundscapeEnabled = true
    let onForgetDevice: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("device.connection") {
                    LabeledContent("device.status", value: model.connectionLabel)
                    Toggle("device.haptics", isOn: $model.hapticsEnabled)
                }

                Section {
                    Toggle(isOn: $soundscapeEnabled) {
                        Label("device.soundscape", systemImage: "waveform")
                    }
                } footer: {
                    Text("device.soundscapeFootnote")
                }

                Section {
                    Button("device.forget", role: .destructive) {
                        dismiss()
                        onForgetDevice()
                    }
                } footer: {
                    Text("device.forgetFootnote")
                }
            }
            .navigationTitle("device.title")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
