import { useRef, useEffect, useState } from "react";
import type { TemplateId } from "../../utils/templates";

interface Props {
  onConfirm: (name: string, templateId: TemplateId) => void;
  onCancel: () => void;
}

interface TemplateOption {
  id: TemplateId;
  icon: string;
  label: string;
  description: string;
}

const TEMPLATES: TemplateOption[] = [
  { id: "empty",     icon: "⬜", label: "Empty",      description: "Blank board" },
  { id: "cold-case", icon: "🔴", label: "Cold Case",  description: "Suspect, evidence, timeline, motive" },
  { id: "research",  icon: "🔵", label: "Research",   description: "Question, sources, findings, gaps" },
  { id: "mood-board",icon: "🌸", label: "Mood Board", description: "Theme, colors, inspiration, style" },
];

export default function NewBoardDialog({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState("New Board");
  const [selected, setSelected] = useState<TemplateId>("empty");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const trimmed = name.trim();
      if (trimmed) onConfirm(trimmed, selected);
    }
    if (e.key === "Escape") onCancel();
  };

  const handleCreate = () => {
    const trimmed = name.trim();
    if (trimmed) onConfirm(trimmed, selected);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          background: "rgba(0,0,0,0.5)",
        }}
      />

      {/* Dialog */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 301,
          background: "rgba(25,18,10,0.97)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: 24,
          width: 380,
          fontFamily: "system-ui, sans-serif",
          color: "#fff",
        }}
        onKeyDown={handleKeyDown}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          New Board
        </div>

        {/* Name input */}
        <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
          Board name
        </label>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 7,
            color: "#fff",
            fontSize: 14,
            padding: "8px 10px",
            outline: "none",
            marginBottom: 20,
          }}
        />

        {/* Template picker */}
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
          Start from a template
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 24,
          }}
        >
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              style={{
                background: selected === t.id
                  ? "rgba(255,102,0,0.2)"
                  : "rgba(255,255,255,0.05)",
                border: selected === t.id
                  ? "1.5px solid #ff6600"
                  : "1.5px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "10px 12px",
                cursor: "pointer",
                textAlign: "left",
                color: "#fff",
                transition: "border-color 0.1s, background 0.1s",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.3 }}>
                {t.description}
              </div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 7,
              color: "rgba(255,255,255,0.6)",
              fontSize: 13,
              padding: "7px 16px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            style={{
              background: name.trim() ? "#ff6600" : "rgba(255,102,0,0.3)",
              border: "none",
              borderRadius: 7,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              padding: "7px 20px",
              cursor: name.trim() ? "pointer" : "not-allowed",
              transition: "background 0.1s",
            }}
          >
            Create
          </button>
        </div>
      </div>
    </>
  );
}
