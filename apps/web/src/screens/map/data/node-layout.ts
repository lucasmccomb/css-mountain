import { ZONES, type ZoneDefinition } from "./zones";

/**
 * Position of a node on the mountain map.
 * Coordinates are relative to the zone container.
 * x: 0-100 (percentage), y: 0-100 (percentage within zone)
 */
export interface NodePosition {
  /** Challenge ID */
  id: string;
  /** Horizontal position (0=left, 100=right) */
  x: number;
  /** Vertical position within zone (0=bottom, 100=top) */
  y: number;
  /** Which track this node belongs to: "a", "b", or "boss" */
  track: "a" | "b" | "boss";
  /** Index within the track (0-4 for track nodes, 0 for boss) */
  trackIndex: number;
}

/**
 * Layout data for all nodes in a zone.
 */
export interface ZoneLayout {
  zoneId: number;
  nodes: NodePosition[];
}

/**
 * Generate node positions for a zone.
 *
 * Track A runs on the left side (x ~30%), Track B on the right (x ~70%).
 * Nodes are spaced vertically from bottom to top within each zone.
 * The boss node is centered at the top.
 */
function generateZoneLayout(zone: ZoneDefinition): ZoneLayout {
  const nodes: NodePosition[] = [];

  // Track A (left side) - 5 nodes, staggered slightly
  for (let i = 0; i < 5; i++) {
    const stagger = i % 2 === 0 ? 0 : 5;
    nodes.push({
      id: zone.tracks[0][i],
      x: 28 + stagger,
      y: 10 + i * 16,
      track: "a",
      trackIndex: i,
    });
  }

  // Track B (right side) - 5 nodes, staggered slightly
  for (let i = 0; i < 5; i++) {
    const stagger = i % 2 === 0 ? 0 : -5;
    nodes.push({
      id: zone.tracks[1][i],
      x: 68 + stagger,
      y: 10 + i * 16,
      track: "b",
      trackIndex: i,
    });
  }

  // Boss node (centered at top)
  nodes.push({
    id: zone.bossId,
    x: 50,
    y: 92,
    track: "boss",
    trackIndex: 0,
  });

  return { zoneId: zone.id, nodes };
}

/**
 * Pre-computed layouts for all zones.
 */
export const ZONE_LAYOUTS: ZoneLayout[] = ZONES.map(generateZoneLayout);

/**
 * Get the layout for a specific zone.
 */
export function getZoneLayout(zoneId: number): ZoneLayout | undefined {
  return ZONE_LAYOUTS.find((l) => l.zoneId === zoneId);
}
