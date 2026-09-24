import SwiftUI

struct AppRootView: View {
    @AppStorage("plantMonster.hasCompletedPairing") private var hasCompletedPairing = false
    @EnvironmentObject private var model: AppModel

    var body: some View {
        Group {
            if hasCompletedPairing {
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
    }
}

private struct MainTabView: View {
    @State private var selection = 0
    let onForgetDevice: () -> Void

    var body: some View {
        TabView(selection: $selection) {
            CompanionView(onForgetDevice: onForgetDevice)
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
        .toolbarBackground(.ultraThinMaterial, for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
    }
}

#Preview {
    AppRootView()
        .environmentObject(AppModel(client: MockPlantMonsterBLEClient()))
}

