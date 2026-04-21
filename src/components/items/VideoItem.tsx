import { useState } from "react";
import type { VideoItem as VideoItemType } from "../../types/items";
import ItemWrapper from "./ItemWrapper";

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const ytId =
      u.searchParams.get("v") ||
      (u.hostname === "youtu.be" ? u.pathname.slice(1) : null);
    if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1`;
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}?autoplay=1`;
    }
  } catch {
    /* invalid URL */
  }
  return null;
}

function getYtThumbnail(url: string): string | null {
  try {
    const u = new URL(url);
    const ytId =
      u.searchParams.get("v") ||
      (u.hostname === "youtu.be" ? u.pathname.slice(1) : null);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  } catch {
    /* invalid URL */
  }
  return null;
}

interface Props {
  item: VideoItemType;
}

export default function VideoItem({ item }: Props) {
  const [playing, setPlaying] = useState(false);
  const url = item.url ?? item.src ?? "";
  const embedUrl = getEmbedUrl(url);
  const thumbnailUrl = item.thumbnailUrl ?? getYtThumbnail(url) ?? null;

  return (
    <ItemWrapper item={item}>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#111",
          boxShadow: "2px 3px 8px rgba(0,0,0,0.35)",
          borderRadius: "2px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          border: "1px solid rgba(0,0,0,0.2)",
        }}
      >
        {/* Pushpin */}
        <div
          style={{
            position: "absolute",
            top: -6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #ff8888, #880000)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />

        {embedUrl && playing ? (
          <>
            <iframe
              src={embedUrl}
              style={{
                width: "100%",
                flex: 1,
                border: "none",
                display: "block",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            {/* Stop-playback button so the item can be dragged again */}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setPlaying(false);
              }}
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "none",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                fontSize: 11,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
              title="Stop playback (re-enables dragging)"
            >
              ✕
            </button>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              position: "relative",
              cursor: embedUrl ? "pointer" : "default",
            }}
            onDoubleClick={(e) => {
              if (!embedUrl) return;
              e.stopPropagation();
              setPlaying(true);
            }}
          >
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt=""
                draggable={false}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 6,
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "system-ui, sans-serif",
                  fontSize: 11,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: 28 }}>🎬</span>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    width: "100%",
                  }}
                >
                  {url || "No URL"}
                </span>
              </div>
            )}

            {embedUrl && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.88)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.45)",
                  }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderStyle: "solid",
                      borderWidth: "10px 0 10px 18px",
                      borderColor: "transparent transparent transparent #cc0000",
                      marginLeft: 4,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {item.label && (
          <div
            style={{
              padding: "3px 10px 5px",
              fontSize: 11,
              color: "rgba(255,255,255,0.7)",
              textAlign: "center",
              fontFamily: "'Caveat', cursive",
              background: "rgba(0,0,0,0.55)",
              flexShrink: 0,
            }}
          >
            {item.label}
          </div>
        )}
      </div>
    </ItemWrapper>
  );
}
