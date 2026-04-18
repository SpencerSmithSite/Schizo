import type { LinkItem as LinkItemType } from "../../types/items";
import ItemWrapper from "./ItemWrapper";

interface Props {
  item: LinkItemType;
}

export default function LinkItem({ item }: Props) {
  const domain = (() => {
    try {
      return new URL(item.url).hostname.replace(/^www\./, "");
    } catch {
      return item.url;
    }
  })();

  return (
    <ItemWrapper item={item}>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#fff",
          boxShadow: "2px 3px 8px rgba(0,0,0,0.25)",
          borderRadius: "2px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          border: "1px solid rgba(0,0,0,0.06)",
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
            background: "radial-gradient(circle at 35% 35%, #aaffaa, #006600)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            zIndex: 2,
          }}
        />

        {item.previewImageUrl && (
          <img
            src={item.previewImageUrl}
            alt=""
            draggable={false}
            style={{
              width: "100%",
              height: 90,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        )}

        <div style={{ padding: "8px 10px", flex: 1, overflow: "hidden" }}>
          {item.faviconUrl && (
            <img
              src={item.faviconUrl}
              alt=""
              style={{ width: 14, height: 14, marginRight: 6, verticalAlign: "middle" }}
            />
          )}
          <span
            style={{
              fontSize: 10,
              color: "#888",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {domain}
          </span>
          {item.title && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#111",
                marginTop: 3,
                lineHeight: 1.3,
                fontFamily: "system-ui, sans-serif",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {item.title}
            </div>
          )}
          {item.description && (
            <div
              style={{
                fontSize: 11,
                color: "#555",
                marginTop: 3,
                lineHeight: 1.4,
                fontFamily: "system-ui, sans-serif",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {item.description}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "4px 10px",
            borderTop: "1px solid rgba(0,0,0,0.06)",
            fontSize: 10,
            color: "#1a6fff",
            fontFamily: "system-ui, sans-serif",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.url}
        </div>

        {item.label && (
          <div
            style={{
              padding: "3px 10px 5px",
              fontSize: 11,
              color: "#555",
              textAlign: "center",
              fontFamily: "'Caveat', cursive",
              borderTop: "1px solid rgba(0,0,0,0.04)",
            }}
          >
            {item.label}
          </div>
        )}
      </div>
    </ItemWrapper>
  );
}
