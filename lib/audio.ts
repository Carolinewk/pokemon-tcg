let context: AudioContext | undefined;
export function playSound(kind = "card") {
  try {
    context ??= new AudioContext();
    void context.resume();
    const now = context.currentTime;
    const notes =
      kind === "attack"
        ? [140, 70]
        : kind === "win"
          ? [392, 494, 587, 784]
          : kind === "energy"
            ? [523, 784]
            : kind === "coin"
              ? [1200, 900, 1400]
              : [380, 510];
    notes.forEach((frequency, i) => {
      const osc = context!.createOscillator();
      const gain = context!.createGain();
      osc.type = kind === "attack" ? "triangle" : "sine";
      osc.frequency.setValueAtTime(frequency, now + i * 0.065);
      osc.frequency.exponentialRampToValueAtTime(
        frequency * 0.65,
        now + i * 0.065 + 0.14,
      );
      gain.gain.setValueAtTime(0.0001, now + i * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.07, now + i * 0.065 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.065 + 0.22);
      osc.connect(gain);
      gain.connect(context!.destination);
      osc.start(now + i * 0.065);
      osc.stop(now + i * 0.065 + 0.24);
    });
  } catch {
    /* Sound is optional on devices without Web Audio. */
  }
}
