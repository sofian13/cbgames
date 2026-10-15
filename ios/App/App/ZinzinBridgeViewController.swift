import UIKit
import Capacitor
import CoreMotion

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
            // Face cachée : capteur coupé en arrière-plan (batterie), relancé au retour
            NotificationCenter.default.addObserver(self, selector: #selector(startFaceDown), name: UIApplication.didBecomeActiveNotification, object: nil)
            NotificationCenter.default.addObserver(self, selector: #selector(stopFaceDown), name: UIApplication.didEnterBackgroundNotification, object: nil)
        }
        startFaceDown()
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

    // MARK: - Face cachée (easter egg de l'accueil)
    // Téléphone posé écran contre la table ≥ 2 s puis retourné : événement window « zzfacedown ».
    // Accéléromètre brut à 5 Hz (pas de fusion de capteurs, coût quasi nul) ; aucune permission
    // ni clé Info.plist (NSMotionUsageDescription ne concerne que CMMotionActivity / podomètre).
    // z ≈ +1 g : écran vers le bas ; z < 0 : écran de nouveau vers le haut (ou tenu en main).

    private let faceMotion = CMMotionManager()
    private var faceDownSince: Date?
    private var faceDownArmed = false
    private var lowZ = 0.0

    @objc private func startFaceDown() {
        guard faceMotion.isAccelerometerAvailable, !faceMotion.isAccelerometerActive else { return }
        faceDownSince = nil
        faceDownArmed = false
        lowZ = 0
        faceMotion.accelerometerUpdateInterval = 0.2
        faceMotion.startAccelerometerUpdates(to: .main) { [weak self] data, _ in
            guard let self = self, let a = data?.acceleration else { return }
            // Léger lissage : un choc sur la table ne compte pas
            self.lowZ = self.lowZ * 0.5 + a.z * 0.5
            if self.lowZ > 0.85 {
                if self.faceDownSince == nil { self.faceDownSince = Date() }
                if let t = self.faceDownSince, Date().timeIntervalSince(t) >= 2 { self.faceDownArmed = true }
            } else if self.lowZ < -0.2 {
                if self.faceDownArmed { self.bridge?.triggerWindowJSEvent(eventName: "zzfacedown") }
                self.faceDownSince = nil
                self.faceDownArmed = false
            } else if !self.faceDownArmed {
                // Sur la tranche, pas assez longtemps : on recommence à compter
                self.faceDownSince = nil
            }
        }
    }

    @objc private func stopFaceDown() {
        if faceMotion.isAccelerometerActive { faceMotion.stopAccelerometerUpdates() }
        faceDownSince = nil
        faceDownArmed = false
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
