import { useBoardStore } from "../../store/boardStore";
import type { StringTexture } from "../../types/connections";

const TEXTURES: StringTexture[] = ["thread", "yarn", "rope", "wire"];

const PRESET_COLORS = [
  "#cc2200", "#e05c00", "#d4a017", "#2a9d2a",
  "#1a6db5", "#7b2fbf", "#c2185b", "#333333",
];

export default function ConnectionStylePanel() {
  const selectedId = useBoardStore((s) => s.selectedConnectionId);
  const connections = useBoardStore((s) => s.connections);
  const updateConnection = useBoardStore((s) => s.updateConnection);
  const removeConnection = useBoardStore((s) => s.removeConnection);
  const setSelectedConnection = useBoardStore((s) => s.setSelectedConnection);

  if (!selectedId) return null;

  const conn = connections.find((c) => c.id === selectedId);
  if (!conn) return null;

  const { style } = conn;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(30, 20, 10, 0.92)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        zIndex: 100,
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        backdropFilter: "blur(8px)",
        color: "#f0e8d8",
        fontSize: 12,
        userSelect: "none",
      }}
    >
      {/* Texture selector */}
      <div style={{ display: "flex", gap: 4 }}>
        {TEXTURES.map((t) => (
          <button
            key={t}
            title={t}
            onClick={() => updateConnection(selectedId, { style: { ...style, texture: t } })}
            style={{
              padding: "3px 8px",
              borderRadius: 5,
              border: style.texture === t
                ? "1px solid rgba(255,255,255,0.5)"
                : "1px solid rgba(255,255,255,0.15)",
              background: style.texture === t
                ? "rgba(255,255,255,0.15)"
                : "transparent",
              color: "#f0e8d8",
              cursor: "pointer",
              fontSize: 11,
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.15)" }} />

      {/* Color swatches */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => updateConnection(selectedId, { style: { ...style, color: c } })}
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: c,
              border: style.color === c
                ? "2px solid white"
                : "2px solid transparent",
              cursor: "pointer",
              padding: 0,
              outline: "none",
            }}
          />
        ))}
        {/* Custom color input */}
        <input
          type="color"
          value={style.color}
          onChange={(e) =>
            updateConnection(selectedId, { style: { ...style, color: e.target.value } })
          }
          title="Custom color"
          style={{
            width: 20,
            height: 20,
            padding: 0,
            border: "none",
            borderRadius: 3,
            cursor: "pointer",
            background: "none",
          }}
        />
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.15)" }} />

      {/* Thickness */}
      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ opacity: 0.7 }}>Weight</span>
        <input
          type="range"
          min={1}
          max={8}
          step={1}
          value={style.thickness}
          onChange={(e) =>
            updateConnection(selectedId, {
              style: { ...style, thickness: Number(e.target.value) },
            })
          }
          style={{ width: 64, accentColor: "#3b82f6" }}
        />
        <span style={{ opacity: 0.7, width: 12, textAlign: "right" }}>{style.thickness}</span>
      </label>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.15)" }} />

      {/* Slack */}
      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ opacity: 0.7 }}>Slack</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={style.slack}
          onChange={(e) =>
            updateConnection(selectedId, {
              style: { ...style, slack: Number(e.target.value) },
            })
          }
          style={{ width: 64, accentColor: "#3b82f6" }}
        />
      </label>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.15)" }} />

      {/* Delete */}
      <button
        title="Delete connection (Delete)"
        onClick={() => {
          removeConnection(selectedId);
          setSelectedConnection(null);
        }}
        style={{
          padding: "3px 8px",
          borderRadius: 5,
          border: "1px solid rgba(239,68,68,0.4)",
          background: "rgba(239,68,68,0.15)",
          color: "#fca5a5",
          cursor: "pointer",
          fontSize: 11,
        }}
      >
        Delete
      </button>

      {/* Close */}
      <button
        title="Deselect (Escape)"
        onClick={() => setSelectedConnection(null)}
        style={{
          padding: "3px 6px",
          borderRadius: 5,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "transparent",
          color: "#f0e8d8",
          cursor: "pointer",
          fontSize: 11,
          opacity: 0.6,
        }}
      >
        ✕
      </button>
    </div>
  );
}
