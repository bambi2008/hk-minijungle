import SwiftUI

struct CompanionView: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var showsDeviceSheet = false
    @ScaledMetric(relativeTo: .largeTitle) private var titleSize: CGFloat = 50

    let onForgetDevice: () -> Void

    var body: some View {
        ZStack {
            if model.isTouchActive {
                Color.pmAubergine.ignoresSafeArea()
            } else {
                PMBackgroundView()
            }

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Button {
                        showsDeviceSheet = true
                    } label: {
                        AliveStatusView(text: model.connectionLabel)
                            .frame(minHeight: PMTheme.minimumTapTarget, alignment: .leading)
                    }
                    .buttonStyle(.plain)
                    .accessibilityHint(Text("device.openSettings"))

                    Spacer(minLength: 88)

                    Button(action: model.pet) {
                        ZStack {
                            if model.isTouchActive {
                                TouchRippleView()
                            }
                            OLEDExpressionView(expression: model.currentExpression, width: 176)
                        }
                        .frame(maxWidth: .infinity, minHeight: 210)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(Text("companion.petAction"))
                    .accessibilityHint(Text("companion.petHint"))

                    Spacer(minLength: 74)

                    Text(LocalizedStringKey(model.touchTitleKey))
                        .font(.system(size: titleSize, weight: .semibold))
                        .tracking(-1.25)
                        .foregroundStyle(model.isTouchActive ? Color.pmBone : Color.pmBone)
                        .fixedSize(horizontal: false, vertical: true)

                    Text(LocalizedStringKey(model.touchBodyKey))
                        .font(.body)
                        .foregroundStyle(Color.pmBone.opacity(0.76))
                        .lineSpacing(4)
                        .padding(.top, 14)

                    Spacer(minLength: 36)
                }
                .padding(.horizontal, PMTheme.pagePadding)
                .frame(maxWidth: .infinity, minHeight: 720, alignment: .topLeading)
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
