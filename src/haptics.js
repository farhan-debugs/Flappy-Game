// Cross-platform Haptic Feedback for Android (Capacitor + Web Navigator)

let Haptics = null;
let ImpactStyle = null;

// Dynamically import Capacitor Haptics if available in native runtime
async function initHaptics() {
  try {
    const mod = await import('@capacitor/haptics');
    Haptics = mod.Haptics;
    ImpactStyle = mod.ImpactStyle;
  } catch (e) {
    // Web fallback mode
  }
}
initHaptics();

// Light tap on flap jump
export async function hapticFlap() {
  try {
    if (Haptics && ImpactStyle) {
      await Haptics.impact({ style: ImpactStyle.Light });
      return;
    }
  } catch (e) {}

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(12);
    } catch (e) {}
  }
}

// Medium tap on passing pipe / score
export async function hapticScore() {
  try {
    if (Haptics && ImpactStyle) {
      await Haptics.impact({ style: ImpactStyle.Medium });
      return;
    }
  } catch (e) {}

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(28);
    } catch (e) {}
  }
}

// Heavy impact on game over collision
export async function hapticCrash() {
  try {
    if (Haptics && ImpactStyle) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      return;
    }
  } catch (e) {}

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([40, 30, 80]);
    } catch (e) {}
  }
}
