import UIKit
import AVFoundation
import Capacitor
import CoreMotion
import WebKit

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
        startAudioWatch()
    }

    // MARK: - Session audio (zéro son perdu)
    // Les sons doivent toujours repartir : après la veille, un appel, Siri, une alarme, un casque ou des
    // écouteurs Bluetooth branchés/débranchés, et après le micro (Chut !, voix des persos). On remet la
    // session telle que réglée au lancement (AppDelegate : lecture+enregistrement, haut-parleur, mélange
    // avec la musique, mode silencieux ignoré) puis on prévient le JS (événement window « zzaudioresume »,
    // écouté par src/lib/sfx.ts qui relance ou recrée son contexte audio).
    // Seul le bouton son de l'app (JS) coupe le son : rien ici ne le contourne, on ne fait que réparer la sortie.

    private static let audioOptions: AVAudioSession.CategoryOptions = [.mixWithOthers, .defaultToSpeaker, .allowBluetoothA2DP]
    private var audioWatching = false
    private var audioNotifyPending = false

    private func startAudioWatch() {
        guard !audioWatching else { return }
        audioWatching = true
        let nc = NotificationCenter.default
        let session = AVAudioSession.sharedInstance()
        // Fin d'interruption (appel, Siri, alarme, FaceTime…) : session réactivée, sons relancés
        nc.addObserver(forName: AVAudioSession.interruptionNotification, object: session, queue: .main) { [weak self] note in
            guard let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                  AVAudioSession.InterruptionType(rawValue: raw) == .ended else { return }
            self?.restoreAudio(defaultMode: false)
        }
        // Casque / Bluetooth / changement de catégorie (WebKit en ouvrant ou fermant le micro)
        nc.addObserver(forName: AVAudioSession.routeChangeNotification, object: session, queue: .main) { [weak self] _ in
            self?.restoreAudio(defaultMode: false)
        }
        // Services audio d'iOS redémarrés : tous les objets audio sont morts, le JS recrée son contexte
        nc.addObserver(forName: AVAudioSession.mediaServicesWereResetNotification, object: session, queue: .main) { [weak self] _ in
            self?.restoreAudio(defaultMode: true, reset: true)
        }
        // Retour au premier plan (UIScene : applicationDidBecomeActive n'est plus appelé, la notification si)
        nc.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main) { [weak self] _ in
            self?.restoreAudio(defaultMode: false)
        }
        // Le JS signale la fin du micro (window.webkit.messageHandlers.zzaudio.postMessage("mic-off"))
        webView?.configuration.userContentController.add(ZinzinAudioMessages(self), name: "zzaudio")
    }

    /// Le micro est rendu : la sortie revient en mode normal sur le haut-parleur (WebKit a pu laisser
    /// le mode « appel vidéo », plus faible ou dans l'écouteur). Revérifié un peu plus tard : WebKit
    /// referme sa capture de façon asynchrone.
    fileprivate func micReleased() {
        restoreAudio(defaultMode: true)
        for delay in [0.5, 1.5] {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in self?.restoreAudio(defaultMode: true) }
        }
    }

    /// Remet la catégorie de l'app si quelqu'un l'a changée (sans toucher au mode pendant une capture),
    /// réactive la session et prévient le JS (regroupé : une seule notification par rafale).
    private func restoreAudio(defaultMode: Bool, reset: Bool = false) {
        // En arrière-plan : rien (pas de mode audio d'arrière-plan) ; le retour au premier plan s'en charge
        guard UIApplication.shared.applicationState != .background else { return }
        let session = AVAudioSession.sharedInstance()
        let mode: AVAudioSession.Mode = defaultMode ? .default : session.mode
        let want = ZinzinBridgeViewController.audioOptions
        // Comparaison avant d'écrire : setCategory déclenche lui-même un changement de route (pas de boucle)
        if reset || session.category != .playAndRecord || !session.categoryOptions.isSuperset(of: want) || session.mode != mode {
            try? session.setCategory(.playAndRecord, mode: mode, options: want)
        }
        // Échoue pendant un appel : la fin d'interruption nous rappellera
        try? session.setActive(true)
        if reset {
            bridge?.triggerWindowJSEvent(eventName: "zzaudioresume", data: "{\"zzReset\":true}")
            return
        }
        guard !audioNotifyPending else { return }
        audioNotifyPending = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self] in
            self?.audioNotifyPending = false
            self?.bridge?.triggerWindowJSEvent(eventName: "zzaudioresume")
        }
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
            // App à scènes (UIScene) : on écoute aussi la scène, au cas où les notifications de l'app n'arrivent pas
            NotificationCenter.default.addObserver(self, selector: #selector(startFaceDown), name: UIScene.didActivateNotification, object: nil)
            NotificationCenter.default.addObserver(self, selector: #selector(stopFaceDown), name: UIScene.didEnterBackgroundNotification, object: nil)
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
    // z ≈ +1 g : écran vers le bas ; z < 0,3 après ≥ 1,5 s à plat face cachée : relevé (vers le haut ou à la verticale).

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
                if let t = self.faceDownSince, Date().timeIntervalSince(t) >= 1.5 { self.faceDownArmed = true }
            } else if self.faceDownArmed && self.lowZ < 0.3 {
                // Relevé : écran vers le haut OU simplement redressé (tenu à la verticale, z ≈ 0)
                self.bridge?.triggerWindowJSEvent(eventName: "zzfacedown")
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

/// Messages JS → natif pour l'audio (référence faible : pas de cycle avec la vue Capacitor).
private final class ZinzinAudioMessages: NSObject, WKScriptMessageHandler {
    private weak var owner: ZinzinBridgeViewController?
    init(_ owner: ZinzinBridgeViewController) { self.owner = owner }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if (message.body as? String) == "mic-off" { owner?.micReleased() }
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
