"use client";
import { useEffect, useRef } from "react";

interface Props {
  score: number; // 0–100
  size?: number;
  animated?: boolean;
}

const scoreColor = (s: number): string => {
  if (s >= 80) return "var(--wb-trust-excellent)";
  if (s >= 60) return "var(--wb-trust-good)";
  if (s >= 40) return "var(--wb-trust-risk)";
  return "var(--wb-trust-critical)";
};

const scoreColorHex = (s: number): string => {
  if (s >= 80) return "#16A34A";
  if (s >= 60) return "#2563EB";
  if (s >= 40) return "#F97316";
  return "#DC2626";
};

const scoreLabel = (s: number): string => {
  if (s >= 80) return "Safe";
  if (s >= 60) return "Caution";
  if (s >= 40) return "Risky";
  return "Critical";
};

export default function TrustScoreGauge({ score, size = 200, animated = true }: Props) {
  const circleRef = useRef<SVGCircleElement>(null);
  const textRef = useRef<SVGTextElement>(null);

  const radius = (size / 2) * 0.76;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const colorVar = scoreColor(score);
  const colorHex = scoreColorHex(score);
  const label = scoreLabel(score);

  useEffect(() => {
    if (!animated || !circleRef.current || !textRef.current) return;

    let current = 0;
    const target = score;
    const duration = 1500;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      current = eased * target;

      const offset = circumference - (current / 100) * circumference;
      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = offset.toString();
      }
      if (textRef.current) {
        textRef.current.textContent = Math.round(current).toString();
      }

      if (progress < 1) requestAnimationFrame(tick);
    };

    // Initial state
    if (circleRef.current) {
      circleRef.current.style.strokeDasharray = circumference.toString();
      circleRef.current.style.strokeDashoffset = circumference.toString();
    }

    requestAnimationFrame(tick);
  }, [score, circumference, animated]);

  const staticOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="score-appear" style={{ display: "inline-block" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="var(--wb-color-border)"
            strokeWidth={size * 0.065}
          />
          {/* Score arc */}
          <circle
            ref={circleRef}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={colorHex}
            strokeWidth={size * 0.065}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? circumference : staticOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{
              filter: `drop-shadow(0 0 8px ${colorHex}55)`,
              transition: animated ? "none" : "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
          {/* Score number */}
          <text
            ref={textRef}
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontFamily: "var(--wb-font-ui)",
              fontSize: size * 0.2,
              fontWeight: 700,
              fill: colorHex,
            }}
          >
            {animated ? "0" : score}
          </text>
          {/* /100 */}
          <text
            x={cx}
            y={cy + size * 0.14}
            textAnchor="middle"
            style={{
              fontFamily: "var(--wb-font-ui)",
              fontSize: size * 0.078,
              fill: "var(--wb-color-text-muted)",
              fontWeight: 500,
            }}
          >
            / 100
          </text>
        </svg>
      </div>
      {/* Label */}
      <span
        className="px-4 py-1.5 rounded-full text-sm font-semibold"
        style={{
          background: `${colorHex}18`,
          color: colorHex,
          border: `1px solid ${colorHex}30`,
          fontFamily: "var(--wb-font-ui)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
