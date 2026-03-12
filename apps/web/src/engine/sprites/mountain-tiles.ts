/**
 * Mountain terrain tile definitions.
 * Defines tile types and their visual representations for the mountain map.
 */

export type TileType =
  | "empty"
  | "rock"
  | "snow"
  | "grass"
  | "path"
  | "cave"
  | "summit"
  | "water"
  | "lava";

export interface TileDefinition {
  type: TileType;
  /** Primary fill color */
  color: string;
  /** Optional border/detail color */
  detailColor?: string;
  /** Whether the tile is walkable */
  walkable: boolean;
  /** Whether the tile is climbable */
  climbable: boolean;
  /** Zone this tile appears in (0 = any) */
  zone: number;
}

/** Standard tile size in pixels */
export const TILE_SIZE = 16;

/** Tile definitions for each terrain type */
export const TILE_DEFINITIONS: Record<TileType, TileDefinition> = {
  empty: {
    type: "empty",
    color: "transparent",
    walkable: false,
    climbable: false,
    zone: 0,
  },
  rock: {
    type: "rock",
    color: "#4a4a5e",
    detailColor: "#3a3a4e",
    walkable: false,
    climbable: true,
    zone: 0,
  },
  snow: {
    type: "snow",
    color: "#e8e8f0",
    detailColor: "#d0d0e0",
    walkable: true,
    climbable: false,
    zone: 5,
  },
  grass: {
    type: "grass",
    color: "#2d5a27",
    detailColor: "#1a4a17",
    walkable: true,
    climbable: false,
    zone: 1,
  },
  path: {
    type: "path",
    color: "#8b7355",
    detailColor: "#6b5335",
    walkable: true,
    climbable: false,
    zone: 0,
  },
  cave: {
    type: "cave",
    color: "#1a1a2e",
    detailColor: "#2a2a3e",
    walkable: true,
    climbable: false,
    zone: 3,
  },
  summit: {
    type: "summit",
    color: "#ffd700",
    detailColor: "#ffaa00",
    walkable: true,
    climbable: false,
    zone: 5,
  },
  water: {
    type: "water",
    color: "#1a4a8a",
    detailColor: "#0a3a7a",
    walkable: false,
    climbable: false,
    zone: 2,
  },
  lava: {
    type: "lava",
    color: "#cc3300",
    detailColor: "#ff6600",
    walkable: false,
    climbable: false,
    zone: 4,
  },
};

/**
 * Render a single tile to a canvas context.
 */
export function renderTile(
  ctx: CanvasRenderingContext2D,
  tile: TileDefinition,
  x: number,
  y: number,
  size: number = TILE_SIZE,
): void {
  if (tile.type === "empty") return;

  // Fill main color
  ctx.fillStyle = tile.color;
  ctx.fillRect(x, y, size, size);

  // Add detail pattern
  if (tile.detailColor) {
    ctx.fillStyle = tile.detailColor;

    // Simple dithered pattern for retro look
    for (let px = 0; px < size; px += 4) {
      for (let py = 0; py < size; py += 4) {
        if ((px + py) % 8 === 0) {
          ctx.fillRect(x + px, y + py, 2, 2);
        }
      }
    }
  }

  // Subtle border for definition
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

/**
 * Generate a tile map canvas for a given zone.
 */
export function generateZoneTilemap(
  zone: number,
  cols: number,
  rows: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = cols * TILE_SIZE;
  canvas.height = rows * TILE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Get zone-appropriate tiles
  const zoneTiles = Object.values(TILE_DEFINITIONS).filter(
    (t) => t.zone === 0 || t.zone === zone,
  );

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Simple procedural placement
      const isGround = row > rows * 0.6;
      const isMountain = row > rows * 0.3 && row <= rows * 0.6;

      let tile: TileDefinition;
      if (isGround) {
        tile =
          zoneTiles.find((t) => t.type === "path") ??
          TILE_DEFINITIONS.path;
      } else if (isMountain) {
        tile =
          zoneTiles.find((t) => t.type === "rock") ??
          TILE_DEFINITIONS.rock;
      } else {
        tile = TILE_DEFINITIONS.empty;
      }

      renderTile(ctx, tile, col * TILE_SIZE, row * TILE_SIZE);
    }
  }

  return canvas;
}
