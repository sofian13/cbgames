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
            // Capture d'écran (secret de l'accueil) : un blob réagit
            NotificationCenter.default.addObserver(self, selector: #selector(screenshotTaken), name: UIApplication.userDidTakeScreenshotNotification, object: nil)
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
    // Secousse maison (plus facile à déclencher que celle d'iOS) : gravité estimée + pics d'accélération
    private var grav = (x: 0.0, y: 0.0, z: -1.0)
    private var shakePeaks: [Date] = []
    private var lastShake = Date.distantPast
    private var lastPeak = Date.distantPast
    /// Moment où le capteur a été coupé alors que le téléphone était retourné (pause d'iOS)
    private var pausedFaceDown: Date?

    @objc private func startFaceDown() {
        ZinzinMotionStatus.available = faceMotion.isAccelerometerAvailable
        guard faceMotion.isAccelerometerAvailable else { return }
        guard !faceMotion.isAccelerometerActive else { return }
        faceDownSince = nil
        // Retour après une pause « face cachée » (moins de 10 min) : armé, il suffit d'être de nouveau à l'endroit
        faceDownArmed = pausedFaceDown.map { Date().timeIntervalSince($0) < 600 } ?? false
        if faceDownArmed { ZinzinMotionStatus.armed += 1 }
        pausedFaceDown = nil
        lowZ = 0
        // 20 mesures par seconde : assez pour une secousse, coût négligeable
        faceMotion.accelerometerUpdateInterval = 0.05
        ZinzinMotionStatus.active = true
        faceMotion.startAccelerometerUpdates(to: .main) { [weak self] data, _ in
            guard let self = self, let a = data?.acceleration else { return }
            ZinzinMotionStatus.samples += 1
            ZinzinMotionStatus.maxZ = max(ZinzinMotionStatus.maxZ, a.z)
            let now = Date()
            // ── Face cachée ── z ≈ +1 g : écran vers le bas (lissé : un choc sur la table ne compte pas)
            self.lowZ = self.lowZ * 0.8 + a.z * 0.2
            if self.lowZ > 0.8 {
                if self.faceDownSince == nil { self.faceDownSince = now }
                if !self.faceDownArmed, let t = self.faceDownSince, now.timeIntervalSince(t) >= 1.5 {
                    self.faceDownArmed = true
                    ZinzinMotionStatus.armed += 1
                }
            } else if self.faceDownArmed && self.lowZ < 0.3 {
                // Relevé : écran vers le haut OU simplement redressé (tenu à la verticale, z ≈ 0)
                ZinzinMotionStatus.fired += 1
                self.bridge?.triggerWindowJSEvent(eventName: "zzfacedown")
                self.faceDownSince = nil
                self.faceDownArmed = false
            } else if !self.faceDownArmed {
                self.faceDownSince = nil
            }
            // ── Secousse ── accélération hors gravité > 1,1 g, 4 pics en 1 s
            let k = 0.85
            self.grav = (self.grav.x * k + a.x * (1 - k), self.grav.y * k + a.y * (1 - k), self.grav.z * k + a.z * (1 - k))
            let hx = a.x - self.grav.x, hy = a.y - self.grav.y, hz = a.z - self.grav.z
            if (hx * hx + hy * hy + hz * hz).squareRoot() > 1.1 && now.timeIntervalSince(self.lastPeak) > 0.09 {
                self.lastPeak = now
                self.shakePeaks.append(now)
                self.shakePeaks.removeAll { now.timeIntervalSince($0) > 1.0 }
                if self.shakePeaks.count >= 4 && now.timeIntervalSince(self.lastShake) > 1.5 {
                    self.lastShake = now
                    self.shakePeaks.removeAll()
                    ZinzinMotionStatus.shakes += 1
                    self.bridge?.triggerWindowJSEvent(eventName: "zzshake")
                }
            }
        }
    }

    @objc private func screenshotTaken() {
        bridge?.triggerWindowJSEvent(eventName: "zzscreenshot")
    }

    @objc private func stopFaceDown() {
        if faceMotion.isAccelerometerActive {
            // Mis en pause alors que le téléphone est (ou passe) face contre la table : iOS peut éteindre
            // l'écran / mettre l'app en pause dès qu'on le retourne. On s'en souvient pour déclencher au retour.
            if lowZ > 0.5 { pausedFaceDown = Date() }
            ZinzinMotionStatus.pauses += 1
            faceMotion.stopAccelerometerUpdates()
        }
        ZinzinMotionStatus.active = false
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

/// État du capteur de mouvement (diagnostic du générique secret, lu par le plugin ZinzinAppIcon.getMotion).
enum ZinzinMotionStatus {
    static var available = false
    static var active = false
    static var samples = 0
    static var armed = 0
    static var fired = 0
    static var shakes = 0
    /// Plus grande valeur z vue (≈ +1 = écran contre la table)
    static var maxZ = -2.0
    /// Nombre de fois où le capteur a été coupé (app en pause / arrière-plan)
    static var pauses = 0
}
