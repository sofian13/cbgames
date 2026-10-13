/**
 * Capteurs du Verre Invisible : inclinaison du tél (plateau) + secousses.
 * - App native : @capacitor/motion (orientation + accel) ;
 * - Web : DeviceOrientationEvent / DeviceMotionEvent (permission iOS demandée au tap) ;
 * - Rien (desktop, refus) : mode tactile, on incline en glissant le doigt.
 * Tout est stocké dans un objet mutable lu à chaque image (aucun re-rendu React).
 */

export interface TiltInput {
  /** inclinaison avant/arrière brute (°), 0 = à plat */
  beta: number;
  /** inclinaison gauche/droite brute (°), 0 = à plat */
  gamma: number;
  /** accélération linéaire (m/s², sans la gravité) */
  ax: number;
  ay: number;
  az: number;
  /** au moins un vrai événement d'orientation reçu */
  live: boolean;
  /** horodatage du dernier événement (ms) */
  last: number;
}

export function newTiltInput(): TiltInput {
  return { beta: 0, gamma: 0, ax: 0, ay: 0, az: 0, live: false, last: 0 };
}

type PermCtor = { requestPermission?: () => Promise<"granted" | "denied"> };

export type PermResult = "granted" | "denied" | "unavailable";

/**
 * À appeler DANS le geste (tap), sans await avant : iOS refuse sinon.
 * Demande orientation + mouvement en parallèle.
 */
export function requestMotionPermission(): Promise<PermResult> {
  if (typeof window === "undefined") return Promise.resolve("unavailable");
  const w = window as unknown as { DeviceOrientationEvent?: PermCtor; DeviceMotionEvent?: PermCtor };
  const DO = w.DeviceOrientationEvent;
  const DM = w.DeviceMotionEvent;
  if (!DO && !DM) return Promise.resolve("unavailable");
  const asks: Promise<string>[] = [];
  if (DO && typeof DO.requestPermission === "function") asks.push(DO.requestPermission());
  if (DM && typeof DM.requestPermission === "function") asks.push(DM.requestPermission());
  if (!asks.length) return Promise.resolve("granted"); // Android / desktop : pas de permission
  // Seul un refus explicite compte (Chrome Android répond parfois « prompt » mais envoie quand même les événements)
  return Promise.all(asks)
    .then((r) => (r.includes("denied") ? "denied" : "granted") as PermResult)
    .catch(() => "denied" as PermResult);
}

function isNative(): boolean {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

type OrientLike = { beta?: number | null; gamma?: number | null };
type AccelLike = { acceleration?: { x?: number | null; y?: number | null; z?: number | null } | null };

/** Branche les capteurs sur `input`. Renvoie l'arrêt. */
export function startSensors(input: TiltInput): () => void {
  if (typeof window === "undefined") return () => {};
  let stopped = false;
  const onOrient = (e: OrientLike) => {
    if (e.beta == null || e.gamma == null) return;
    input.beta = e.beta;
    input.gamma = e.gamma;
    input.live = true;
    input.last = performance.now();
  };
  const onAccel = (e: AccelLike) => {
    const a = e.acceleration;
    if (!a) return;
    input.ax = a.x ?? 0;
    input.ay = a.y ?? 0;
    input.az = a.z ?? 0;
  };

  if (isNative()) {
    // App : plugin Motion (même source que la webview, mais API officielle de l'app)
    const handles: { remove: () => Promise<void> }[] = [];
    import("@capacitor/motion")
      .then(async ({ Motion }) => {
        if (stopped) return;
        handles.push(await Motion.addListener("orientation", (e) => onOrient(e as unknown as OrientLike)));
        handles.push(await Motion.addListener("accel", (e) => onAccel(e as unknown as AccelLike)));
        if (stopped) handles.forEach((h) => void h.remove());
      })
      .catch(() => {
        // plugin indisponible : on retombe sur les événements du navigateur
        window.addEventListener("deviceorientation", onOrient);
        window.addEventListener("devicemotion", onAccel);
      });
    return () => {
      stopped = true;
      handles.forEach((h) => void h.remove());
      window.removeEventListener("deviceorientation", onOrient);
      window.removeEventListener("devicemotion", onAccel);
    };
  }

  window.addEventListener("deviceorientation", onOrient);
  window.addEventListener("devicemotion", onAccel);
  return () => {
    stopped = true;
    window.removeEventListener("deviceorientation", onOrient);
    window.removeEventListener("devicemotion", onAccel);
  };
}

/** Écran allumé pendant la manche (Wake Lock si dispo). Renvoie la libération. */
export function keepAwake(): () => void {
  type Sentinel = { release: () => Promise<void> };
  const nav = typeof navigator !== "undefined" ? (navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<Sentinel> } }) : null;
  if (!nav?.wakeLock) return () => {};
  let lock: Sentinel | null = null;
  let done = false;
  const ask = () => {
    if (done || document.visibilityState !== "visible") return;
    nav.wakeLock!.request("screen").then((l) => {
      if (done) void l.release();
      else lock = l;
    }).catch(() => {});
  };
  ask();
  // Le verrou saute quand l'app passe en arrière-plan : on le reprend au retour
  document.addEventListener("visibilitychange", ask);
  return () => {
    done = true;
    document.removeEventListener("visibilitychange", ask);
    if (lock) void lock.release().catch(() => {});
  };
}

/** Vibration (dans l'app iOS, navigator.vibrate est branché sur Haptics par main.tsx). */
export function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(pattern);
  } catch {
    /* indispo */
  }
}
