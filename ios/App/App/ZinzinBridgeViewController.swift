import UIKit
import Capacitor

/// Vue Capacitor de Zinzin : enregistre les plugins natifs propres à l'app
/// (ceux des paquets npm sont enregistrés automatiquement par Capacitor).
class ZinzinBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppIconPlugin())
    }
}
