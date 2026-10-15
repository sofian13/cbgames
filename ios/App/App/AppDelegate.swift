import UIKit
import AVFoundation
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Jeu de soirée : les sons doivent s'entendre même si l'iPhone est en mode silencieux,
        // sans couper la musique qui tourne déjà (mixWithOthers).
        // Lecture + enregistrement dès le départ : le micro (Chut !, voix des persos) marche du premier coup,
        // le son sort sur le haut-parleur, se mélange à la musique et ignore le bouton silencieux.
        try? AVAudioSession.sharedInstance().setCategory(.playAndRecord, mode: .default, options: [.mixWithOthers, .defaultToSpeaker, .allowBluetoothA2DP])
        try? AVAudioSession.sharedInstance().setActive(true)
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
        // (Avec UIScene, iOS n'appelle plus cette méthode : la session audio est surveillée par ZinzinBridgeViewController.)
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    // Orientation : l'app est verrouillée en portrait (plugin ScreenOrientation), sauf
    // « Deviner le Mot » qui passe en paysage. On applique le verrou de la vue Capacitor
    // à toute la fenêtre (feuilles présentées comprises). Fenêtre lue depuis le paramètre :
    // avec UIScene (Capacitor 8.5+), self.window de l'AppDelegate est toujours nil.
    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        guard let bridgeViewController = window?.rootViewController as? CAPBridgeViewController else {
            return .all
        }
        return bridgeViewController.supportedInterfaceOrientations
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}
