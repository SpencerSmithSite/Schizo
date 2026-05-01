interface Props {
  onClose: () => void;
}

const SHORTCUTS = [
  { group: "Tools" },
  { key: "N", description: "Add note" },
  { key: "L", description: "Add link" },
  { key: "V", description: "Add video (YouTube / Vimeo)" },
  { key: "B", description: "Create sub-board portal" },
  { key: "C", description: "Toggle connect mode" },
  { key: "F", description: "Fit all items in view" },

  { group: "Selection" },
  { key: "⌘A / Ctrl+A", description: "Select all items" },
  { key: "⌘C / Ctrl+C", description: "Copy selected items" },
  { key: "⌘V / Ctrl+V", description: "Paste items" },
  { key: "Del / Backspace", description: "Delete selected items or connection" },
  { key: "Escape", description: "Return to select mode" },

  { group: "History & Search" },
  { key: "⌘Z / Ctrl+Z", description: "Undo" },
  { key: "⌘⇧Z / Ctrl+Y", description: "Redo" },
  { key: "⌘K / Ctrl+K", description: "Search all boards" },

  { group: "Tips" },
  { key: "Double-click note", description: "Edit note text" },
  { key: "Double-click board", description: "Open sub-board" },
  { key: "Double-click name", description: "Rename board" },
  { key: "Right-click item", description: "Context menu (lock, duplicate…)" },
  { key: "Click rope", description: "Open string style picker" },
  { key: "Drag pin → pin", description: "Connect two items with string" },
];

export default function HelpDialog({ onClose }: Props) {
  return (
    <div
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "#1e1408",
          border: "1px solid rgba(255,180,80,0.18)",
          borderRadius: 14,
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          padding: "24px 28px",
          width: 380,
          maxHeight: "80vh",
          overflowY: "auto",
          color: "rgba(255,255,255,0.85)",
          fontFamily: "system-ui, sans-serif",
          fontSize: 13,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              color: "rgba(255,200,120,0.9)",
              letterSpacing: 0.3,
            }}
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>

        {SHORTCUTS.map((row, i) => {
          if ("group" in row) {
            return (
              <div
                key={i}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: "rgba(255,180,80,0.55)",
                  marginTop: i === 0 ? 0 : 14,
                  marginBottom: 6,
                }}
              >
                {row.group}
              </div>
            );
          }
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                {row.description}
              </span>
              <kbd
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 5,
                  padding: "2px 7px",
                  fontSize: 11,
                  fontFamily: "system-ui, sans-serif",
                  color: "rgba(255,220,160,0.9)",
                  whiteSpace: "nowrap",
                  marginLeft: 12,
                }}
              >
                {row.key}
              </kbd>
            </div>
          );
        })}

        <div
          style={{
            marginTop: 18,
            fontSize: 11,
            color: "rgba(255,255,255,0.25)",
            textAlign: "center",
          }}
        >
          Press <kbd style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4, padding: "1px 5px", fontSize: 10 }}>?</kbd> to toggle this dialog
        </div>
      </div>
    </div>
  );
}
