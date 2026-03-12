/**
 * Story data for the CSS Mountain narrative.
 * The villain "Master of Mischief" has scrambled the mountain's CSS,
 * and the player must solve challenges to restore each zone.
 */

export interface StoryBeat {
  /** Unique beat identifier */
  id: string;
  /** Zone number (0 = intro/summit) */
  zone: number;
  /** When this beat triggers */
  trigger: "zone-enter" | "zone-complete" | "boss-defeat" | "summit";
  /** Dialog lines in sequence */
  dialog: DialogLine[];
}

export interface DialogLine {
  /** Speaker name */
  speaker: "narrator" | "player" | "villain" | "guide";
  /** Dialog text */
  text: string;
  /** Optional portrait key */
  portrait?: string;
}

/** The main villain of CSS Mountain */
export const VILLAIN_NAME = "Master of Mischief";

/** The guide character who helps the player */
export const GUIDE_NAME = "Professor Cascade";

/** All story beats for the game */
export const STORY_BEATS: StoryBeat[] = [
  // --- Intro ---
  {
    id: "intro",
    zone: 0,
    trigger: "zone-enter",
    dialog: [
      {
        speaker: "narrator",
        text: "The mountain stands tall against a pixelated sky. Its CSS, once elegant and well-structured, has been scrambled by a mysterious force...",
      },
      {
        speaker: "guide",
        text: `Welcome, developer. I am ${GUIDE_NAME}. The ${VILLAIN_NAME} has corrupted the stylesheets of our mountain. Only you can restore them.`,
        portrait: "guide",
      },
      {
        speaker: "player",
        text: "I'll fix every broken selector and mangled property. Let's start climbing.",
        portrait: "player",
      },
    ],
  },

  // --- Zone 1: Junior (Foothills) ---
  {
    id: "zone-1-enter",
    zone: 1,
    trigger: "zone-enter",
    dialog: [
      {
        speaker: "narrator",
        text: "The Foothills. Green grass and gentle slopes, but the basic styles are all wrong...",
      },
      {
        speaker: "guide",
        text: "Start with the fundamentals. Selectors, colors, the box model. The foundation must be solid before we climb higher.",
        portrait: "guide",
      },
    ],
  },
  {
    id: "zone-1-boss",
    zone: 1,
    trigger: "boss-defeat",
    dialog: [
      {
        speaker: "villain",
        text: "Ha! You fixed a few colors. Big deal. Wait until you see what I did to the layout higher up...",
        portrait: "villain",
      },
      {
        speaker: "guide",
        text: "Well done! The foothills are restored. But the path grows steeper from here.",
        portrait: "guide",
      },
    ],
  },

  // --- Zone 2: Mid-Level (Forest) ---
  {
    id: "zone-2-enter",
    zone: 2,
    trigger: "zone-enter",
    dialog: [
      {
        speaker: "narrator",
        text: "The Forest Zone. Dense trees and winding paths. Flexbox containers collapse, grids shatter...",
      },
      {
        speaker: "guide",
        text: "Layout is the backbone of any design. Master flexbox and grid here, and you'll be ready for what lies above.",
        portrait: "guide",
      },
    ],
  },
  {
    id: "zone-2-boss",
    zone: 2,
    trigger: "boss-defeat",
    dialog: [
      {
        speaker: "villain",
        text: "Responsive design? Please. Try keeping things responsive when the container queries fight back!",
        portrait: "villain",
      },
      {
        speaker: "player",
        text: "Your broken media queries are no match for proper mobile-first thinking.",
        portrait: "player",
      },
    ],
  },

  // --- Zone 3: Senior (Cliffs) ---
  {
    id: "zone-3-enter",
    zone: 3,
    trigger: "zone-enter",
    dialog: [
      {
        speaker: "narrator",
        text: "The Cliff Face. Sheer rock walls and howling wind. Animations glitch, gradients dissolve...",
      },
      {
        speaker: "guide",
        text: "Modern CSS features are powerful but complex. Animations, custom properties, container queries. Focus, and you will prevail.",
        portrait: "guide",
      },
    ],
  },
  {
    id: "zone-3-boss",
    zone: 3,
    trigger: "boss-defeat",
    dialog: [
      {
        speaker: "villain",
        text: "The cascade itself is corrupted now! Your precious layers mean nothing!",
        portrait: "villain",
      },
      {
        speaker: "guide",
        text: "Cascade layers restored. The mountain begins to glow with proper styling once more.",
        portrait: "guide",
      },
    ],
  },

  // --- Zone 4: Staff (Caverns) ---
  {
    id: "zone-4-enter",
    zone: 4,
    trigger: "zone-enter",
    dialog: [
      {
        speaker: "narrator",
        text: "The Caverns. Dark tunnels lit by glowing code. Architecture crumbles, accessibility vanishes...",
      },
      {
        speaker: "guide",
        text: "This is where craft becomes art. Performance, accessibility, component design. These are the skills of a true CSS architect.",
        portrait: "guide",
      },
    ],
  },
  {
    id: "zone-4-boss",
    zone: 4,
    trigger: "boss-defeat",
    dialog: [
      {
        speaker: "villain",
        text: "You think you're clever with your design tokens and your BEM naming? The summit will break you!",
        portrait: "villain",
      },
      {
        speaker: "player",
        text: "Every variable, every layer, every logical property - they all lead to the top.",
        portrait: "player",
      },
    ],
  },

  // --- Zone 5: Principal (Summit) ---
  {
    id: "zone-5-enter",
    zone: 5,
    trigger: "zone-enter",
    dialog: [
      {
        speaker: "narrator",
        text: "The Summit. Snow and starlight. The most advanced CSS features are twisted beyond recognition...",
      },
      {
        speaker: "villain",
        text: "Welcome to my domain. Scroll animations that scroll nowhere. View transitions that transition to chaos. You will never reach the peak!",
        portrait: "villain",
      },
      {
        speaker: "guide",
        text: "This is it. Every technique you've learned leads to this moment. Show the mountain - and the villain - what a true CSS developer can do.",
        portrait: "guide",
      },
    ],
  },

  // --- Victory ---
  {
    id: "summit-victory",
    zone: 5,
    trigger: "summit",
    dialog: [
      {
        speaker: "narrator",
        text: "The final challenge falls. The mountain erupts in perfectly styled glory. Every gradient flows, every animation sings, every layout holds...",
      },
      {
        speaker: "villain",
        text: "Impossible! My specificity wars, my !important overrides, my inline styles - you undid them ALL?!",
        portrait: "villain",
      },
      {
        speaker: "player",
        text: "Clean selectors beat hacky overrides. Every time.",
        portrait: "player",
      },
      {
        speaker: "guide",
        text: `Congratulations, developer. You have conquered CSS Mountain. The ${VILLAIN_NAME} is defeated. But remember - CSS evolves. New challenges will appear. The mountain always grows.`,
        portrait: "guide",
      },
      {
        speaker: "narrator",
        text: "THE END... for now.",
      },
    ],
  },
];

/** Get story beats for a specific zone */
export function getBeatsForZone(zone: number): StoryBeat[] {
  return STORY_BEATS.filter((beat) => beat.zone === zone);
}

/** Get a specific story beat by trigger type and zone */
export function getBeat(
  zone: number,
  trigger: StoryBeat["trigger"],
): StoryBeat | undefined {
  return STORY_BEATS.find(
    (beat) => beat.zone === zone && beat.trigger === trigger,
  );
}
