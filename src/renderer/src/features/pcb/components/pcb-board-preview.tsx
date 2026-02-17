import { useMemo } from "react";
import { cn } from "@/utils";
import type { PCBDesign, PCBColor } from "@shared/pcb-types";

const MASK_COLORS: Record<PCBColor, string> = {
  green: "#2d8c3c",
  red: "#c0392b",
  yellow: "#f1c40f",
  blue: "#2980b9",
  white: "#e8e8e8",
  black: "#2c3e50",
  purple: "#8e44ad",
};

const MASK_SHADOW: Record<PCBColor, string> = {
  green: "#1f6b2d",
  red: "#962d22",
  yellow: "#c9a30c",
  blue: "#1e6591",
  white: "#c8c8c8",
  black: "#1a2836",
  purple: "#6c3483",
};

const SILK: Record<PCBColor, string> = {
  green: "#e0e0e0",
  red: "#e0e0e0",
  yellow: "#2a2a2a",
  blue: "#e0e0e0",
  white: "#2a2a2a",
  black: "#e0e0e0",
  purple: "#e0e0e0",
};

const PACKAGE_DIMS: Record<string, [number, number]> = {
  "0201": [0.6, 0.3],
  "0402": [1.0, 0.5],
  "0603": [1.6, 0.8],
  "0805": [2.0, 1.25],
  "1206": [3.2, 1.6],
  "2512": [6.4, 3.2],
  "SOT-23": [2.9, 1.3],
  "SOT-223": [6.5, 3.5],
  "SOP-8": [5.0, 4.0],
  "SOIC-8": [5.0, 4.0],
  "SOIC-14": [8.75, 4.0],
  "SOIC-16": [10.0, 4.0],
  "TQFP-32": [9.0, 9.0],
  "TQFP-44": [12.0, 12.0],
  "QFN-24": [4.0, 4.0],
  "QFN-32": [5.0, 5.0],
  "DIP-8": [10.16, 7.62],
  "DIP-14": [19.05, 7.62],
  "DIP-16": [20.32, 7.62],
  "DIP-28": [35.56, 7.62],
  "DIP-40": [50.8, 15.24],
  "TO-92": [4.5, 3.8],
  "TO-220": [10.0, 15.0],
};

const DEFAULT_DIM: [number, number] = [3.0, 2.0];
const COPPER = "#c9982a";
const COPPER_BRIGHT = "#e0b84a";

interface PCBBoardPreviewProps {
  design: PCBDesign;
  className?: string;
}

export function PCBBoardPreview({ design, className }: PCBBoardPreviewProps) {
  const { specs, components, traces, drillHoles, mountingHoles, boardOutline } =
    design;

  const mask = MASK_COLORS[specs.color] ?? MASK_COLORS.green;
  const shadow = MASK_SHADOW[specs.color] ?? MASK_SHADOW.green;
  const silk = SILK[specs.color] ?? "#e0e0e0";

  const pad = Math.max(specs.width, specs.height) * 0.12;
  const vb = `${-pad} ${-pad} ${specs.width + pad * 2} ${specs.height + pad * 2}`;
  const fontSize = Math.max(1.2, Math.min(specs.width, specs.height) * 0.03);

  const outlinePoints = useMemo(() => {
    if (boardOutline.length >= 3) {
      return boardOutline.map((p) => `${p.x},${p.y}`).join(" ");
    }
    return `0,0 ${specs.width},0 ${specs.width},${specs.height} 0,${specs.height}`;
  }, [boardOutline, specs.width, specs.height]);

  const topTraces = useMemo(
    () => traces.filter((t) => t.layer === "top" && t.points.length > 1),
    [traces],
  );
  const otherTraces = useMemo(
    () => traces.filter((t) => t.layer !== "top" && t.points.length > 1),
    [traces],
  );

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg
        viewBox={vb}
        className="w-full h-full max-h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern
            id="pcb-dots"
            width={2.54}
            height={2.54}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={1.27} cy={1.27} r={0.08} fill={shadow} opacity={0.3} />
          </pattern>
        </defs>

        {/* Board shadow */}
        <polygon
          points={outlinePoints}
          fill="#00000018"
          transform="translate(0.6, 0.6)"
        />

        {/* Board fill */}
        <polygon points={outlinePoints} fill={mask} />

        {/* Grid texture */}
        <polygon points={outlinePoints} fill="url(#pcb-dots)" />

        {/* Bottom-layer traces (dimmer) */}
        {otherTraces.map((trace, i) => (
          <polyline
            key={`bt${i}`}
            points={trace.points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={COPPER}
            strokeWidth={trace.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.4}
          />
        ))}

        {/* Top-layer traces */}
        {topTraces.map((trace, i) => (
          <polyline
            key={`tt${i}`}
            points={trace.points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={COPPER_BRIGHT}
            strokeWidth={trace.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
          />
        ))}

        {/* Components */}
        {components.map((comp) => {
          const [w, h] = PACKAGE_DIMS[comp.package] ?? DEFAULT_DIM;
          const hw = w / 2;
          const hh = h / 2;
          return (
            <g
              key={comp.designator}
              transform={`translate(${comp.x} ${comp.y}) rotate(${comp.rotation})`}
            >
              {/* Copper pad */}
              <rect
                x={-hw}
                y={-hh}
                width={w}
                height={h}
                rx={0.2}
                fill={COPPER}
                opacity={0.8}
              />
              {/* Component body */}
              <rect
                x={-hw + 0.25}
                y={-hh + 0.25}
                width={Math.max(0, w - 0.5)}
                height={Math.max(0, h - 0.5)}
                rx={0.15}
                fill="#2d2d2d"
                opacity={0.9}
              />
              {/* Pin-1 marker */}
              <circle
                cx={-hw + 0.6}
                cy={-hh + 0.6}
                r={0.25}
                fill={silk}
                opacity={0.5}
              />
              {/* Designator */}
              <text
                y={hh + fontSize * 1.3}
                textAnchor="middle"
                fill={silk}
                fontSize={fontSize}
                fontFamily="monospace"
                fontWeight="bold"
              >
                {comp.designator}
              </text>
            </g>
          );
        })}

        {/* Mounting holes */}
        {mountingHoles.map((hole, i) => (
          <g key={`mh${i}`}>
            <circle
              cx={hole.x}
              cy={hole.y}
              r={hole.diameter / 2 + 0.6}
              fill={COPPER}
              opacity={0.6}
            />
            <circle
              cx={hole.x}
              cy={hole.y}
              r={hole.diameter / 2}
              fill="#1a1a1a"
            />
          </g>
        ))}

        {/* Drill holes */}
        {drillHoles.map((hole, i) => (
          <circle
            key={`dh${i}`}
            cx={hole.x}
            cy={hole.y}
            r={hole.diameter / 2}
            fill="#1a1a1a"
            opacity={0.9}
          />
        ))}

        {/* Board outline */}
        <polygon
          points={outlinePoints}
          fill="none"
          stroke={shadow}
          strokeWidth={0.3}
        />

        {/* Dimension label */}
        <text
          x={specs.width / 2}
          y={specs.height + pad * 0.55}
          textAnchor="middle"
          fill="currentColor"
          fontSize={fontSize * 0.9}
          fontFamily="system-ui, sans-serif"
          opacity={0.35}
        >
          {specs.width} × {specs.height} mm
        </text>
      </svg>
    </div>
  );
}
