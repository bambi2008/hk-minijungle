import SwiftUI

struct CareView: View {
    var body: some View {
        ZStack {
            PMBackgroundView(signalStrength: 0.5)

            ScrollView {
                CareSectionContent(showsStatus: true)
                    .padding(.horizontal, PMTheme.pagePadding)
            }
            .scrollIndicators(.hidden)
        }
        .preferredColorScheme(.dark)
    }
}

struct CareSectionContent: View {
    private enum SensorKind: String, CaseIterable, Identifiable {
        case temperature
        case airHumidity
        case substrateMoisture
        case light

        var id: Self { self }

        var label: LocalizedStringKey {
            switch self {
            case .temperature: "sensor.temperature"
            case .airHumidity: "sensor.airHumidity"
            case .substrateMoisture: "sensor.substrateMoisture"
            case .light: "sensor.lightLux"
            }
        }

        var icon: String {
            switch self {
            case .temperature: "thermometer.medium"
            case .airHumidity: "humidity"
            case .substrateMoisture: "drop"
            case .light: "sun.max"
            }
        }
    }

    @EnvironmentObject private var model: AppModel
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @State private var selectedSensor: SensorKind = .light

    var showsStatus = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            PMEditorialHeader(
                section: "care.editorial.section",
                status: model.connectionLabel
            )
            .padding(.top, showsStatus ? 10 : 0)

            Text(model.careHeadline)
                .pmEditorialTitle(size: 58)
                .padding(.top, 18)

            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text("12")
                    .font(.system(size: 30, weight: .medium, design: .monospaced))
                    .foregroundStyle(Color.white)
                    .monospacedDigit()
                Text("care.minutes")
                    .font(.system(.headline, design: .monospaced, weight: .medium))
                    .foregroundStyle(Color.white.opacity(0.84))
            }
            .padding(.top, 16)

            Text(model.careDetail)
                .font(.system(.caption, design: .monospaced, weight: .medium))
                .tracking(1.8)
                .lineSpacing(5)
                .foregroundStyle(Color.white.opacity(0.56))
                .textCase(.uppercase)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 10)

            EditorialCareStage(
                expression: model.currentExpression,
                lightNeedsAttention: lightNeedsAttention
            )
            .padding(.top, 26)

            Text("care.editorial.selectSensor")
                .font(.system(.caption2, design: .monospaced, weight: .medium))
                .tracking(1.8)
                .foregroundStyle(Color.white.opacity(0.46))
                .padding(.top, 28)

            sensorSelector
                .padding(.top, 12)

            selectedSensorNarrative
                .padding(.top, 18)

            MotionSignalView(
                isMoving: model.telemetry.isMoving,
                title: model.motionTitle,
                detail: model.motionDetail
            )
            .padding(.top, 26)

            Button {
                model.recordLightMoment()
            } label: {
                HStack {
                    Text("care.remember")
                    Spacer()
                    Image(systemName: "bookmark")
                }
                .font(.system(.caption, design: .monospaced, weight: .semibold))
                .tracking(1.4)
                .foregroundStyle(Color.pmInk)
                .padding(.horizontal, 18)
                .frame(maxWidth: .infinity, minHeight: 54)
                .background(Color.pmOLEDGreen)
            }
            .buttonStyle(PMTactileButtonStyle())
            .padding(.top, 24)

            PMEditorialFooter(phrase: "care.footer")
                .padding(.top, 34)
                .padding(.bottom, 40)
        }
        .sensoryFeedback(.selection, trigger: selectedSensor)
    }

    @ViewBuilder
    private var sensorSelector: some View {
        if dynamicTypeSize.isAccessibilitySize {
            VStack(spacing: 1) {
                ForEach(SensorKind.allCases) { sensorButton($0) }
            }
        } else {
            HStack(spacing: 1) {
                ForEach(SensorKind.allCases) { sensorButton($0) }
            }
        }
    }

    private func sensorButton(_ sensor: SensorKind) -> some View {
        Button {
            selectedSensor = sensor
        } label: {
            VStack(spacing: 9) {
                Image(systemName: sensor.icon)
                    .font(.title3.weight(.medium))
                    .symbolRenderingMode(.hierarchical)
                Text(sensorValue(sensor))
                    .font(.system(.headline, design: .monospaced, weight: .medium))
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.68)
                Text(sensor.label)
                    .font(.system(size: 9, weight: .medium, design: .monospaced))
                    .tracking(0.5)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
            }
            .foregroundStyle(selectedSensor == sensor ? Color.pmInk : Color.white.opacity(0.72))
            .frame(maxWidth: .infinity, minHeight: dynamicTypeSize.isAccessibilitySize ? 104 : 118)
            .padding(.horizontal, 4)
            .background(selectedSensor == sensor ? Color.pmOLEDGreen : Color.black.opacity(0.32))
            .overlay {
                Rectangle().stroke(PMTheme.hairline, lineWidth: selectedSensor == sensor ? 0 : 1)
            }
        }
        .buttonStyle(PMTactileButtonStyle())
        .accessibilityAddTraits(selectedSensor == sensor ? .isSelected : [])
    }

    private var selectedSensorNarrative: some View {
        HStack(alignment: .top, spacing: 16) {
            Rectangle()
                .fill(Color.pmOLEDGreen)
                .frame(width: 2, height: 54)

            VStack(alignment: .leading, spacing: 6) {
                Text(selectedSensor.label)
                    .font(.system(.caption2, design: .monospaced, weight: .semibold))
                    .tracking(1.3)
                    .foregroundStyle(Color.pmOLEDGreen)
                Text(sensorNarrative(selectedSensor))
                    .font(.body)
                    .foregroundStyle(Color.white.opacity(0.78))
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .contentTransition(.opacity)
        .animation(.easeInOut(duration: 0.2), value: selectedSensor)
    }

    private func sensorValue(_ sensor: SensorKind) -> String {
        switch sensor {
        case .temperature:
            model.telemetry.temperatureCelsius.formatted(.number.precision(.fractionLength(0))) + "°"
        case .airHumidity:
            model.telemetry.airHumidityPercent.formatted(.number.precision(.fractionLength(0))) + "%"
        case .substrateMoisture:
            model.telemetry.substrateMoisturePercent.map {
                $0.formatted(.number.precision(.fractionLength(0))) + "%"
            } ?? "—"
        case .light:
            model.telemetry.lightLux.formatted(.number.precision(.fractionLength(0)))
        }
    }

    private func sensorNarrative(_ sensor: SensorKind) -> LocalizedStringKey {
        switch sensor {
        case .temperature:
            temperatureNeedsAttention ? "care.sensorNarrative.temperatureAttention" : "care.sensorNarrative.temperatureSteady"
        case .airHumidity:
            "care.sensorNarrative.airHumidity"
        case .substrateMoisture:
            model.telemetry.substrateMoisturePercent == nil
                ? "care.sensorNarrative.substrateWaiting"
                : "care.sensorNarrative.substrate"
        case .light:
            lightNeedsAttention ? "care.sensorNarrative.lightAttention" : "care.sensorNarrative.lightSteady"
        }
    }

    private var temperatureNeedsAttention: Bool {
        model.telemetry.temperatureCelsius < 16 || model.telemetry.temperatureCelsius > 30
    }

    private var lightNeedsAttention: Bool {
        model.telemetry.lightLux < 150 || model.telemetry.lightLux > 1_200
    }
}

private struct EditorialCareStage: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var scanPosition: CGFloat = -0.45
    let expression: PlantExpression
    let lightNeedsAttention: Bool

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Rectangle()
                .fill(Color.black.opacity(0.5))
                .overlay { Rectangle().stroke(PMTheme.hairline, lineWidth: 1) }

            LinearGradient(
                colors: [.clear, Color.white.opacity(lightNeedsAttention ? 0.24 : 0.1), .clear],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .offset(x: scanPosition * 180)
            .blendMode(.screen)
            .clipped()

            VStack(alignment: .trailing, spacing: 8) {
                Image(systemName: lightNeedsAttention ? "sun.min" : "sun.max")
                    .font(.title2.weight(.light))
                    .foregroundStyle(lightNeedsAttention ? Color.pmOLEDGreen : Color.white)
                    .symbolEffect(.pulse, options: .repeating, value: lightNeedsAttention)

                Path { path in
                    path.move(to: CGPoint(x: 0, y: 0))
                    path.addLine(to: CGPoint(x: -72, y: 92))
                }
                .stroke(
                    lightNeedsAttention ? Color.pmOLEDGreen.opacity(0.72) : Color.white.opacity(0.2),
                    style: StrokeStyle(lineWidth: 1, dash: [4, 7])
                )
                .frame(width: 76, height: 96)
            }
            .padding(20)
            .accessibilityHidden(true)

            OLEDExpressionView(
                expression: expression,
                width: 286,
                tint: .white,
                isActive: lightNeedsAttention
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
            .padding(18)
        }
        .frame(minHeight: 230)
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 3.4).repeatForever(autoreverses: true)) {
                scanPosition = 0.5
            }
        }
    }
}

