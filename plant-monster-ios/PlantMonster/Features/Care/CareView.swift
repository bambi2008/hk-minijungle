import SwiftUI

struct CareView: View {
    var body: some View {
        ZStack {
            PMBackgroundView()

            ScrollView {
                CareSectionContent(showsStatus: true)
                    .padding(.horizontal, PMTheme.pagePadding)
            }
        }
    }
}

struct CareSectionContent: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @ScaledMetric(relativeTo: .largeTitle) private var titleSize: CGFloat = 44

    var showsStatus = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if showsStatus {
                AliveStatusView(text: model.connectionLabel)
                    .frame(minHeight: PMTheme.minimumTapTarget)
            }

            careSectionMarker
                .padding(.top, showsStatus ? 30 : 0)

            Text(model.careHeadline)
                .font(.system(size: titleSize, weight: .semibold))
                .tracking(-1.0)
                .foregroundStyle(Color.pmBone)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 22)

            Text(model.careDetail)
                .font(.body)
                .foregroundStyle(Color.pmBone.opacity(0.78))
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 12)

            CareSignalStage(
                expression: model.currentExpression,
                needsRecheck: needsRecheck
            )
            .padding(.top, 28)

            sectionHeading(
                title: "care.environmentTitle",
                detail: "care.environmentDetail"
            )
            .padding(.top, 34)

            sensorStories
                .padding(.top, 16)

            sectionHeading(
                title: "care.activityTitle",
                detail: "care.activityDetail"
            )
            .padding(.top, 34)

            MotionTimelineView(
                isMoving: model.telemetry.isMoving,
                title: model.motionTitle,
                detail: model.motionDetail
            )
            .padding(.top, 14)

            Button {
                model.recordLightMoment()
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "bookmark.fill")
                        .accessibilityHidden(true)
                    Text("care.remember")
                }
                .font(.headline)
                .foregroundStyle(Color.pmBone)
                .frame(maxWidth: .infinity, minHeight: 56)
                .background(Color.pmAubergine)
                .clipShape(RoundedRectangle(cornerRadius: PMTheme.controlCornerRadius, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: PMTheme.controlCornerRadius, style: .continuous)
                        .stroke(Color.pmBone.opacity(0.14), lineWidth: 1)
                }
                .shadow(color: Color.pmAubergine.opacity(0.35), radius: 22, y: 12)
            }
            .buttonStyle(PMTactileButtonStyle())
            .padding(.top, 22)
            .padding(.bottom, 40)
        }
    }

    private var careSectionMarker: some View {
        PMChapterLabel(index: "02", title: "care.chapter", trailingLabel: "care.live")
    }

    @ViewBuilder
    private var sensorStories: some View {
        if dynamicTypeSize.isAccessibilitySize {
            VStack(spacing: 12) {
                sensorCards
            }
        } else {
            ScrollView(.horizontal, showsIndicators: false) {
                LazyHStack(spacing: 12) {
                    sensorCards
                }
                .scrollTargetLayout()
            }
            .contentMargins(.horizontal, 0, for: .scrollContent)
            .scrollTargetBehavior(.viewAligned)
            .accessibilityLabel(Text("care.sensorCarousel"))
        }
    }

    @ViewBuilder
    private var sensorCards: some View {
        sensorCard(
            value: model.telemetry.temperatureCelsius.formatted(.number.precision(.fractionLength(0))) + "°",
            label: "sensor.temperature",
            systemImage: "thermometer.medium",
            status: temperatureNeedsAttention ? "care.sensor.attention" : "care.sensor.steady",
            needsAttention: temperatureNeedsAttention
        )
        sensorCard(
            value: model.telemetry.airHumidityPercent.formatted(.number.precision(.fractionLength(0))) + "%",
            label: "sensor.airHumidity",
            systemImage: "humidity.fill",
            status: "care.sensor.sensing"
        )
        sensorCard(
            value: substrateMoistureValue,
            label: "sensor.substrateMoisture",
            systemImage: "drop.fill",
            status: model.telemetry.substrateMoisturePercent == nil
                ? "care.sensor.waiting"
                : "care.sensor.sensing"
        )
        sensorCard(
            value: model.telemetry.lightLux.formatted(.number.precision(.fractionLength(0))),
            label: "sensor.lightLux",
            systemImage: "sun.max.fill",
            status: lightNeedsAttention ? "care.sensor.attention" : "care.sensor.steady",
            needsAttention: lightNeedsAttention
        )
    }

    private func sensorCard(
        value: String,
        label: LocalizedStringKey,
        systemImage: String,
        status: LocalizedStringKey,
        needsAttention: Bool = false
    ) -> some View {
        SensorReadingView(
            value: value,
            label: label,
            systemImage: systemImage,
            status: status,
            needsAttention: needsAttention
        )
        .frame(width: dynamicTypeSize.isAccessibilitySize ? nil : 252)
        .scrollTransition(.animated(.easeInOut(duration: 0.3)), axis: .horizontal) { content, phase in
            content
                .opacity(phase.isIdentity ? 1 : 0.68)
                .scaleEffect(phase.isIdentity ? 1 : 0.94)
        }
    }

    private func sectionHeading(title: LocalizedStringKey, detail: LocalizedStringKey) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title)
                .font(.title3.weight(.semibold))
                .foregroundStyle(Color.pmBone)
            Text(detail)
                .font(.subheadline)
                .foregroundStyle(Color.pmBone.opacity(0.62))
        }
    }

    private var needsRecheck: Bool {
        temperatureNeedsAttention || lightNeedsAttention
    }

    private var temperatureNeedsAttention: Bool {
        model.telemetry.temperatureCelsius < 16 || model.telemetry.temperatureCelsius > 30
    }

    private var lightNeedsAttention: Bool {
        model.telemetry.lightLux < 150 || model.telemetry.lightLux > 1_200
    }

    private var substrateMoistureValue: String {
        guard let value = model.telemetry.substrateMoisturePercent else { return "—" }
        return value.formatted(.number.precision(.fractionLength(0))) + "%"
    }
}

