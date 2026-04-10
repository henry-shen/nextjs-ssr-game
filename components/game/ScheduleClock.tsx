"use client";

import { useCallback } from "react";
import styles from "./schedule-clock.module.css";

type Props = {
  hour12: number;
  minute: 0 | 30;
  onChange: (hour12: number, minute: 0 | 30) => void;
};

const CX = 100;
const CY = 100;
const R_LABEL = 72;

/** Map click angle to 12h clock slot: even half-hours are :00, odd are :30. */
function pickFromAngle(clientX: number, clientY: number, rect: DOMRect) {
  const x = clientX - rect.left - rect.width / 2;
  const y = clientY - rect.top - rect.height / 2;
  const TWO_PI = Math.PI * 2;
  const theta = Math.atan2(y, x);
  const normalized = (theta + Math.PI / 2 + TWO_PI) % TWO_PI;
  const slot24 = Math.floor((normalized / TWO_PI) * 24) % 24;
  const h = Math.floor(slot24 / 2);
  const hour12 = h === 0 ? 12 : h;
  const minute = slot24 % 2 === 0 ? 0 : 30;
  return { hour12, minute: minute as 0 | 30 };
}

export function ScheduleClock({ hour12, minute, onChange }: Props) {
  const onPointer = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const { hour12: h, minute: m } = pickFromAngle(e.clientX, e.clientY, rect);
      onChange(h, m);
    },
    [onChange]
  );

  const labels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const labelPos = (n: number) => {
    const angle = ((n % 12) / 12) * Math.PI * 2 - Math.PI / 2;
    return {
      x: CX + R_LABEL * Math.cos(angle),
      y: CY + R_LABEL * Math.sin(angle) + 4,
    };
  };

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>Click an hour for :00, or the gap before the next hour for :30.</p>
      <svg
        className={styles.svg}
        viewBox="0 0 200 200"
        role="img"
        aria-label="Departure time clock"
        onClick={onPointer}
      >
        <circle className={styles.face} cx={CX} cy={CY} r={88} />
        <circle className={styles.rim} cx={CX} cy={CY} r={88} fill="none" />
        {labels.map((n) => {
          const { x, y } = labelPos(n);
          const sel = hour12 === n && minute === 0;
          return (
            <text
              key={n}
              x={x}
              y={y}
              textAnchor="middle"
              className={sel ? styles.numSel : styles.num}
            >
              {n}
            </text>
          );
        })}
        {/* Mid wedges between hour labels for :30 — draw 12 thin arcs as hit guides (visual tick marks) */}
        {labels.map((n) => {
          const a0 = ((n - 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
          const a1 = (n / 12) * Math.PI * 2 - Math.PI / 2;
          const outer = 86;
          const x1i = CX + outer * Math.cos(a0);
          const y1i = CY + outer * Math.sin(a0);
          const x1o = CX + outer * Math.cos(a1);
          const y1o = CY + outer * Math.sin(a1);
          const hourForHalf = n === 12 ? 12 : n;
          const sel30 = hour12 === hourForHalf && minute === 30;
          return (
            <line
              key={`tick-${n}`}
              x1={x1i}
              y1={y1i}
              x2={x1o}
              y2={y1o}
              className={sel30 ? styles.tickSel : styles.tick}
              strokeWidth={sel30 ? 3 : 1}
            />
          );
        })}
        <circle className={styles.pivot} cx={CX} cy={CY} r={5} />
      </svg>
      <p className={styles.selection}>
        Selected:{" "}
        <strong>
          {hour12}:{minute === 0 ? "00" : "30"}
        </strong>
      </p>
    </div>
  );
}
