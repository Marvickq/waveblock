"use client";
import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
}

interface Edge {
  a: number;
  b: number;
  life: number;
  maxLife: number;
}

export default function BlockchainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const NODES = 38;
    const MAX_DIST = 160;
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Init nodes
    for (let i = 0; i < NODES; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 2.5 + 1.5,
        opacity: Math.random() * 0.4 + 0.2,
      });
    }

    // Periodically add glowing edges
    function maybeAddEdge() {
      if (edges.length > 20) return;
      const a = Math.floor(Math.random() * nodes.length);
      const b = Math.floor(Math.random() * nodes.length);
      if (a !== b) {
        const dx = nodes[a].x - nodes[b].x;
        const dy = nodes[a].y - nodes[b].y;
        if (Math.sqrt(dx * dx + dy * dy) < MAX_DIST * 1.5) {
          edges.push({ a, b, life: 0, maxLife: 120 });
        }
      }
    }

    let frame = 0;
    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      frame++;
      if (frame % 40 === 0) maybeAddEdge();

      // Update & draw edges
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        e.life++;
        if (e.life > e.maxLife) { edges.splice(i, 1); continue; }
        const t = e.life / e.maxLife;
        const alpha = t < 0.3 ? (t / 0.3) : t > 0.7 ? ((1 - t) / 0.3) : 1;
        const na = nodes[e.a], nb = nodes[e.b];
        ctx!.beginPath();
        ctx!.moveTo(na.x, na.y);
        ctx!.lineTo(nb.x, nb.y);
        ctx!.strokeStyle = `rgba(79,124,255,${alpha * 0.22})`;
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      // Update & draw nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        // Draw connection lines between nearby nodes
        for (const m of nodes) {
          if (m === n) continue;
          const dx = n.x - m.x, dy = n.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            ctx!.beginPath();
            ctx!.moveTo(n.x, n.y);
            ctx!.lineTo(m.x, m.y);
            ctx!.strokeStyle = `rgba(79,124,255,${(1 - dist / MAX_DIST) * 0.15})`;
            ctx!.lineWidth = 0.65;
            ctx!.stroke();
          }
        }

        // Node circle with vibrant glow
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(79,124,255,${n.opacity * 0.85})`;
        ctx!.fill();

        // Soft radial aura
        const grd = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
        grd.addColorStop(0, `rgba(79,124,255,${n.opacity * 0.28})`);
        grd.addColorStop(1, "rgba(79,124,255,0)");
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
        ctx!.fillStyle = grd;
        ctx!.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: "var(--wb-z-video)" as any,
        opacity: 0.7,
        willChange: "transform",
        transform: "translateZ(0)",
      }}
    />
  );
}
