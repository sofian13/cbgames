import UIKit
import Capacitor

/// Vue Capacitor de Zinzin : enregistre les plugins natifs propres à l'app
/// (ceux des paquets npm sont enregistrés automatiquement par Capacitor).
class ZinzinBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppIconPlugin())
        // Pas de « Secouer pour annuler » (fenêtre système dans les champs) : la secousse est à l'accueil
        UIApplication.shared.applicationSupportsShakeToEdit = false
        // Pas de rebond élastique de la webview elle-même : tous les écrans défilent dans leurs
        // propres conteneurs (overflow-y: auto, inertie intacte) et l'accueil a son élastique en JS
        // (PullBlob). Ce rebond tirait toute la page (grand vide violet) au lieu de l'élastique.
        // Le défilement du document reste possible (scrollEnabled inchangé), seul le rebond saute.
        webView?.scrollView.bounces = false
        webView?.scrollView.alwaysBounceVertical = false
        webView?.scrollView.alwaysBounceHorizontal = false
    }

    // MARK: - Secousse (easter egg de l'accueil)
    // Détection native d'iOS (la même que « secouer pour annuler ») : fiable, sans permission,
    // déclenchée par une ou deux secousses franches. Le JS écoute l'événement window « zzshake ».

    /// Pour recevoir les secousses quand rien d'autre n'a le focus. Un champ de texte de la webview
    /// reprend le focus normalement (le clavier s'ouvre) ; les secousses remontent alors jusqu'ici
    /// par la chaîne des répondeurs (contenu web → webview → ce contrôleur).
    override var canBecomeFirstResponder: Bool { true }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        regainShakeFocus()
        if !observingActive {
            observingActive = true
            NotificationCenter.default.addObserver(self, selector: #selector(regainShakeFocus), name: UIApplication.didBecomeActiveNotification, object: nil)
        }
    }
    private var observingActive = false

    /// Retour au premier plan : on reprend le focus seulement si personne ne l'a (jamais au détriment d'un champ en saisie).
    @objc private func regainShakeFocus() {
        guard isViewLoaded, view.window != nil else { return }
        if UIResponder.zzCurrentFirstResponder() == nil { becomeFirstResponder() }
    }

    override func motionEnded(_ motion: UIEvent.EventSubtype, with event: UIEvent?) {
        if motion == .motionShake {
            bridge?.triggerWindowJSEvent(eventName: "zzshake")
        } else {
            super.motionEnded(motion, with: event)
        }
    }
}

private extension UIResponder {
    private static weak var zzFound: UIResponder?

    /// Répondeur qui a le focus (nil si aucun).
    static func zzCurrentFirstResponder() -> UIResponder? {
        zzFound = nil
        UIApplication.shared.sendAction(#selector(zzCaptureFirstResponder), to: nil, from: nil, for: nil)
        return zzFound
    }

    @objc func zzCaptureFirstResponder() {
        UIResponder.zzFound = self
    }
}
