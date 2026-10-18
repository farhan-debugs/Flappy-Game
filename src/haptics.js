// Cross-platform Haptic Feedback for Android (Capacitor + Web Navigator)
// Completely browser-safe with zero bare module imports

// Light tap on flap jump
export async function hapticFlap() {
  try {
    const Haptics = window.Capacitor?.Plugins?.Haptics;
    if (Haptics) {
      await Haptics.impact({ style: 'LIGHT' });
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
    const Haptics = window.Capacitor?.Plugins?.Haptics;
    if (Haptics) {
      await Haptics.impact({ style: 'MEDIUM' });
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
    const Haptics = window.Capacitor?.Plugins?.Haptics;
    if (Haptics) {
      await Haptics.impact({ style: 'HEAVY' });
      return;
    }
  } catch (e) {}

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([40, 30, 80]);
    } catch (e) {}
  }
}
