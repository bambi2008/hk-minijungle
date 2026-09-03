import Foundation
import SwiftUI
import UIKit
import WebKit
import PhotosUI
import UniformTypeIdentifiers

struct FiveCropWebView: UIViewRepresentable {
    @ObservedObject var model: FiveCropWebModel

    func makeCoordinator() -> Coordinator {
        Coordinator(model: model)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = false
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.customUserAgent = "FiveCrop-iOS/0.1 TestFlight"

#if DEBUG
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
#endif

        let refreshControl = UIRefreshControl()
        refreshControl.addTarget(context.coordinator, action: #selector(Coordinator.refresh(_:)), for: .valueChanged)
        webView.scrollView.refreshControl = refreshControl
        context.coordinator.webView = webView
        context.coordinator.loadConfiguredPage(in: webView, reloadToken: model.reloadToken)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        guard context.coordinator.lastReloadToken != model.reloadToken else { return }
        context.coordinator.loadConfiguredPage(in: webView, reloadToken: model.reloadToken)
    }

    @MainActor
    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, PHPickerViewControllerDelegate {
        private let model: FiveCropWebModel
        weak var webView: WKWebView?
        var lastReloadToken = -1
        private var pendingFilePickerCompletion: (([URL]?) -> Void)?

        init(model: FiveCropWebModel) {
            self.model = model
        }

        func loadConfiguredPage(in webView: WKWebView, reloadToken: Int) {
            lastReloadToken = reloadToken
            guard let appURL = AppEnvironment.appURL else { return }
            model.isLoading = true
            model.errorMessage = nil
            webView.load(URLRequest(url: appURL, cachePolicy: .reloadRevalidatingCacheData, timeoutInterval: 45))
        }

        @objc func refresh(_ sender: UIRefreshControl) {
            sender.endRefreshing()
            model.retry()
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            model.isLoading = true
            model.errorMessage = nil
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            model.isLoading = false
            model.errorMessage = nil
            webView.scrollView.refreshControl?.endRefreshing()
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            show(error: error, webView: webView)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            show(error: error, webView: webView)
        }

        private func show(error: Error, webView: WKWebView) {
            model.isLoading = false
            model.errorMessage = "Check your connection and the FiveCrop service, then try again. (\(error.localizedDescription))"
            webView.scrollView.refreshControl?.endRefreshing()
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard navigationAction.navigationType == .linkActivated,
                  let targetURL = navigationAction.request.url,
                  let configuredURL = AppEnvironment.appURL,
                  targetURL.host?.lowercased() != configuredURL.host?.lowercased() else {
                decisionHandler(.allow)
                return
            }
            UIApplication.shared.open(targetURL)
            decisionHandler(.cancel)
        }

        func webView(
            _ webView: WKWebView,
            requestMediaCapturePermissionFor origin: WKSecurityOrigin,
            initiatedByFrame frame: WKFrameInfo,
            type: WKMediaCaptureType,
            decisionHandler: @escaping (WKPermissionDecision) -> Void
        ) {
            let snapshot = WKSecurityOriginSnapshot(
                scheme: origin.protocol,
                host: origin.host,
                port: origin.port
            )
            let isAllowedCameraRequest = type == .camera && AppEnvironment.matchesConfiguredOrigin(snapshot)
            decisionHandler(isAllowedCameraRequest ? .grant : .deny)
        }

        func webView(
            _ webView: WKWebView,
            runOpenPanelWith parameters: WKOpenPanelParameters,
            initiatedByFrame frame: WKFrameInfo,
            completionHandler: @escaping ([URL]?) -> Void
        ) {
            pendingFilePickerCompletion?(nil)
            pendingFilePickerCompletion = completionHandler

            var configuration = PHPickerConfiguration(photoLibrary: .shared())
            configuration.filter = .images
            configuration.selectionLimit = parameters.allowsMultipleSelection ? 0 : 1

            let picker = PHPickerViewController(configuration: configuration)
            picker.delegate = self
            guard let presenter = topViewController(for: webView) else {
                finishFilePicker(with: nil)
                return
            }
            presenter.present(picker, animated: true)
        }

        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            picker.dismiss(animated: true)
            guard !results.isEmpty else {
                finishFilePicker(with: nil)
                return
            }

            let group = DispatchGroup()
            var urls = [URL?](repeating: nil, count: results.count)
            let lock = NSLock()

            for (index, result) in results.enumerated() {
                group.enter()
                result.itemProvider.loadDataRepresentation(forTypeIdentifier: UTType.image.identifier) { [weak self] data, _ in
                    defer { group.leave() }
                    guard let data,
                          let self,
                          let url = self.writePickedImage(data, index: index) else {
                        return
                    }
                    lock.lock()
                    urls[index] = url
                    lock.unlock()
                }
            }

            group.notify(queue: .main) { [weak self] in
                self?.finishFilePicker(with: urls.compactMap { $0 })
            }
        }

        private func writePickedImage(_ data: Data, index: Int) -> URL? {
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("fivecrop-photo-\(UUID().uuidString)-\(index).jpg")
            do {
                try data.write(to: url, options: .atomic)
                return url
            } catch {
                return nil
            }
        }

        private func finishFilePicker(with urls: [URL]?) {
            let completion = pendingFilePickerCompletion
            pendingFilePickerCompletion = nil
            completion?(urls)
        }

        private func topViewController(for webView: WKWebView) -> UIViewController? {
            guard let root = webView.window?.rootViewController else { return nil }
            var current = root
            while let presented = current.presentedViewController {
                current = presented
            }
            return current
        }
    }
}
