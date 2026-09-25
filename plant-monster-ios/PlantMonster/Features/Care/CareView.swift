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
    @ScaledMetric(relativeTo: .largeTitle) private var titleSize: CGFloat = 48

    var showsStatus = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if showsStatus {
                AliveStatusView(text: model.connectionLabel)
                    .frame(minHeight: PMTheme.minimumTapTarget)
            }

            Text(model.careHeadline)
                .font(.system(size: titleSize, weight: .semibold))
                .tracking(-1.15)
                .foregroundStyle(Color.pmBone)
                .padding(.top, showsStatus ? 32 : 0)

            Text(model.careDetail)
                .font(.body)
                .foregroundStyle(Color.pmBone.opacity(0.76))
                .lineSpacing(4)
                .padding(.top, 12)

            if model.telemetry.lightLux < 150 {
                Text("care.checkIn")
                    .font(.system(.title3, design: .monospaced, weight: .medium))
                    .tracking(1.2)
                    .foregroundStyle(Color.pmOLEDGreen)
                    .padding(.top, 20)
            }

            OLEDExpressionView(expression: model.currentExpression, width: 156)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 42)

            LazyVGrid(
                columns: [
                    GridItem(.flexible(), spacing: 12),
                    GridItem(.flexible(), spacing: 12)
                ],
                alignment: .leading,
                spacing: 18
            ) {
                SensorReadingView(
                    value: model.telemetry.temperatureCelsius.formatted(.number.precision(.fractionLength(0))) + "°",
                    label: "sensor.temperature"
                )
                SensorReadingView(
                    value: model.telemetry.airHumidityPercent.formatted(.number.precision(.fractionLength(0))) + "%",
                    label: "sensor.airHumidity"
                )
                SensorReadingView(
                    value: substrateMoistureValue,
                    label: "sensor.substrateMoisture"
                )
                SensorReadingView(
                    value: model.telemetry.lightLux.formatted(.number.precision(.fractionLength(0))),
                    label: "sensor.lightLux"
                )
            }
            .padding(20)
            .background(Color.pmPaleSage.opacity(0.94))
            .clipShape(RoundedRectangle(cornerRadius: PMTheme.contentCornerRadius, style: .continuous))

            HStack(alignment: .top, spacing: 14) {
                Image(systemName: model.telemetry.isMoving ? "move.3d" : "circle.dotted")
                    .font(.title3.weight(.medium))
                    .foregroundStyle(Color.pmOLEDGreen)
                    .frame(width: PMTheme.minimumTapTarget, height: PMTheme.minimumTapTarget)
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 5) {
                    Text("motion.sensorLabel")
                        .font(.caption)
                        .foregroundStyle(Color.pmBone.opacity(0.64))
                    Text(model.motionTitle)
                        .font(.headline)
                        .foregroundStyle(Color.pmBone)
                    Text(model.motionDetail)
                        .font(.subheadline)
                        .foregroundStyle(Color.pmBone.opacity(0.72))
                }

                Spacer(minLength: 0)
            }
            .padding(16)
            .background(Color.pmSmokedGlass.opacity(0.76))
            .clipShape(RoundedRectangle(cornerRadius: PMTheme.controlCornerRadius, style: .continuous))
            .padding(.top, 12)
            .accessibilityElement(children: .combine)

            Button("care.remember") {
                model.recordLightMoment()
            }
            .font(.headline)
            .foregroundStyle(Color.pmAubergine)
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(Color.pmBone)
            .clipShape(RoundedRectangle(cornerRadius: PMTheme.controlCornerRadius, style: .continuous))
            .padding(.top, 16)
            .padding(.bottom, 36)
        }
    }

    private var substrateMoistureValue: String {
        guard let value = model.telemetry.substrateMoisturePercent else { return "—" }
        return value.formatted(.number.precision(.fractionLength(0))) + "%"
    }
}
