import UIKit
import Capacitor

/// Icônes alternatives (Zinzin+) : Classique, Or, Nuit, Néon.
/// Les icônes sont dans Assets.xcassets (AppIcon-Or…) et listées dans le réglage
/// ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES du projet. API publique uniquement
/// (UIApplication.setAlternateIconName) : iOS affiche sa petite alerte de confirmation.
@objc(AppIconPlugin)
public class AppIconPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppIconPlugin"
    public let jsName = "ZinzinAppIcon"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getName", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setName", returnType: CAPPluginReturnPromise)
    ]

    /// Seules ces icônes peuvent être demandées depuis le JS
    private let allowed: Set<String> = ["AppIcon-Or", "AppIcon-Nuit", "AppIcon-Neon"]

    @objc func isSupported(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            call.resolve(["value": UIApplication.shared.supportsAlternateIcons])
        }
    }

    @objc func getName(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            call.resolve(["value": UIApplication.shared.alternateIconName ?? NSNull()])
        }
    }

    /// name = nil (ou absent) → icône classique
    @objc func setName(_ call: CAPPluginCall) {
        let name = call.getString("name")
        if let name = name, !allowed.contains(name) {
            call.reject("Unknown icon")
            return
        }
        DispatchQueue.main.async {
            guard UIApplication.shared.supportsAlternateIcons else {
                call.reject("Alternate icons not supported")
                return
            }
            if UIApplication.shared.alternateIconName == name {
                call.resolve()
                return
            }
            UIApplication.shared.setAlternateIconName(name) { error in
                if let error = error {
                    call.reject(error.localizedDescription, nil, error)
                } else {
                    call.resolve()
                }
            }
        }
    }
}
