import Foundation

enum AppEnvironment {
    static let appURL: URL? = {
        guard let rawValue = Bundle.main.object(forInfoDictionaryKey: "FIVECROP_APP_URL") as? String else {
            return nil
        }
        return URL(string: rawValue.trimmingCharacters(in: .whitespacesAndNewlines))
    }()

    static var configurationError: String? {
        guard let appURL else {
            return "FiveCrop has no app URL. Set FIVECROP_APP_URL before building."
        }
        guard let scheme = appURL.scheme?.lowercased(), ["http", "https"].contains(scheme), appURL.host != nil else {
            return "FIVECROP_APP_URL must be a valid HTTP or HTTPS address."
        }
        guard appURL.queryItems["mode"] == "customer" else {
            return "The TestFlight URL must open the customer experience."
        }
        guard appURL.queryItems["realVision"] == "required" else {
            return "The TestFlight URL must require real vision results."
        }

#if !DEBUG
        guard scheme == "https" else {
            return "Release builds require an HTTPS FiveCrop service."
        }
        guard appURL.host != "replace-me.invalid" else {
            return "Replace the placeholder service URL before archiving."
        }
#endif
        return nil
    }

    static func matchesConfiguredOrigin(_ origin: WKSecurityOriginSnapshot) -> Bool {
        guard let appURL,
              let expectedScheme = appURL.scheme?.lowercased(),
              let expectedHost = appURL.host?.lowercased() else {
            return false
        }
        let expectedPort = appURL.port ?? (expectedScheme == "https" ? 443 : 80)
        return origin.scheme.lowercased() == expectedScheme
            && origin.host.lowercased() == expectedHost
            && origin.port == expectedPort
    }
}

struct WKSecurityOriginSnapshot {
    let scheme: String
    let host: String
    let port: Int
}

private extension URL {
    var queryItems: [String: String] {
        guard let components = URLComponents(url: self, resolvingAgainstBaseURL: false) else {
            return [:]
        }
        return Dictionary(uniqueKeysWithValues: (components.queryItems ?? []).compactMap { item in
            item.value.map { (item.name, $0) }
        })
    }
}
