import { useState, useCallback, useEffect } from "react";
import { useAppStore } from "../../store/appStore";
import { listModels } from "../../ai/ollamaClient";
import type { OllamaModel } from "../../types/ollama";

interface Props {
  onClose: () => void;
}

export default function OllamaSettings({ onClose }: Props) {
  const ollamaSettings = useAppStore((s) => s.ollamaSettings);
  const setOllamaSettings = useAppStore((s) => s.setOllamaSettings);

  const [baseUrl, setBaseUrl] = useState(ollamaSettings.baseUrl);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState(ollamaSettings.model);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchModels = useCallback(async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const list = await listModels(baseUrl);
      setModels(list);
      if (list.length > 0 && !selectedModel) {
        setSelectedModel(list[0].name);
      }
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Cannot connect to Ollama",
      );
    } finally {
      setFetching(false);
    }
  }, [baseUrl, selectedModel]);

  useEffect(() => {
    fetchModels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(() => {
    setOllamaSettings({
      baseUrl,
      model: selectedModel,
      enabled: !!selectedModel,
    });
    onClose();
  }, [baseUrl, onClose, selectedModel, setOllamaSettings]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(25,18,10,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14,
          padding: 24,
          width: 400,
          fontFamily: "system-ui, sans-serif",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            color: "#fff",
            fontSize: 17,
            fontWeight: 600,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>🤖 Ollama Settings</span>
          <button
            onClick={onClose}
            title="Close settings"
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
          Your Ollama server URL. All AI requests go directly to your local server — no data leaves your machine.
        </div>

        <label style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, display: "block", marginBottom: 6 }}>
          Ollama URL
        </label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              color: "#fff",
              padding: "8px 10px",
              fontSize: 13,
              outline: "none",
              fontFamily: "monospace",
            }}
            placeholder="http://localhost:11434"
          />
          <button
            onClick={fetchModels}
            disabled={fetching}
            title="Test connection and fetch available models from your Ollama server"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              color: "#fff",
              padding: "0 14px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {fetching ? "…" : "Test"}
          </button>
        </div>

        {fetchError && (
          <div
            style={{
              color: "#ff8080",
              fontSize: 12,
              background: "rgba(255,0,0,0.1)",
              borderRadius: 6,
              padding: "6px 10px",
              marginBottom: 16,
            }}
          >
            {fetchError}
          </div>
        )}

        {models.length > 0 && (
          <>
            <label style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, display: "block", marginBottom: 6 }}>
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: "#fff",
                padding: "8px 10px",
                fontSize: 13,
                marginBottom: 20,
                outline: "none",
              }}
            >
              <option value="">Select a model…</option>
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "rgba(255,255,255,0.6)",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={{
              background: "rgba(255,102,0,0.8)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