private struct MotionSignalView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var pulse = false
    let isMoving: Bool
    let title: String
    let detail: String

    var body: some View {
        HStack(spacing: 18) {
            ZStack {
                ForEach(0..<3, id: \.self) { index in
                    Circle()
                        .stroke(Color.pmOLEDGreen.opacity(0.44 - Double(index) * 0.1), lineWidth: 1)
                        .frame(width: 34 + CGFloat(index * 18), height: 34 + CGFloat(index * 18))
                        .scaleEffect(isMoving && pulse && !reduceMotion ? 1.22 : 0.82)
                        .opacity(isMoving && pulse ? 0.08 : 0.74)
                }

                Image(systemName: isMoving ? "move.3d" : "circle.dotted")
                    .foregroundStyle(Color.pmOLEDGreen)
            }
            .frame(width: 78, height: 78)
            .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 5) {
                Text("motion.sensorLabel")
                    .font(.system(.caption2, design: .monospaced, weight: .semibold))
                    .tracking(1.2)
                    .foregroundStyle(Color.pmOLEDGreen)
                Text(title)
                    .font(.headline)
                    .foregroundStyle(Color.white)
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(Color.white.opacity(0.58))
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 0)
        }
        .padding(.vertical, 16)
        .overlay(alignment: .top) { Rectangle().fill(PMTheme.hairline).frame(height: 1) }
        .overlay(alignment: .bottom) { Rectangle().fill(PMTheme.hairline).frame(height: 1) }
        .accessibilityElement(children: .combine)
        .task(id: isMoving) {
            pulse = false
            guard isMoving, !reduceMotion else { return }
            withAnimation(.easeOut(duration: 1).repeatForever(autoreverses: false)) {
                pulse = true
            }
        }
    }
}
