import SwiftUI

struct CompanionView: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @AppStorage("plantMonster.accessory") private var selectedAccessoryRaw = MonsterAccessory.none.rawValue
    @State private var showsDeviceSheet = false
    @State private var handledCareScrollRequest = 0
    @State private var scrollOffset: CGFloat = 0
    @State private var isTurntableEngaged = false
    @State private var interactionProgress: CGFloat = 0
    @State private var isScrollCueFloating = false

    let onForgetDevice: () -> Void
    var careScrollRequest = 0

    private let careSectionID = "companion-care-section"
    private let narrativeSectionID = "companion-narrative-section"

    private var scrollProgress: CGFloat {
        guard !reduceMotion else { return 0 }
        return min(max(-scrollOffset / 620, 0), 1)
    }

    private var hasLeftImmersiveCover: Bool {
        scrollOffset < -72
    }

    private var selectedAccessory: MonsterAccessory {
#if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-ui-sunglasses") {
            return .sunglasses
        }
#endif
        return MonsterAccessory(rawValue: selectedAccessoryRaw) ?? .none
    }

    private var accessorySelection: Binding<MonsterAccessory> {
        Binding(
            get: { selectedAccessory },
            set: { selectedAccessoryRaw = $0.rawValue }
        )
    }

    var body: some View {
        GeometryReader { viewport in
            ZStack {
                PMBackgroundView(
                    signalStrength: model.isTouchActive ? 1 : 0.34,
                    interaction: interactionProgress
                )

                PMLivingAtmosphereView(
                    interaction: interactionProgress,
                    scrollProgress: scrollProgress,
                    intensity: model.isTouchActive ? 1 : (isTurntableEngaged ? 0.78 : 0.36),
                    isTouchActive: model.isTouchActive
                )

                Color.pmInk
                    .ignoresSafeArea()
                    .opacity(hasLeftImmersiveCover ? 0 : 1)
                    .allowsHitTesting(false)

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

                            immersiveCreatureScene(in: viewport.size)

                            companionNarrative
                                .id(narrativeSectionID)
                                .padding(.horizontal, PMTheme.pagePadding)
                                .padding(.top, 28)

                            CareSectionContent()
                                .id(careSectionID)
                                .padding(.horizontal, PMTheme.pagePadding)
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
                        .frame(width: viewport.size.width, alignment: .leading)
                    }
                    .scrollIndicators(.hidden)
                    .coordinateSpace(name: "companionScroll")
                    .onPreferenceChange(CompanionScrollOffsetKey.self) { scrollOffset = $0 }
                    .task(id: careScrollRequest) {
#if DEBUG
                        if ProcessInfo.processInfo.arguments.contains("-ui-narrative") {
                            await Task.yield()
                            proxy.scrollTo(narrativeSectionID, anchor: .top)
                            return
                        }
#endif
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
        .statusBarHidden(!hasLeftImmersiveCover)
        .toolbar(hasLeftImmersiveCover ? .visible : .hidden, for: .tabBar)
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.28), value: model.isTouchActive)
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.2), value: model.touchDeliveryState)
        .sheet(isPresented: $showsDeviceSheet) {
            DeviceSheet(onForgetDevice: onForgetDevice)
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
        }
    }

    private func immersiveCreatureScene(in viewport: CGSize) -> some View {
        ZStack {
            Color.pmInk

            PlantMonsterTurntableView(
                hapticsEnabled: model.hapticsEnabled,
                controlColor: .white,
                showsChrome: false,
                accessory: selectedAccessory,
                onTap: model.pet,
                onInteractionChanged: { isTurntableEngaged = $0 },
                onInteractionProgress: { interactionProgress = $0 }
            )
            .frame(width: min(viewport.width * 0.96, 470))
            .scaleEffect(1 - scrollProgress * 0.08)
            .offset(
                x: interactionProgress * 4,
                y: -8 + scrollProgress * 24
            )
            .shadow(
                color: model.isTouchActive ? Color.pmOLEDGreen.opacity(0.28) : .clear,
                radius: 42
            )
        }
        .frame(maxWidth: .infinity)
        .frame(height: max(viewport.height + 96, 760))
        .clipped()
        .accessibilityLabel(Text("turntable.accessibilityLabel"))
    }

    private var companionNarrative: some View {
        VStack(alignment: .leading, spacing: 0) {
            PMEditorialHeader(
                section: "editorial.plantMonster",
                status: model.connectionLabel,
                actionTitle: "editorial.settings",
                action: { showsDeviceSheet = true }
            )
            .offset(x: -interactionProgress * 3)

            Text(editorialHeadline)
                .pmEditorialTitle(size: 60)
                .contentTransition(.opacity)
                .padding(.top, 34)
                .offset(x: interactionProgress * 11)
                .shadow(
                    color: model.isTouchActive ? Color.pmOLEDGreen.opacity(0.34) : .clear,
                    radius: model.isTouchActive ? 18 : 0
                )

            Text(editorialBody)
                .font(.system(.caption, design: .monospaced, weight: .medium))
                .tracking(2.2)
                .lineSpacing(5)
                .foregroundStyle(Color.white.opacity(0.58))
                .textCase(.uppercase)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 12)
                .offset(x: interactionProgress * 7)

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
            .offset(x: -interactionProgress * 5)

            AccessoryWardrobeView(selection: accessorySelection)
                .padding(.top, 38)

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
        .frame(maxWidth: .infinity, alignment: .leading)
        .sensoryFeedback(.selection, trigger: selectedAccessoryRaw)
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

private struct AccessoryWardrobeView: View {
    @Binding var selection: MonsterAccessory

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 12) {
                Text("03")
                    .foregroundStyle(Color.pmOLEDGreen)

                Text("companion.wardrobe.eyebrow")

                Rectangle()
                    .fill(PMTheme.hairline)
                    .frame(height: 1)
            }
            .font(.system(.caption2, design: .monospaced, weight: .semibold))
            .tracking(1.4)

            Text("companion.wardrobe.title")
                .font(.system(size: 34, weight: .black))
                .tracking(-1.2)
                .textCase(.uppercase)
                .padding(.top, 18)

            Text("companion.wardrobe.body")
                .font(.system(.caption, design: .monospaced, weight: .medium))
                .tracking(1.6)
                .lineSpacing(4)
                .foregroundStyle(Color.white.opacity(0.56))
                .padding(.top, 8)

            HStack(spacing: 10) {
                ForEach(MonsterAccessory.allCases) { accessory in
                    Button {
                        selection = accessory
                    } label: {
                        VStack(spacing: 13) {
                            ZStack(alignment: .topTrailing) {
                                Image(systemName: accessory.symbolName)
                                    .font(.system(size: 29, weight: .semibold))
                                    .foregroundStyle(
                                        selection == accessory ? Color.pmOLEDGreen : Color.white.opacity(0.8)
                                    )
                                    .frame(maxWidth: .infinity, minHeight: 44)

                                if selection == accessory {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.caption)
                                        .foregroundStyle(Color.pmOLEDGreen)
                                }
                            }

                            Text(accessory.titleKey)
                                .font(.system(.caption2, design: .monospaced, weight: .semibold))
                                .tracking(1.1)
                                .foregroundStyle(Color.white)
                                .lineLimit(2)
                                .minimumScaleFactor(0.82)
                                .multilineTextAlignment(.center)
                        }
                        .padding(14)
                        .frame(maxWidth: .infinity, minHeight: 112)
                        .background(
                            selection == accessory
                                ? Color.pmOLEDGreen.opacity(0.08)
                                : Color.white.opacity(0.025)
                        )
                        .overlay {
                            Rectangle()
                                .stroke(
                                    selection == accessory ? Color.pmOLEDGreen : PMTheme.hairline,
                                    lineWidth: 1
                                )
                        }
                    }
                    .buttonStyle(PMTactileButtonStyle())
                    .accessibilityAddTraits(selection == accessory ? .isSelected : [])
                }
            }
            .padding(.top, 20)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
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
