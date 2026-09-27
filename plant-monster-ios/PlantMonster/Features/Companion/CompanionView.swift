import SwiftUI

struct CompanionView: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var showsDeviceSheet = false
    @State private var handledCareScrollRequest = 0
    @State private var scrollOffset: CGFloat = 0
    @State private var isTurntableEngaged = false
    @State private var isScrollCueFloating = false
    @ScaledMetric(relativeTo: .largeTitle) private var titleSize: CGFloat = 50

    let onForgetDevice: () -> Void
    var careScrollRequest = 0

    private let careSectionID = "companion-care-section"

    private var scrollProgress: CGFloat {
        guard !reduceMotion else { return 0 }
        return min(max(-scrollOffset / 520, 0), 1)
    }

    var body: some View {
        ZStack {
            if model.isTouchActive {
                Color.pmAubergine.ignoresSafeArea()
            } else {
                PMBackgroundView()
            }

            Color.pmAubergine
                .opacity(Double(scrollProgress * 0.22))
                .ignoresSafeArea()
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

                        companionSection
                            .frame(minHeight: 760, alignment: .topLeading)

                        CareSectionContent()
                            .id(careSectionID)
                            .padding(.top, 54)
                            .scrollTransition(.animated(.easeInOut(duration: 0.42)), axis: .vertical) { content, phase in
                                content
                                    .opacity(phase.isIdentity ? 1 : 0.42)
                                    .scaleEffect(phase.isIdentity ? 1 : 0.975, anchor: .top)
                            }
                    }
                    .padding(.horizontal, PMTheme.pagePadding)
                    .frame(maxWidth: .infinity, alignment: .topLeading)
                }
                .coordinateSpace(name: "companionScroll")
                .onPreferenceChange(CompanionScrollOffsetKey.self) { scrollOffset = $0 }
                .task(id: careScrollRequest) {
                    guard careScrollRequest > handledCareScrollRequest else { return }
                    handledCareScrollRequest = careScrollRequest
                    await Task.yield()
                    withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.55)) {
                        proxy.scrollTo(careSectionID, anchor: .top)
                    }
                }
            }
        }
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.3), value: model.isTouchActive)
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.2), value: model.touchDeliveryState)
        .sheet(isPresented: $showsDeviceSheet) {
            DeviceSheet(onForgetDevice: onForgetDevice)
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
        }
    }

    private var companionSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                showsDeviceSheet = true
            } label: {
                AliveStatusView(text: model.connectionLabel)
                    .frame(minHeight: PMTheme.minimumTapTarget, alignment: .leading)
            }
            .buttonStyle(.plain)
            .accessibilityHint(Text("device.openSettings"))

            Spacer(minLength: 34)

            ZStack {
                StageSpotlightView(isEngaged: isTurntableEngaged || model.isTouchActive)

                if model.isTouchActive {
                    TouchRippleView()
                }
                PlantMonsterTurntableView(
                    hapticsEnabled: model.hapticsEnabled,
                    controlColor: .pmBone,
                    onTap: model.pet,
                    onInteractionChanged: { isTurntableEngaged = $0 }
                )
            }
            .frame(maxWidth: 370)
            .frame(maxWidth: .infinity)
            .scaleEffect(1 - scrollProgress * 0.1, anchor: .bottom)
            .offset(y: scrollProgress * 26)

            Spacer(minLength: 30)

            PMChapterLabel(index: "01", title: "companion.chapter", trailingLabel: "companion.live")

            Text(LocalizedStringKey(model.touchTitleKey))
                .font(.system(size: titleSize, weight: .semibold))
                .tracking(-1.25)
                .foregroundStyle(Color.pmBone)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 22)

            Text(LocalizedStringKey(model.touchBodyKey))
                .font(.body)
                .foregroundStyle(Color.pmBone.opacity(0.76))
                .lineSpacing(4)
                .padding(.top, 14)

            Spacer(minLength: 26)

            HStack(spacing: 10) {
                Text("companion.scrollCare")
                    .font(.caption.weight(.semibold))
                    .tracking(0.8)
                Image(systemName: "arrow.down")
                    .font(.caption.weight(.bold))
                    .offset(y: reduceMotion ? 0 : (isScrollCueFloating ? 3 : -2))
            }
            .foregroundStyle(Color.pmBone.opacity(0.66))
            .frame(minHeight: PMTheme.minimumTapTarget)
            .accessibilityElement(children: .combine)
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(.easeInOut(duration: 1.15).repeatForever(autoreverses: true)) {
                    isScrollCueFloating = true
                }
            }

            Spacer(minLength: 26)
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
    let onForgetDevice: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("device.connection") {
                    LabeledContent("device.status", value: model.connectionLabel)
                    Toggle("device.haptics", isOn: $model.hapticsEnabled)
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
