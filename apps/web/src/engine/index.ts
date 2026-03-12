/**
 * Game engine barrel export.
 */

// Core rendering
export { Renderer } from "./renderer";
export type { RenderLayer, RendererOptions } from "./renderer";

// Sprites
export { SpriteSheet, createPlaceholderSpriteSheet } from "./sprite-sheet";
export type { SpriteFrame, SpriteSheetConfig } from "./sprite-sheet";

// Animation
export { AnimationController, createCharacterAnimations } from "./animation";
export type { AnimationSequence, AnimationState } from "./animation";

// Parallax
export { ParallaxBackground, createGradientLayer } from "./parallax";
export type { ParallaxLayer } from "./parallax";

// Transitions
export { TransitionEffect } from "./transitions";
export type { TransitionOptions, TransitionDirection, TransitionStyle } from "./transitions";

// Performance
export { PerformanceMonitor } from "./performance-monitor";
export type { PerformanceConfig, PerformanceState } from "./performance-monitor";

// Character
export { Character } from "./sprites/character";
export type { CharacterPosition, CharacterConfig } from "./sprites/character";

// Mountain tiles
export {
  TILE_SIZE,
  TILE_DEFINITIONS,
  renderTile,
  generateZoneTilemap,
} from "./sprites/mountain-tiles";
export type { TileType, TileDefinition } from "./sprites/mountain-tiles";

// Narrative
export { STORY_BEATS, VILLAIN_NAME, GUIDE_NAME, getBeatsForZone, getBeat } from "./narrative/story-beats";
export type { StoryBeat, DialogLine } from "./narrative/story-beats";
export { DialogBox } from "./narrative/dialog-box";
export type { DialogBoxConfig } from "./narrative/dialog-box";
export { CutsceneRenderer } from "./narrative/cutscene-renderer";
export type { CutsceneConfig, CutsceneState } from "./narrative/cutscene-renderer";

// Audio
export { AudioManager } from "./audio/audio-manager";
export {
  playButtonClick,
  playChallengeComplete,
  playStarEarned,
  playError,
  playHintReveal,
  playZoneTransition,
  playBossDefeat,
  playDialogAdvance,
  getZoneAmbientNotes,
} from "./audio/sounds";

// React components
export { GameCanvas } from "./GameCanvas";
export type { GameCanvasProps } from "./GameCanvas";
