import UIKit
import Capacitor

/// Icônes alternatives (Zinzin+) : Classique, Or, Nuit, Néon, Halloween.
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
        CAPPluginMethod(name: "setName", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getBattery", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getMotion", returnType: CAPPluginReturnPromise)
    ]

    /// Seules ces icônes peuvent être demandées depuis le JS
    private let allowed: Set<String> = ["AppIcon-Or", "AppIcon-Nuit", "AppIcon-Neon", "AppIcon-Halloween"]

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

    /// Secret de l'accueil (batterie faible, TiredBlob.tsx) : niveau (0…1, -1 si inconnu) et en charge ?
    /// Lu à la demande (pas d'observateur) ; la surveillance reste active, son coût est nul.
    @objc func getBattery(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let device = UIDevice.current
            device.isBatteryMonitoringEnabled = true
            let state = device.batteryState
            call.resolve([
                "level": Double(device.batteryLevel),
                "charging": state == .charging || state == .full,
                "known": state != .unknown
            ])
        }
    }

    /// Diagnostic du capteur de mouvement (téléphone retourné, secousse) : générique secret.
    @objc func getMotion(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            call.resolve([
                "available": ZinzinMotionStatus.available,
                "active": ZinzinMotionStatus.active,
                "samples": ZinzinMotionStatus.samples,
                "armed": ZinzinMotionStatus.armed,
                "fired": ZinzinMotionStatus.fired,
                "shakes": ZinzinMotionStatus.shakes,
                "maxZ": ZinzinMotionStatus.maxZ,
                "pauses": ZinzinMotionStatus.pauses,
            ])
        }
    }
}
