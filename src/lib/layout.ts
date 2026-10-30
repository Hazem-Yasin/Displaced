import * as d3 from "d3";
import type { MapNode } from "../types";

export interface LaidNode extends MapNode {
  x: number;
  y: number;
  r: number;
}
export interface GroupLabel {
  key: string;
  x: number;
  y: number;
}
export interface Layout {
  nodes: LaidNode[];
  groups: GroupLabel[];
}

const SMALL = 30;
const GROUP_ORDER = ["technical", "human"];

function overlaps(nodes: LaidNode[]): boolean {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const gap = Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r;
      if (gap < 2) return true;
    }
  }
  return false;
}

/** Deterministic bubble layout: area ∝ workforce, grouped by `group` when present. */
export function layoutNodes(nodes: MapNode[], w: number, h: number): Layout {
  if (!nodes.length || w < 40 || h < 40) return { nodes: [], groups: [] };

  const n = nodes.length;
  const maxSize = Math.max(...nodes.map((d) => d.size));
  const rAvg = Math.sqrt((w * h * 0.4) / n / Math.PI);
  const rMax = Math.min(rAvg * 1.8, Math.min(w, h) * 0.2);
  const rMin = Math.min(Math.max(15, rAvg * 0.5), rMax * 0.75);
  let radii = nodes.map((d) => rMin + (rMax - rMin) * Math.pow(d.size / maxSize, 0.4));

  const footprint = d3.sum(radii, (r) => Math.PI * (r + 8) ** 2);
  const cap = w * h * 0.5;
  if (footprint > cap) {
    const k = Math.sqrt(cap / footprint);
    radii = radii.map((r) => Math.max(11, r * k));
  }

  const grouped = nodes.some((d) => d.group);
  const keys = GROUP_ORDER.filter((k) => nodes.some((d) => d.group === k));
  const horizontal = w >= h * 1.15;
  const splitTop = !horizontal && keys.length > 1;
  const centers: Record<string, { x: number; y: number }> = {};
  keys.forEach((k, i) => {
    // Wide panels place the two groups side by side; narrow ones stack them.
    const f = i === 0 ? 0.3 : 0.74;
    centers[k] = horizontal ? { x: w * f, y: h * 0.54 } : { x: w * 0.5, y: h * (i === 0 ? 0.3 : 0.76) };
  });
  const centerOf = (d: MapNode) => (d.group && centers[d.group]) || { x: w / 2, y: h / 2 };
  const top = grouped ? 26 : 8;

  const run = (rs: number[]): LaidNode[] => {
    const laid: LaidNode[] = nodes.map((d, i) => {
      const c = centerOf(d);
      const a = i * 2.39996;
      const rr = 14 * Math.sqrt(i + 1);
      return { ...d, r: rs[i], x: c.x + Math.cos(a) * rr, y: c.y + Math.sin(a) * rr };
    });
    const clamp = () => {
      for (const d of laid) {
        // In stacked layouts each group keeps to its own half so labels never sit on bubbles.
        const lo = splitTop && d.group === keys[1] ? h * 0.5 + 22 : top;
        const hi = splitTop && d.group === keys[0] ? h * 0.5 - 8 : h - 8;
        d.x = Math.max(d.r + 8, Math.min(w - d.r - 8, d.x));
        d.y = Math.max(lo + d.r, Math.min(hi - d.r - (d.r < SMALL ? 26 : 0), d.y));
      }
    };
    const sim = d3
      .forceSimulation<LaidNode>(laid)
      .force("x", d3.forceX<LaidNode>((d) => centerOf(d).x).strength(0.05))
      .force("y", d3.forceY<LaidNode>((d) => centerOf(d).y).strength(0.05))
      .force("collide", d3.forceCollide<LaidNode>((d) => d.r + (d.r < SMALL ? 14 : 6)).strength(1).iterations(4))
      .stop();
    for (let i = 0; i < 400; i++) {
      sim.tick();
      clamp();
    }
    return laid;
  };

  // Shrink and retry until nothing overlaps (bounded, so it always terminates).
  let laid = run(radii);
  for (let attempt = 0; attempt < 8 && overlaps(laid); attempt++) {
    radii = radii.map((r) => Math.max(10, r * 0.92));
    laid = run(radii);
  }

  const groups: GroupLabel[] = keys.map((k) => {
    const members = laid.filter((d) => d.group === k);
    return {
      key: k,
      x: d3.mean(members, (d) => d.x) ?? w / 2,
      y: Math.max(16, (d3.min(members, (d) => d.y - d.r) ?? 30) - 12),
    };
  });
  return { nodes: laid, groups };
}
