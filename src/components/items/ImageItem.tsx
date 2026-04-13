import type { ImageItem as ImageItemType } from "../../types/items";
import ItemWrapper from "./ItemWrapper";

interface Props {
  item: ImageItemType;
}

export default function ImageItem({ item }: Props) {
  return (
    <ItemWrapper item={item}>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#fff",
          boxShadow: "2px 3px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)",
          borderRadius: "2px",
          padding: 6,
          display: "flex",
          flexDirection: "column",
          position: "relative",
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
            background: "radial-gradient(circle at 35% 35%, #6699ff, #003399)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            zIndex: 2,
          }}
        />
        <img
          src={item.src}
          alt={item.altText ?? ""}
          draggable={false}
          style={{
            width: "100%",
            flex: 1,
            objectFit: "cover",
            borderRadius: "1px",
            display: "block",
          }}
        />
        {item.label && (
          <div
            style={{
              fontSize: 11,
              color: "#555",
              textAlign: "center",
              marginTop: 4,
              fontFamily: "'Caveat', cursive",
            }}
          >
            {item.label}
          </div>
        )}
      </div>
    </ItemWrapper>
  );
}
