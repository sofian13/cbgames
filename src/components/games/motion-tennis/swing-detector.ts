export type SwingType = "forehand" | "backhand" | "smash" | "slice" | "lob";

export interface SwingResult {
  type: SwingType;
  power: number; // 0-1
}

interface MotionSample {
  ax: number;
  ay: number;
  az: number;
  gamma: number; // rotationRate
  beta: number;
  alpha: number;
  timestamp: number;
}

const COOLDOWN_MS = 400;
const BUFFER_SIZE = 10;

// Thresholds
const GAMMA_THRESHOLD = 150; // deg/s
const ACCEL_X_THRESHOLD = 15; // m/s²
const SMASH_Y_THRESHOLD = -20;
const SMASH_BETA_THRESHOLD = 150;
const SLICE_Y_THRESHOLD = 12;
const SLICE_GAMMA_MAX = 100;
const LOB_Y_THRESHOLD = 8; // gentler upward motion
const LOB_GAMMA_MAX = 60;  // very little wrist rotation
const LOB_POWER_MAX = 0.4; // low total acceleration = gentle lift

export class SwingDetector {
  private buffer: MotionSample[] = [];
  private lastSwingTime = 0;
  private calibrationOffsets = { ax: 0, ay: 0, az: 0 };
  private calibrationSamples: MotionSample[] = [];
  private isCalibrated = false;

  addSample(event: DeviceMotionEvent): SwingResult | null {
    const acc = event.accelerationIncludingGravity;
    const rot = event.rotationRate;
    if (!acc || !rot) return null;

    const sample: MotionSample = {
      ax: (acc.x ?? 0) - this.calibrationOffsets.ax,
      ay: (acc.y ?? 0) - this.calibrationOffsets.ay,
      az: (acc.z ?? 0) - this.calibrationOffsets.az,
      gamma: rot.gamma ?? 0,
      beta: rot.beta ?? 0,
      alpha: rot.alpha ?? 0,
      timestamp: Date.now(),
    };

    this.buffer.push(sample);
    if (this.buffer.length > BUFFER_SIZE) {
      this.buffer.shift();
    }

    if (this.buffer.length < 3) return null;

    // Check cooldown
    if (Date.now() - this.lastSwingTime < COOLDOWN_MS) return null;

    return this.detect();
  }

  calibrate(event: DeviceMotionEvent) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    this.calibrationSamples.push({
      ax: acc.x ?? 0,
      ay: acc.y ?? 0,
      az: acc.z ?? 0,
      gamma: 0,
      beta: 0,
      alpha: 0,
      timestamp: Date.now(),
    });

    if (this.calibrationSamples.length >= 30) {
      const avg = this.calibrationSamples.reduce(
        (a, s) => ({ ax: a.ax + s.ax, ay: a.ay + s.ay, az: a.az + s.az }),
        { ax: 0, ay: 0, az: 0 }
      );
      const n = this.calibrationSamples.length;
      this.calibrationOffsets = {
        ax: avg.ax / n,
        ay: avg.ay / n,
        az: avg.az / n,
      };
      this.isCalibrated = true;
      this.calibrationSamples = [];
    }
  }

  get calibrated() {
    return this.isCalibrated;
  }

  private detect(): SwingResult | null {
    // Find peak values in buffer
    let peakGamma = 0;
    let peakAccX = 0;
    let peakAccYDown = 0; // most negative (downward)
    let peakAccYUp = 0;   // most positive (upward)
    let peakBeta = 0;

    for (const s of this.buffer) {
      if (Math.abs(s.gamma) > Math.abs(peakGamma)) peakGamma = s.gamma;
      if (Math.abs(s.ax) > Math.abs(peakAccX)) peakAccX = s.ax;
      if (s.ay < peakAccYDown) peakAccYDown = s.ay;
      if (s.ay > peakAccYUp) peakAccYUp = s.ay;
      if (Math.abs(s.beta) > Math.abs(peakBeta)) peakBeta = s.beta;
    }

    const maxAccelMag = Math.sqrt(peakAccX ** 2 + Math.max(Math.abs(peakAccYDown), peakAccYUp) ** 2);

    // 1. Smash: strong downward acceleration + high beta rotation
    if (peakAccYDown < SMASH_Y_THRESHOLD && Math.abs(peakBeta) > SMASH_BETA_THRESHOLD) {
      this.lastSwingTime = Date.now();
      this.buffer = [];
      return {
        type: "smash",
        power: Math.min(1, Math.abs(peakAccYDown) / 40),
      };
    }

    // 2. Lob: gentle upward motion with very little wrist rotation (before slice check)
    if (
      peakAccYUp > LOB_Y_THRESHOLD &&
      peakAccYUp < SLICE_Y_THRESHOLD &&
      Math.abs(peakGamma) < LOB_GAMMA_MAX &&
      maxAccelMag / 30 < LOB_POWER_MAX
    ) {
      this.lastSwingTime = Date.now();
      this.buffer = [];
      return {
        type: "lob",
        power: Math.min(1, peakAccYUp / 20),
      };
    }

    // 3. Slice: upward acceleration with low gamma (stronger than lob)
    if (peakAccYUp > SLICE_Y_THRESHOLD && Math.abs(peakGamma) < SLICE_GAMMA_MAX) {
      this.lastSwingTime = Date.now();
      this.buffer = [];
      return {
        type: "slice",
        power: Math.min(1, peakAccYUp / 25),
      };
    }

    // 4. Forehand: high positive gamma rotation
    if (peakGamma > GAMMA_THRESHOLD && peakAccX > ACCEL_X_THRESHOLD) {
      this.lastSwingTime = Date.now();
      this.buffer = [];
      return {
        type: "forehand",
        power: Math.min(1, maxAccelMag / 30),
      };
    }

    // 5. Backhand: high negative gamma rotation
    if (peakGamma < -GAMMA_THRESHOLD && peakAccX < -ACCEL_X_THRESHOLD) {
      this.lastSwingTime = Date.now();
      this.buffer = [];
      return {
        type: "backhand",
        power: Math.min(1, maxAccelMag / 30),
      };
    }

    return null;
  }

  reset() {
    this.buffer = [];
    this.lastSwingTime = 0;
  }
}
