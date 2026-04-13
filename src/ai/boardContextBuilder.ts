import type { Item } from "../types/items";
import type { Board } from "../types/board";

/**
 * Extracts all readable text from a board's items and builds a system prompt
 * context string for the Ollama AI assistant.
 */
export function buildBoardContext(board: Board, items: Item[]): string {
  const lines: string[] = [
    `You are an assistant helping the user think through a corkboard called "${board.name}".`,
    `The board contains ${items.length} item(s). Here is the content:`,
    "",
  ];

  for (const item of items) {
    switch (item.type) {
      case "note":
        if (item.content.trim()) {
          lines.push(`[Note] ${item.label ? `"${item.label}" — ` : ""}${item.content.trim()}`);
        }
        break;
      case "link":
        lines.push(
          `[Link] ${item.title ?? item.url}${item.description ? ` — ${item.description}` : ""}${
            item.label ? ` (label: "${item.label}")` : ""
          } (${item.url})`,
        );
        break;
      case "image":
        if (item.altText || item.label) {
          lines.push(`[Image] ${item.label ?? item.altText ?? "untitled"}`);
        }
        break;
      case "screenshot":
        lines.push(
          `[Screenshot] ${item.label ?? "screenshot"}${item.sourceUrl ? ` (from ${item.sourceUrl})` : ""}`,
        );
        break;
      case "video":
        lines.push(
          `[Video] ${item.label ?? "video"}${item.url ? ` (${item.url})` : ""}`,
        );
        break;
    }
  }

  lines.push("");
  lines.push(
    "Answer the user's questions about this board. Be concise and insightful. " +
      "You may notice patterns, connections, or summarize themes across the items.",
  );

  return lines.join("\n");
}
