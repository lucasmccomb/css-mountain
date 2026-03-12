/**
 * PC speaker-style beep sounds generated via Web Audio oscillator.
 * No audio files needed - all sounds are synthesized.
 */

import type { AudioManager } from "./audio-manager";

/**
 * Play a button click sound (short high beep).
 */
export function playButtonClick(audio: AudioManager): void {
  audio.playTone(800, 0.05, "square", 0.3);
}

/**
 * Play a challenge complete sound (ascending tones).
 */
export function playChallengeComplete(audio: AudioManager): void {
  audio.playSequence([
    [523, 0.1],  // C5
    [659, 0.1],  // E5
    [784, 0.1],  // G5
    [1047, 0.2], // C6
  ]);
}

/**
 * Play a star earned sound (bright tone).
 */
export function playStarEarned(audio: AudioManager): void {
  audio.playSequence([
    [1047, 0.08], // C6
    [1319, 0.08], // E6
    [1568, 0.15], // G6
  ]);
}

/**
 * Play an error/wrong answer sound (descending dissonant tones).
 */
export function playError(audio: AudioManager): void {
  audio.playSequence([
    [300, 0.12],
    [200, 0.2],
  ]);
}

/**
 * Play a hint reveal sound (gentle ascending tone).
 */
export function playHintReveal(audio: AudioManager): void {
  audio.playSequence([
    [440, 0.08], // A4
    [523, 0.12], // C5
  ]);
}

/**
 * Play a zone transition sound (dramatic ascending arpeggio).
 */
export function playZoneTransition(audio: AudioManager): void {
  audio.playSequence([
    [262, 0.1],  // C4
    [330, 0.1],  // E4
    [392, 0.1],  // G4
    [523, 0.1],  // C5
    [659, 0.1],  // E5
    [784, 0.15], // G5
  ]);
}

/**
 * Play a boss defeat sound (triumphant fanfare).
 */
export function playBossDefeat(audio: AudioManager): void {
  audio.playSequence([
    [523, 0.12], // C5
    [523, 0.12], // C5
    [523, 0.12], // C5
    [523, 0.2],  // C5 (held)
    [415, 0.12], // Ab4
    [466, 0.12], // Bb4
    [523, 0.12], // C5
    [466, 0.08], // Bb4
    [523, 0.3],  // C5 (held)
  ]);
}

/**
 * Play a dialog advance sound (typewriter-style click).
 */
export function playDialogAdvance(audio: AudioManager): void {
  audio.playTone(600, 0.03, "square", 0.15);
}

/**
 * Simple chiptune-style zone ambient loop data.
 * Returns note sequences for each zone that can be played on repeat.
 */
export function getZoneAmbientNotes(zone: number): Array<[number, number]> {
  switch (zone) {
    case 1: // Junior - gentle, simple
      return [
        [262, 0.3], [294, 0.3], [330, 0.3], [294, 0.3],
        [262, 0.3], [247, 0.3], [262, 0.6],
      ];
    case 2: // Mid - slightly more complex
      return [
        [330, 0.2], [392, 0.2], [440, 0.2], [392, 0.2],
        [330, 0.2], [294, 0.2], [262, 0.2], [294, 0.2],
      ];
    case 3: // Senior - minor key, tenser
      return [
        [330, 0.25], [311, 0.25], [294, 0.25], [262, 0.25],
        [294, 0.25], [330, 0.25], [294, 0.5],
      ];
    case 4: // Staff - darker, deeper
      return [
        [196, 0.3], [220, 0.3], [233, 0.3], [220, 0.3],
        [196, 0.3], [175, 0.3], [196, 0.6],
      ];
    case 5: // Principal - epic, wide intervals
      return [
        [262, 0.2], [392, 0.2], [523, 0.4],
        [440, 0.2], [523, 0.2], [659, 0.4],
        [523, 0.2], [392, 0.2], [330, 0.4],
      ];
    default:
      return [[262, 0.5], [330, 0.5], [262, 0.5]];
  }
}
