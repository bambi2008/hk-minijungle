import SwiftUI

@main
struct PlantMonsterApp: App {
    @StateObject private var model = AppModel(client: PlantMonsterBLEClientFactory.makeDefault())

    var body: some Scene {
        WindowGroup {
            AppRootView()
                .environmentObject(model)
                .tint(.pmAubergine)
        }
    }
}

