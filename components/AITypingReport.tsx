"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  report: string;
  speed?: number; // ms per char
}

export default function AITypingReport({ report, speed = 18 }: Props) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    idxRef.current = 0;
    setDisplayed("");
    setDone(false);

    function type() {
      if (idxRef.current < report.length) {
        setDisplayed(report.slice(0, idxRef.current + 1));
        idxRef.current++;
        timerRef.current = setTimeout(type, speed);
      } else {
        setDone(true);
      }
    }

    timerRef.current = setTimeout(type, 400);
    return () => clearTimeout(timerRef.current);
  }, [report, speed]);

  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden"
      style={{
        background: "rgba(15,23,42,0.03)",
        border: "1px solid rgba(37,99,235,0.1)",
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.9rem",
        lineHeight: 1.7,
        color: "#334155",
        minHeight: "120px",
      }}
    >
      {/* AI badge */}
      <div
        className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{
          background: "rgba(37,99,235,0.08)",
          color: "#2563EB",
          border: "1px solid rgba(37,99,235,0.15)",
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" style={{ boxShadow: "0 0 4px #3B82F6" }} />
        WaveBlock AI
      </div>

      <p style={{ whiteSpace: "pre-wrap" }}>
        {displayed}
        {!done && (
          <span
            className="inline-block w-0.5 h-4 ml-0.5 rounded-sm bg-blue-500"
            style={{
              animation: "blink 1s step-end infinite",
              verticalAlign: "text-bottom",
            }}
          />
        )}
      </p>

      {/* Subtle background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.02) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}
