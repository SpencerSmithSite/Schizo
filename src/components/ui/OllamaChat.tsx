import { useState, useRef, useCallback, useEffect } from "react";
import { useAppStore } from "../../store/appStore";
import { useBoardStore } from "../../store/boardStore";
import { streamChat } from "../../ai/ollamaClient";
import { buildBoardContext } from "../../ai/boardContextBuilder";
import type { OllamaMessage } from "../../types/ollama";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface Props {
  onClose: () => void;
}

export default function OllamaChat({ onClose }: Props) {
  const ollamaSettings = useAppStore((s) => s.ollamaSettings);
  const board = useBoardStore((s) => s.board);
  const items = useBoardStore((s) => s.items);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<boolean>(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    if (!input.trim() || loading || !ollamaSettings.model) return;
    if (!board) return;

    const userMsg = input.trim();
    setInput("");
    setError(null);
    setLoading(true);
    abortRef.current = false;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMsg },
      { role: "assistant", content: "", streaming: true },
    ];
    setMessages(newMessages);

    const systemPrompt = buildBoardContext(board, items);
    const apiMessages: OllamaMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userMsg },
    ];

    try {
      let fullContent = "";
      for await (const chunk of streamChat(
        ollamaSettings.baseUrl,
        ollamaSettings.model,
        apiMessages,
      )) {
        if (abortRef.current) break;
        fullContent += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: fullContent,
            streaming: true,
          };
          return updated;
        });
      }
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: fullContent,
          streaming: false,
        };
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setMessages((prev) => prev.slice(0, -1)); // Remove empty assistant message
    } finally {
      setLoading(false);
    }
  }, [board, input, items, loading, messages, ollamaSettings]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    [send],
  );

  const notConfigured = !ollamaSettings.model || !ollamaSettings.enabled;

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: 340,
        zIndex: 300,
        background: "rgba(20,14,8,0.97)",
        backdropFilter: "blur(20px)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>
            AI Assistant
          </div>
          {ollamaSettings.model && (
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>
              {ollamaSettings.model} · local
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          title="Close chat"
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontSize: 20,
            lineHeight: 1,
            padding: 2,
          }}
        >
          ×
        </button>
      </div>

      {notConfigured ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            gap: 12,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32 }}>🤖</div>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>
            Ollama not configured
          </div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.6 }}>
            Install Ollama locally, pull a model, then configure the URL and
            model in Settings.
            <br />
            <br />
            Your board data stays on your machine — nothing is sent to the cloud.
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 13,
                  textAlign: "center",
                  marginTop: 24,
                  lineHeight: 1.6,
                }}
              >
                Ask me anything about the items on this board.
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  background:
                    msg.role === "user"
                      ? "rgba(255,102,0,0.25)"
                      : "rgba(255,255,255,0.07)",
                  borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  padding: "8px 12px",
                  color: "#fff",
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg.content}
                {msg.streaming && (
                  <span style={{ opacity: 0.5, marginLeft: 4 }}>▊</span>
                )}
              </div>
            ))}
            {error && (
              <div
                style={{
                  color: "#ff6666",
                  fontSize: 12,
                  textAlign: "center",
                  background: "rgba(255,0,0,0.1)",
                  borderRadius: 6,
                  padding: "6px 10px",
                }}
              >
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              gap: 8,
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this board…"
              rows={2}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#fff",
                padding: "8px 10px",
                fontSize: 13,
                resize: "none",
                fontFamily: "system-ui, sans-serif",
                lineHeight: 1.4,
                outline: "none",
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              title="Send message"
              style={{
                background: loading ? "rgba(255,102,0,0.3)" : "rgba(255,102,0,0.8)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                padding: "0 14px",
                cursor: loading || !input.trim() ? "default" : "pointer",
                fontSize: 16,
                opacity: loading || !input.trim() ? 0.5 : 1,
                transition: "opacity 0.15s, background 0.15s",
              }}
            >
              {loading ? "…" : "↑"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
