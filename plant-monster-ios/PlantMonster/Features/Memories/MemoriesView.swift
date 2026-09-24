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

                List(filteredEvents) { event in
                    MemoryRow(event: event)
                        .listRowBackground(Color.clear)
                        .listRowSeparatorTint(Color.pmAubergine.opacity(0.14))
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
                .padding(.horizontal, -16)
                .padding(.top, 14)
            }
            .padding(.horizontal, PMTheme.pagePadding)
            .padding(.top, 20)
            .background(Color.pmBone.ignoresSafeArea())
            .navigationBarHidden(true)
        }
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
        HStack(spacing: 16) {
            OLEDExpressionView(expression: event.expression, width: 82)

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
                .font(.body)
                .foregroundStyle(Color.pmAubergine.opacity(0.68))
                .frame(width: PMTheme.minimumTapTarget, height: PMTheme.minimumTapTarget)
                .accessibilityHidden(true)
        }
        .padding(.vertical, 10)
        .accessibilityElement(children: .combine)
    }
}
