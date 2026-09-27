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
    @State private var isEditing = false
    @State private var selectedIDs = Set<UUID>()
    @State private var expandedEventID: UUID?

    var body: some View {
        ZStack {
            PMBackgroundView(signalStrength: 0.24)

            VStack(alignment: .leading, spacing: 0) {
                header
                    .padding(.top, 10)

                Text(todayHeadline)
                    .pmEditorialTitle(size: 57)
                    .padding(.top, 16)

                Text("memories.editorial.subtitle")
                    .font(.system(.caption2, design: .monospaced, weight: .medium))
                    .tracking(2.4)
                    .foregroundStyle(Color.white.opacity(0.5))
                    .textCase(.uppercase)
                    .padding(.top, 8)

                Rectangle()
                    .fill(PMTheme.hairline)
                    .frame(height: 1)
                    .padding(.top, 22)

                if filteredEvents.isEmpty {
                    emptyState
                } else {
                    ScrollView {
                        LazyVStack(spacing: 0) {
                            ForEach(filteredEvents) { event in
                                Button {
                                    handleEventTap(event)
                                } label: {
                                    EditorialMemoryRow(
                                        event: event,
                                        isEditing: isEditing,
                                        isSelected: selectedIDs.contains(event.id),
                                        isExpanded: expandedEventID == event.id
                                    )
                                }
                                .buttonStyle(PMTactileButtonStyle())
                                .scrollTransition(.animated(.easeInOut(duration: 0.24)), axis: .vertical) { content, phase in
                                    content.opacity(phase.isIdentity ? 1 : 0.35)
                                }
                            }
                        }
                    }
                    .scrollIndicators(.hidden)
                }

                if isEditing, !selectedIDs.isEmpty {
                    Button(role: .destructive) {
                        model.deleteMemories(withIDs: selectedIDs)
                        selectedIDs.removeAll()
                        isEditing = false
                    } label: {
                        Text("memories.deleteSelected")
                            .font(.system(.caption, design: .monospaced, weight: .semibold))
                            .tracking(1.2)
                            .frame(maxWidth: .infinity, minHeight: 48)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.red)
                    .padding(.top, 12)
                }

                filterBar
                    .padding(.vertical, 12)
            }
            .padding(.horizontal, PMTheme.pagePadding)
        }
        .preferredColorScheme(.dark)
        .sensoryFeedback(.selection, trigger: filter)
        .sensoryFeedback(.selection, trigger: selectedIDs)
    }

    private var header: some View {
        HStack(alignment: .top) {
            Text("memories.editorial.section")
                .font(.system(.caption, design: .monospaced, weight: .medium))
                .tracking(1.2)
                .foregroundStyle(Color.white.opacity(0.82))

            Spacer()

            Button {
                isEditing.toggle()
                selectedIDs.removeAll()
                expandedEventID = nil
            } label: {
                Text(
                    LocalizedStringKey(
                        isEditing ? "memories.done" : "memories.edit"
                    )
                )
                    .font(.system(.caption2, design: .monospaced, weight: .semibold))
                    .tracking(1.05)
                    .foregroundStyle(isEditing ? Color.pmOLEDGreen : Color.white)
                    .frame(minWidth: 44, minHeight: 44, alignment: .topTrailing)
            }
            .buttonStyle(PMTactileButtonStyle())
        }
        .frame(minHeight: PMTheme.minimumTapTarget)
    }

    private var filterBar: some View {
        HStack(spacing: 0) {
            ForEach(Filter.allCases) { option in
                Button {
                    filter = option
                } label: {
                    VStack(spacing: 7) {
                        Text(option.title)
                            .font(.system(.caption2, design: .monospaced, weight: .semibold))
                            .tracking(0.7)
                        Circle()
                            .fill(filter == option ? Color.pmOLEDGreen : Color.clear)
                            .frame(width: 6, height: 6)
                    }
                    .foregroundStyle(filter == option ? Color.white : Color.white.opacity(0.46))
                    .frame(maxWidth: .infinity, minHeight: 48)
                }
                .buttonStyle(PMTactileButtonStyle())
                .accessibilityAddTraits(filter == option ? .isSelected : [])
            }
        }
        .overlay(alignment: .top) { Rectangle().fill(PMTheme.hairline).frame(height: 1) }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            OLEDExpressionView(expression: .sleep, width: 220, tint: .white)
            Text("memories.empty")
                .font(.body)
                .foregroundStyle(Color.white.opacity(0.62))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var todayHeadline: String {
        String(format: String(localized: "memories.editorial.todayCount"), filteredEvents.count)
    }

    private var filteredEvents: [MemoryEvent] {
        let calendar = Calendar.current
        switch filter {
        case .today:
            model.memories.filter { calendar.isDateInToday($0.date) }
        case .week:
            guard let start = calendar.date(byAdding: .day, value: -7, to: .now) else { return model.memories }
            return model.memories.filter { $0.date >= start }
        case .all:
            model.memories
        }
    }

    private func handleEventTap(_ event: MemoryEvent) {
        if isEditing {
            if selectedIDs.contains(event.id) {
                selectedIDs.remove(event.id)
            } else {
                selectedIDs.insert(event.id)
            }
        } else {
            expandedEventID = expandedEventID == event.id ? nil : event.id
        }
    }
}

private struct EditorialMemoryRow: View {
    let event: MemoryEvent
    let isEditing: Bool
    let isSelected: Bool
    let isExpanded: Bool

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 14) {
                OLEDExpressionView(
                    expression: event.expression,
                    width: 126,
                    tint: .white,
                    isActive: isSelected
                )

                VStack(alignment: .leading, spacing: 7) {
                    Text(event.date.formatted(date: .omitted, time: .shortened))
                        .font(.system(.caption, design: .monospaced, weight: .medium))
                        .foregroundStyle(Color.white.opacity(0.82))
                        .monospacedDigit()
                    Text(event.title.uppercased())
                        .font(.system(.caption2, design: .monospaced, weight: .medium))
                        .tracking(1.1)
                        .foregroundStyle(Color.white.opacity(0.58))
                        .fixedSize(horizontal: false, vertical: true)
                }

                Spacer(minLength: 4)

                Image(systemName: isEditing
                    ? (isSelected ? "checkmark.circle.fill" : "circle")
                    : event.kind.iconName
                )
                .font(.headline)
                .foregroundStyle(isSelected ? Color.pmOLEDGreen : Color.white.opacity(0.74))
                .frame(width: 44, height: 44)
            }
            .padding(.vertical, 14)

            if isExpanded {
                HStack {
                    Text(event.expression.accessibilityLabel)
                        .font(.caption)
                        .foregroundStyle(Color.white.opacity(0.54))
                    Spacer()
                    Text("memories.tapToClose")
                        .font(.system(.caption2, design: .monospaced))
                        .foregroundStyle(Color.pmOLEDGreen)
                }
                .padding(.bottom, 14)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .overlay(alignment: .bottom) { Rectangle().fill(PMTheme.hairline).frame(height: 1) }
        .contentShape(Rectangle())
        .animation(.easeInOut(duration: 0.2), value: isExpanded)
        .accessibilityElement(children: .combine)
    }
}
