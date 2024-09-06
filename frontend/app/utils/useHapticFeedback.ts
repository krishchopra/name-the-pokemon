declare global {
  interface Navigator {
    (pattern: VibratePattern): boolean;
    (pattern: Iterable<number>): boolean;
  }
}
type VibratePattern = number | number[];

export function useHapticFeedback() {
  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return { vibrate };
}
