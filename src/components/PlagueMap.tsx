import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MapNode } from "../types";
import { layoutNodes, type LaidNode } from "../lib/layout";
import { nodeColor, riskLabel } from "../lib/derive";

interface Props {
  nodes: MapNode[];
  selectedId?: string | null;
  /** When set, nodes outside the set are dimmed. */
  highlightIds?: Set<string> | null;
  /** Camera zooms in on this node. */
  focusId?: string | null;
  onNodeClick: (id: string) => void;
  ariaLabel: string;
  /** What `risk` means on this map ("Displacement risk" or "Automatable"). */
  riskName: string;
  groupLabels?: Record<string, string>;
}

interface Spore {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  color: string;
  phase: number;
}

const MAX_SPORES = 1100;

function wrap(label: string, maxChars: number, maxLines: number): string[] {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > maxChars) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/.{0,2}$/, "") + "…";
    return kept;
  }
  return lines;
}

export function PlagueMap({
  nodes,
  selectedId,
  highlightIds,
  focusId,
  onNodeClick,
  ariaLabel,
  riskName,
  groupLabels,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<LaidNode | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => layoutNodes(nodes, size.w, size.h), [nodes, size.w, size.h]);

  const dimmed = (id: string) => (highlightIds ? !highlightIds.has(id) : false);

  // Camera
  const camera = useMemo(() => {
    const f = focusId ? layout.nodes.find((n) => n.id === focusId) : undefined;
    if (!f) return { scale: 1, x: 0, y: 0 };
    const scale = Math.min(2.2, Math.max(1, (Math.min(size.w, size.h) * 0.3) / f.r));
    return { scale, x: size.w / 2 - scale * f.x, y: size.h / 2 - scale * f.y };
  }, [focusId, layout, size]);

  // Plague canvas
  const live = useRef({ nodes: layout.nodes, dim: highlightIds });
  live.current = { nodes: layout.nodes, dim: highlightIds };
  const sporesRef = useRef<Spore[]>([]);

  useEffect(() => {
    sporesRef.current = [];
  }, [nodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w || !size.h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let last = performance.now();
    const t0 = last;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;
      const { nodes: ns, dim } = live.current;
      ctx.clearRect(0, 0, size.w, size.h);

      // Halos: darker/denser with risk; pulse speed follows velocity.
      for (const n of ns) {
        const k = dim && !dim.has(n.id) ? 0.25 : 1;
        const pulse = reduced ? 0 : Math.sin(t * (0.6 + n.velocity / 28) + n.x * 0.01);
        const reach = n.r * (1.25 + (n.risk / 100) * 0.9 + pulse * 0.07);
        const col = nodeColor(n);
        const g = ctx.createRadialGradient(n.x, n.y, n.r * 0.6, n.x, n.y, reach);
        const a = (n.tone === "augment" ? 0.14 : 0.1 + (n.risk / 100) * 0.34) * k;
        g.addColorStop(0, hexA(col, a));
        g.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, reach, 0, Math.PI * 2);
        ctx.fill();
      }

      // Spores: emission rate = velocity, density/darkness = risk.
      const spores = sporesRef.current;
      if (!reduced) {
        for (const n of ns) {
          const k = dim && !dim.has(n.id) ? 0.2 : 1;
          const kindBoost = n.tone === "plague" ? 1 : n.tone === "augment" ? 0.12 : 0.04;
          const rate = (n.velocity / 100) * (0.15 + n.risk / 100) * kindBoost * k * 40;
          let count = rate * dt;
          while (count > 0 && spores.length < MAX_SPORES) {
            if (Math.random() > count) break;
            count -= 1;
            const a = Math.random() * Math.PI * 2;
            const sp = 6 + n.velocity * 0.5 + Math.random() * 10;
            spores.push({
              x: n.x + Math.cos(a) * n.r * 0.9,
              y: n.y + Math.sin(a) * n.r * 0.9,
              vx: Math.cos(a) * sp,
              vy: Math.sin(a) * sp,
              age: 0,
              life: 1.4 + Math.random() * 2.2,
              size: 1 + Math.random() * (1.2 + (n.risk / 100) * 2.6),
              color: nodeColor(n),
              phase: Math.random() * 6.28,
            });
          }
        }
      }
      for (let i = spores.length - 1; i >= 0; i--) {
        const s = spores[i];
        s.age += dt;
        if (s.age >= s.life) {
          spores.splice(i, 1);
          continue;
        }
        s.x += (s.vx + Math.sin(t * 2 + s.phase) * 7) * dt;
        s.y += (s.vy + Math.cos(t * 2 + s.phase) * 7) * dt;
        s.vx *= 0.992;
        s.vy *= 0.992;
        const p = s.age / s.life;
        ctx.globalAlpha = (1 - p) * 0.75;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (1 - p * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size.w, size.h]);

  return (
    <div className="map-wrap" ref={wrapRef} role="group" aria-label={ariaLabel}>
      <motion.div
        className="map-camera"
        animate={camera}
        transition={{ type: "spring", stiffness: 70, damping: 18 }}
        style={{ originX: 0, originY: 0 }}
      >
        <canvas ref={canvasRef} className="plague-canvas" style={{ width: size.w, height: size.h }} />
        <svg className="map-svg" width={size.w} height={size.h}>
          {layout.groups.map((g) => (
            <text key={g.key} x={g.x} y={g.y} className="group-label" textAnchor="middle">
              {groupLabels?.[g.key] ?? g.key}
            </text>
          ))}
          <AnimatePresence>
            {layout.nodes.map((n) => {
              const col = nodeColor(n);
              const sel = selectedId === n.id;
              const dim = dimmed(n.id);
              const fs = Math.max(10, Math.min(14, n.r / 3.6));
              const inside = n.r >= 30;
              const lines = wrap(n.label, Math.max(6, Math.floor((n.r * 1.7) / (fs * 0.56))), inside ? 3 : 2);
              const lh = fs * 1.15;
              const startY = inside ? -((lines.length - 1) * lh) / 2 + (n.sub ? -4 : 0) : n.r + fs + 3;
              return (
                <motion.g
                  key={n.id}
                  initial={{ x: n.x, y: n.y, opacity: 0 }}
                  animate={{ x: n.x, y: n.y, opacity: dim ? 0.28 : 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 90, damping: 16 }}
                  className="node"
                  role="button"
                  tabIndex={0}
                  aria-label={`${n.label}. ${riskName} ${n.risk} of 100, ${riskLabel(n.risk)}.`}
                  aria-pressed={sel}
                  onClick={() => onNodeClick(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onNodeClick(n.id);
                    }
                  }}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover((h) => (h?.id === n.id ? null : h))}
                  onFocus={() => setHover(n)}
                  onBlur={() => setHover((h) => (h?.id === n.id ? null : h))}
                >
                  <motion.circle
                    initial={{ r: 0 }}
                    animate={{ r: n.r }}
                    transition={{ type: "spring", stiffness: 120, damping: 14 }}
                    fill={col}
                    fillOpacity={0.16 + (n.risk / 100) * 0.5}
                    stroke={col}
                    strokeWidth={sel ? 3.5 : 1.5}
                    strokeOpacity={sel ? 1 : 0.85}
                    strokeDasharray={n.tone === "augment" ? "5 4" : undefined}
                  />
                  {sel && <circle r={n.r + 6} fill="none" stroke="#fff" strokeOpacity={0.85} strokeWidth={1.5} />}
                  <text className="node-label" textAnchor="middle" fontSize={fs} y={startY}>
                    {lines.map((l, i) => (
                      <tspan key={i} x={0} dy={i === 0 ? 0 : lh}>
                        {l}
                      </tspan>
                    ))}
                  </text>
                  {inside && n.sub && (
                    <text className="node-sub" textAnchor="middle" fontSize={Math.max(9, fs - 2)} y={startY + lines.length * lh}>
                      {n.sub}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>
      </motion.div>
      {hover && (
        <div
          className="tooltip"
          style={{
            left: Math.min(size.w - 190, Math.max(8, hover.x * camera.scale + camera.x + hover.r * camera.scale + 8)),
            top: Math.max(8, hover.y * camera.scale + camera.y - 30),
          }}
        >
          <strong>{hover.label}</strong>
          <span>
            {riskName}: {hover.risk}/100 · {riskLabel(hover.risk)}
          </span>
          <span>Spread speed: {hover.velocity}/100</span>
        </div>
      )}
    </div>
  );
}

function hexA(color: string, a: number): string {
  // d3 returns rgb(...) strings; hex constants are #rrggbb.
  if (color.startsWith("#")) {
    const n = parseInt(color.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  return color.replace("rgb(", "rgba(").replace(")", `,${a})`);
}
