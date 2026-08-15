import UIKit

final class DialogPlugin: WefterPlugin {

    // @WefterMethod
    func alert(payload: [String: Any], callback: @escaping (Result<Any, Error>) -> Void) throws {
        let title      = payload["title"]      as? String
        let message    = payload["message"]    as? String ?? ""
        let buttonText = (payload["buttonText"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "OK"

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: buttonText, style: .default) { [weak self] _ in
                self?.resolve(callback, data: ["value": true])
            })
            self.present(alert)
        }
    }

    // @WefterMethod
    func confirm(payload: [String: Any], callback: @escaping (Result<Any, Error>) -> Void) throws {
        let title      = payload["title"]      as? String
        let message    = payload["message"]    as? String ?? ""
        let okText     = (payload["okText"]     as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "OK"
        let cancelText = (payload["cancelText"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "Cancel"

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: okText, style: .default) { [weak self] _ in
                self?.resolve(callback, data: ["value": true])
            })
            alert.addAction(UIAlertAction(title: cancelText, style: .cancel) { [weak self] _ in
                self?.resolve(callback, data: ["value": false])
            })
            self.present(alert)
        }
    }

    // @WefterMethod
    func prompt(payload: [String: Any], callback: @escaping (Result<Any, Error>) -> Void) throws {
        let title        = payload["title"]        as? String
        let message      = payload["message"]      as? String ?? ""
        let okText       = (payload["okText"]       as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "OK"
        let cancelText   = (payload["cancelText"]   as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "Cancel"
        let placeholder  = payload["placeholder"]  as? String ?? ""
        let inputTypeStr = payload["inputType"]     as? String ?? "text"
        let defaultValue = payload["defaultValue"]  as? String ?? ""

        let keyboardType: UIKeyboardType = DialogPlugin.keyboardType(for: inputTypeStr)
        let isSecure = inputTypeStr == "password"

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)

            alert.addTextField { tf in
                tf.placeholder       = placeholder
                tf.text              = defaultValue
                tf.keyboardType      = keyboardType
                tf.isSecureTextEntry = isSecure
                tf.autocorrectionType   = isSecure ? .no : .default
                tf.autocapitalizationType = isSecure ? .none : .sentences
            }

            alert.addAction(UIAlertAction(title: okText, style: .default) { [weak self, weak alert] _ in
                let value = alert?.textFields?.first?.text ?? ""
                self?.resolve(callback, data: ["cancelled": false, "value": value])
            })
            alert.addAction(UIAlertAction(title: cancelText, style: .cancel) { [weak self] _ in
                self?.resolve(callback, data: ["cancelled": true, "value": ""])
            })

            self.present(alert)
        }
    }

    // @WefterMethod
    func toast(payload: [String: Any], callback: @escaping (Result<Any, Error>) -> Void) throws {
        let text = payload["text"] as? String ?? ""
        guard !text.isEmpty else {
            reject(callback, code: "INVALID_TEXT", message: "toast text must not be empty")
            return
        }

        let displaySeconds: Double = {
            let raw = payload["duration"]
            if let str = raw as? String {
                return str == "long" ? 3.5 : 2.0
            }
            if let num = (raw as? NSNumber)?.doubleValue {
                return num > 60 ? num / 1000.0 : num
            }
            return 2.0
        }()

        let position = payload["position"] as? String ?? "bottom"

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.showToast(text: text, durationSeconds: displaySeconds, position: position)
            self.resolve(callback, data: ["shown": true])
        }
    }

    private func present(_ controller: UIAlertController) {
        guard let root = DialogPlugin.topViewController() else { return }
        root.present(controller, animated: true)
    }

    private func showToast(text: String, durationSeconds: Double, position: String) {
        guard let window = DialogPlugin.keyWindow() else { return }

        let label = UILabel()
        label.text            = text
        label.textColor       = .white
        label.backgroundColor = UIColor(white: 0.1, alpha: 0.88)
        label.font            = UIFont.systemFont(ofSize: 14, weight: .medium)
        label.textAlignment   = .center
        label.numberOfLines   = 0
        label.layer.cornerRadius = 10
        label.layer.masksToBounds = true
        label.alpha           = 0

        let maxWidth = window.bounds.width * 0.8
        let hPad: CGFloat = 20
        let vPad: CGFloat = 12
        let size = label.sizeThatFits(CGSize(width: maxWidth - hPad * 2, height: .greatestFiniteMagnitude))
        let w = min(size.width + hPad * 2, maxWidth)
        let h = size.height + vPad * 2

        let safeTop    = window.safeAreaInsets.top
        let safeBottom = window.safeAreaInsets.bottom
        let y: CGFloat = {
            switch position {
            case "top":    return safeTop + 60
            case "center": return (window.bounds.height - h) / 2
            default:       return window.bounds.height - safeBottom - h - 60
            }
        }()

        label.frame = CGRect(x: (window.bounds.width - w) / 2, y: y, width: w, height: h)
        window.addSubview(label)

        UIView.animate(withDuration: 0.25) {
            label.alpha = 1
        } completion: { _ in
            UIView.animate(withDuration: 0.5, delay: max(durationSeconds - 0.5, 0.1)) {
                label.alpha = 0
            } completion: { _ in
                label.removeFromSuperview()
            }
        }
    }

    private static func keyboardType(for inputType: String) -> UIKeyboardType {
        switch inputType {
        case "email":    return .emailAddress
        case "number":   return .numberPad
        case "url":      return .URL
        case "tel":      return .phonePad
        default:         return .default
        }
    }

    private static func keyWindow() -> UIWindow? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .last { $0.isKeyWindow }
    }

    private static func topViewController(base: UIViewController? = nil) -> UIViewController? {
        let root = base ?? keyWindow()?.rootViewController
        if let nav = root as? UINavigationController {
            return topViewController(base: nav.visibleViewController)
        }
        if let tab = root as? UITabBarController {
            return topViewController(base: tab.selectedViewController)
        }
        if let presented = root?.presentedViewController {
            return topViewController(base: presented)
        }
        return root
    }
}
