import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const columns = [
  { title: "To Do", color: "#3b82f6", cards: 3 },
  { title: "In Progress", color: "#f59e0b", cards: 2 },
  { title: "Review", color: "#a855f7", cards: 1 },
  { title: "Done", color: "#10b981", cards: 2 },
];

// Note: every <div> with more than one child needs display: 'flex' (an OG image renderer rule)
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(135deg, #0a0a0a 0%, #1e1b4b 100%)",
        color: "#fafafa",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "#fafafa",
            color: "#0a0a0a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          T
        </div>
        <div style={{ fontSize: 36, fontWeight: 700 }}>{siteConfig.name}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>
          Plan, track, and ship work together.
        </div>
        <div style={{ fontSize: 28, color: "#a1a1aa" }}>
          Real-time Kanban boards · Drag-and-drop · Roles
        </div>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        {columns.map((col) => (
          <div
            key={col.title}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              width: 250,
              padding: 16,
              borderRadius: 16,
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 20,
                color: "#d4d4d8",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  background: col.color,
                }}
              />
              {col.title}
            </div>
            {Array.from({ length: col.cards }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 16,
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.14)",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
