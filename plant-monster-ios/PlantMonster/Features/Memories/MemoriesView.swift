import SwiftUI

struct MemoriesView: View {
    private enum Filter: String, CaseIterable, Identifiable {
        case today
        case week
        case all

        var id: Self { self }
        var title: LocalizedStringKey {
            switch self {
            case .today: "memories.today"
            case .week: "memories.week"
            case .all: "memories.all"
            }
        }
    }

    @EnvironmentObject private var model: AppModel
    @State private var filter: Filter = .today
    @ScaledMetric(relativeTo: .largeTitle) private var titleSize: CGFloat = 48

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color.pmBone, Color.pmPaleSage.opacity(0.62)],
                    startPoint: .top,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                VStack(alignment: .leading, spacing: 0) {
                    Text("memories.eyebrow")
                        .font(.caption.weight(.semibold))
                        .tracking(1.4)
                        .foregroundStyle(Color.pmAubergine.opacity(0.62))

                    Text("memories.title")
                        .font(.system(size: titleSize, weight: .semibold))
                        .tracking(-1.2)
                        .foregroundStyle(Color.pmAubergine)
                        .padding(.top, 10)

                    Picker("memories.filter", selection: $filter) {
                        ForEach(Filter.allCases) { option in
                            Text(option.title).tag(option)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.top, 24)

                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(filteredEvents) { event in
                                MemoryRow(event: event)
                                    .scrollTransition(
                                        .animated(.easeInOut(duration: 0.32)),
                                        axis: .vertical
                                    ) { content, phase in
                                        content
                                            .opacity(phase.isIdentity ? 1 : 0.5)
                                            .scaleEffect(phase.isIdentity ? 1 : 0.96)
                                    }
                            }
                        }
                        .padding(.vertical, 18)
                    }
                    .scrollIndicators(.hidden)
                }
                .padding(.horizontal, PMTheme.pagePadding)
                .padding(.top, 20)
            }
            .navigationBarHidden(true)
        }
        .sensoryFeedback(.selection, trigger: filter)
    }

    private var filteredEvents: [MemoryEvent] {
        let calendar = Calendar.current
        switch filter {
        case .today:
            return model.memories.filter { calendar.isDateInToday($0.date) }
        case .week:
            guard let start = calendar.date(byAdding: .day, value: -7, to: .now) else { return model.memories }
            return model.memories.filter { $0.date >= start }
        case .all:
            return model.memories
        }
    }
}

private struct MemoryRow: View {
    let event: MemoryEvent

    var body: some View {
        HStack(spacing: 14) {
            OLEDExpressionView(expression: event.expression, width: 78)

            VStack(alignment: .leading, spacing: 7) {
                Text(event.date.formatted(date: .omitted, time: .shortened))
                    .font(.system(.caption, design: .monospaced, weight: .medium))
                    .foregroundStyle(Color.pmAubergine.opacity(0.58))
                    .monospacedDigit()
                Text(event.title)
                    .font(.headline)
                    .foregroundStyle(Color.pmAubergine)
            }

            Spacer(minLength: 8)

            Image(systemName: event.kind.iconName)
                .font(.subheadline.weight(.semibold))
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(Color.pmAubergine.opacity(0.74))
                .frame(width: PMTheme.minimumTapTarget, height: PMTheme.minimumTapTarget)
                .background(Color.pmAubergine.opacity(0.07), in: Circle())
                .accessibilityHidden(true)
        }
        .padding(14)
        .background(Color.pmBone.opacity(0.76), in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.pmAubergine.opacity(0.09), lineWidth: 1)
        }
        .shadow(color: Color.pmAubergine.opacity(0.08), radius: 16, y: 8)
        .accessibilityElement(children: .combine)
    }
}
