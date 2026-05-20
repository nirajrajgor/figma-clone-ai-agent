import { sortByZIndex } from "./document";
import type { MarkupObject } from "./types";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function freehandPath(points: [number, number][]) {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
}

function markupObjectToSvg(o: MarkupObject): string {
  switch (o.type) {
    case "rectangle": {
      const fill = o.fillEnabled ? ` fill="${esc(o.fillColor)}"` : ' fill="none"';
      return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" stroke="${esc(o.strokeColor)}" stroke-width="${o.strokeWidth}"${fill}/>`;
    }
    case "ellipse": {
      const cx = o.x + o.width / 2;
      const cy = o.y + o.height / 2;
      const fill = o.fillEnabled ? ` fill="${esc(o.fillColor)}"` : ' fill="none"';
      return `<ellipse cx="${cx}" cy="${cy}" rx="${o.width / 2}" ry="${o.height / 2}" stroke="${esc(o.strokeColor)}" stroke-width="${o.strokeWidth}"${fill}/>`;
    }
    case "redact":
      return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" fill="${esc(o.fillColor)}" stroke="none"/>`;
    case "arrow": {
      const id = `ah-${o.id}`;
      const marker = `<marker id="${id}" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="${esc(o.strokeColor)}"/></marker>`;
      const line = `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="${esc(o.strokeColor)}" stroke-width="${o.strokeWidth}" marker-end="url(#${id})"/>`;
      return marker + line;
    }
    case "line":
      return `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="${esc(o.strokeColor)}" stroke-width="${o.strokeWidth}"/>`;
    case "freehand": {
      if (o.points.length < 2) return "";
      return `<path d="${freehandPath(o.points)}" fill="none" stroke="${esc(o.strokeColor)}" stroke-width="${o.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    case "text": {
      const anchor =
        o.alignment === "center" ? "middle" : o.alignment === "right" ? "end" : "start";
      const weight = o.bold ? "bold" : "normal";
      const style = o.italic ? "italic" : "normal";
      let inner = `<text x="${o.x}" y="${o.y + o.fontSize}" fill="${esc(o.color)}" font-size="${o.fontSize}" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="${weight}" font-style="${style}" text-anchor="${anchor}">${esc(o.content)}</text>`;
      if (o.backgroundEnabled) {
        const w = Math.max(40, o.content.length * o.fontSize * 0.55);
        const h = o.fontSize * 1.4;
        inner =
          `<rect x="${o.x - 4}" y="${o.y}" width="${w + 8}" height="${h}" fill="rgba(0,0,0,0.65)" rx="4"/>` +
          inner;
      }
      return inner;
    }
    default:
      return "";
  }
}

export function markupToSvg(
  objects: MarkupObject[],
  width: number,
  height: number,
  viewBoxX = 0,
  viewBoxY = 0,
): string {
  const body = sortByZIndex(objects).map(markupObjectToSvg).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBoxX} ${viewBoxY} ${width} ${height}">${body}</svg>`;
}

export function renderSvgObject(o: MarkupObject) {
  switch (o.type) {
    case "rectangle":
      return (
        <rect
          key={o.id}
          data-markup-shape
          x={o.x}
          y={o.y}
          width={o.width}
          height={o.height}
          stroke={o.strokeColor}
          strokeWidth={o.strokeWidth}
          fill={o.fillEnabled ? o.fillColor : "none"}
        />
      );
    case "ellipse":
      return (
        <ellipse
          key={o.id}
          data-markup-shape
          cx={o.x + o.width / 2}
          cy={o.y + o.height / 2}
          rx={o.width / 2}
          ry={o.height / 2}
          stroke={o.strokeColor}
          strokeWidth={o.strokeWidth}
          fill={o.fillEnabled ? o.fillColor : "none"}
        />
      );
    case "redact":
      return (
        <rect
          key={o.id}
          data-markup-shape
          x={o.x}
          y={o.y}
          width={o.width}
          height={o.height}
          fill={o.fillColor}
          stroke="none"
          strokeWidth={0}
        />
      );
    case "arrow": {
      const markerId = `m-${o.id}`;
      return (
        <g key={o.id}>
          <defs>
            <marker id={markerId} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill={o.strokeColor} />
            </marker>
          </defs>
          <line
            data-markup-shape
            x1={o.x1}
            y1={o.y1}
            x2={o.x2}
            y2={o.y2}
            stroke={o.strokeColor}
            strokeWidth={o.strokeWidth}
            markerEnd={`url(#${markerId})`}
          />
        </g>
      );
    }
    case "line":
      return (
        <line
          key={o.id}
          data-markup-shape
          x1={o.x1}
          y1={o.y1}
          x2={o.x2}
          y2={o.y2}
          stroke={o.strokeColor}
          strokeWidth={o.strokeWidth}
        />
      );
    case "freehand": {
      const d = freehandPath(o.points);
      return (
        <path
          key={o.id}
          data-markup-shape
          d={d}
          fill="none"
          stroke={o.strokeColor}
          strokeWidth={o.strokeWidth}
          strokeLinecap="round"
        />
      );
    }
    case "text":
      return (
        <g key={o.id} data-markup-shape data-markup-type="text">
          {o.backgroundEnabled && (
            <rect
              x={o.x - 4}
              y={o.y}
              width={Math.max(40, o.content.length * o.fontSize * 0.55) + 8}
              height={o.fontSize * 1.4}
              fill="rgba(0,0,0,0.65)"
              rx={4}
            />
          )}
          <text
            x={o.x}
            y={o.y + o.fontSize}
            fill={o.color}
            fontSize={o.fontSize}
            fontWeight={o.bold ? "bold" : "normal"}
            fontStyle={o.italic ? "italic" : "normal"}
            textAnchor={
              o.alignment === "center" ? "middle" : o.alignment === "right" ? "end" : "start"
            }
          >
            {o.content}
          </text>
        </g>
      );
    default:
      return null;
  }
}
