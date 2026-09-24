import SwiftUI

struct CareView: View {
    @EnvironmentObject private var model: AppModel
    @ScaledMetric(relativeTo: .largeTitle) private var titleSize: CGFloat = 48

    var body: some View {
        ZStack {
            PMBackgroundView()

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    AliveStatusView(text: model.connectionLabel)
                        .frame(minHeight: PMTheme.minimumTapTarget)

                    Text(model.careHeadline)
                        .font(.system(size: titleSize, weight: .semibold))
                        .tracking(-1.15)
                        .foregroundStyle(Color.pmBone)
                        .padding(.top, 32)

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

                    HStack(alignment: .top, spacing: 12) {
                        SensorReadingView(
                            value: model.telemetry.temperatureCelsius.formatted(.number.precision(.fractionLength(0))) + "°",
                            label: "sensor.temperature"
                        )
                        SensorReadingView(
                            value: model.telemetry.airHumidityPercent.formatted(.number.precision(.fractionLength(0))) + "%",
                            label: "sensor.airHumidity"
                        )
                        SensorReadingView(
                            value: model.telemetry.lightLux.formatted(.number.precision(.fractionLength(0))),
                            label: "sensor.lightLux"
                        )
                    }
                    .padding(20)
                    .background(Color.pmPaleSage.opacity(0.94))
                    .clipShape(RoundedRectangle(cornerRadius: PMTheme.contentCornerRadius, style: .continuous))

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
                .padding(.horizontal, PMTheme.pagePadding)
            }
        }
    }
}
