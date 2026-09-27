import SwiftUI

struct AppRootView: View {
    @AppStorage("plantMonster.hasCompletedPairing") private var hasCompletedPairing = false
    @EnvironmentObject private var model: AppModel

    private var isUITesting: Bool {
        ProcessInfo.processInfo.arguments.contains("-ui-testing")
    }

    var body: some View {
        Group {
            if hasCompletedPairing || isUITesting {
                MainTabView {
                    model.disconnect()
                    hasCompletedPairing = false
                }
            } else {
                PairingView()
            }
        }
        .onChange(of: model.isReady) { _, isReady in
            if isReady { hasCompletedPairing = true }
        }
        .task {
#if DEBUG
            let arguments = ProcessInfo.processInfo.arguments
            if arguments.contains("-ui-touch") {
                model.prepareTouchPreviewForUITesting()
            } else if arguments.contains("-ui-testing") {
                model.enterDemoMode()
            }
#endif
        }
    }
}

private struct MainTabView: View {
    @State private var selection: Int
    @State private var careScrollRequest: Int
    let onForgetDevice: () -> Void

    init(onForgetDevice: @escaping () -> Void) {
        self.onForgetDevice = onForgetDevice
        let arguments = ProcessInfo.processInfo.arguments
        _selection = State(initialValue: arguments.contains("-ui-memories") ? 2 : 0)
        _careScrollRequest = State(initialValue: arguments.contains("-ui-care") ? 1 : 0)
    }

    private var routedSelection: Binding<Int> {
        Binding(
            get: { selection },
            set: { nextSelection in
                if nextSelection == 1 {
                    selection = 0
                    careScrollRequest += 1
                } else {
                    selection = nextSelection
                }
            }
        )
    }

    var body: some View {
        TabView(selection: routedSelection) {
            CompanionView(
                onForgetDevice: onForgetDevice,
                careScrollRequest: careScrollRequest
            )
                .tabItem {
                    Label("tab.companion", systemImage: "sparkles")
                }
                .tag(0)

            CareView()
                .tabItem {
                    Label("tab.care", systemImage: "leaf.fill")
                }
                .tag(1)

            MemoriesView()
                .tabItem {
                    Label("tab.memories", systemImage: "clock.arrow.circlepath")
                }
                .tag(2)
        }
        .tint(.pmOLEDGreen)
        .toolbarColorScheme(.dark, for: .tabBar)
        .toolbarBackground(Color.pmInk.opacity(0.94), for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
        .sensoryFeedback(.selection, trigger: selection)
        .sensoryFeedback(.selection, trigger: careScrollRequest)
    }
}

#Preview {
    AppRootView()
        .environmentObject(AppModel(client: MockPlantMonsterBLEClient()))
}