private struct CareSignalStage: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isPulsing = false
    let expression: PlantExpression
    let needsRecheck: Bool

    var body: some View {
        ZStack(alignment: .topTrailing) {
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            Color.pmAubergine.opacity(0.96),
                            Color.pmSmokedGlass.opacity(0.96)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            Circle()
                .fill(Color.pmOLEDGreen.opacity(0.18))
                .frame(width: 190, height: 190)
                .blur(radius: 34)
                .scaleEffect(isPulsing ? 1.16 : 0.92)
                .opacity(isPulsing ? 0.72 : 1)
                .offset(x: 50, y: -58)
                .accessibilityHidden(true)

            ViewThatFits(in: .horizontal) {
                HStack(alignment: .center, spacing: 18) {
                    signalCopy
                    Spacer(minLength: 4)
                    expressionView
                }

                VStack(alignment: .leading, spacing: 24) {
                    signalCopy
                    expressionView
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(22)
        }
        .frame(minHeight: 214)
        .clipShape(RoundedRectangle(cornerRadius: 30, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .stroke(Color.pmBone.opacity(0.14), lineWidth: 1)
        }
        .shadow(color: .black.opacity(0.18), radius: 28, y: 16)
        .accessibilityElement(children: .combine)
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 3.2).repeatForever(autoreverses: true)) {
                isPulsing = true
            }
        }
    }

    private var signalCopy: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(
                needsRecheck ? "care.signal.attention" : "care.signal.steady",
                systemImage: needsRecheck ? "sun.min.fill" : "leaf.fill"
            )
            .font(.caption.weight(.semibold))
            .foregroundStyle(needsRecheck ? Color.pmOLEDGreen : Color.pmBone.opacity(0.72))

            if needsRecheck {
                HStack(alignment: .firstTextBaseline, spacing: 7) {
                    Text("12")
                        .font(.system(size: 62, weight: .medium, design: .rounded))
                        .monospacedDigit()
                    Text("care.minutes")
                        .font(.headline)
                }
                .foregroundStyle(Color.pmBone)

                Text("care.nextCheck")
                    .font(.subheadline)
                    .foregroundStyle(Color.pmBone.opacity(0.62))
            } else {
                Text("care.signal.liveValue")
                    .font(.system(.largeTitle, design: .rounded, weight: .semibold))
                    .foregroundStyle(Color.pmBone)

                Text("care.signal.liveDetail")
                    .font(.subheadline)
                    .foregroundStyle(Color.pmBone.opacity(0.62))
            }
        }
    }

    private var expressionView: some View {
        ZStack {
            Circle()
                .stroke(Color.pmOLEDGreen.opacity(0.18), lineWidth: 1)
                .frame(width: 152, height: 152)
                .overlay {
                    Circle()
                        .stroke(Color.pmOLEDGreen.opacity(0.08), lineWidth: 18)
                }
                .accessibilityHidden(true)

            OLEDExpressionView(expression: expression, width: 132)
        }
    }
}

private struct MotionTimelineView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isPulsing = false
    let isMoving: Bool
    let title: String
    let detail: String

    var body: some View {
        HStack(alignment: .top, spacing: 15) {
            VStack(spacing: 7) {
                ZStack {
                    if isMoving {
                        Circle()
                            .stroke(Color.pmOLEDGreen.opacity(0.42), lineWidth: 1)
                            .frame(width: 34, height: 34)
                            .scaleEffect(isPulsing ? 1.72 : 1)
                            .opacity(isPulsing ? 0 : 0.82)
                    }

                    Circle()
                        .fill(Color.pmOLEDGreen.opacity(0.16))
                        .frame(width: 34, height: 34)
                    Image(systemName: isMoving ? "move.3d" : "circle.dotted")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.pmOLEDGreen)
                }

                Capsule()
                    .fill(Color.pmBone.opacity(0.14))
                    .frame(width: 1, height: 38)
            }
            .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 5) {
                Text("motion.sensorLabel")
                    .font(.caption.weight(.semibold))
                    .tracking(0.7)
                    .foregroundStyle(Color.pmOLEDGreen)
                Text(title)
                    .font(.headline)
                    .foregroundStyle(Color.pmBone)
                Text(detail)
                    .font(.subheadline)
                    .foregroundStyle(Color.pmBone.opacity(0.68))
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 0)
        }
        .padding(18)
        .background(Color.pmSmokedGlass.opacity(0.72))
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.pmBone.opacity(0.12), lineWidth: 1)
        }
        .accessibilityElement(children: .combine)
        .task(id: isMoving) {
            guard isMoving, !reduceMotion else {
                isPulsing = false
                return
            }
            isPulsing = false
            withAnimation(.easeOut(duration: 1.15).repeatForever(autoreverses: false)) {
                isPulsing = true
            }
        }
    }
}
