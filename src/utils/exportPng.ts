import html2canvas from "html2canvas";

/**
 * Export the current board viewport as a PNG download.
 *
 * Relies on:
 *  - id="board-canvas-root" on the BoardCanvas root div
 *  - preserveDrawingBuffer:true on the PIXI.Application (set in PixiBoard.tsx)
 *    so html2canvas can read the WebGL canvas pixels via toDataURL().
 */
export async function exportBoardAsPng(boardName: string): Promise<void> {
  const root = document.getElementById("board-canvas-root");
  if (!root) throw new Error("board-canvas-root not found");

  const canvas = await html2canvas(root, {
    useCORS: true,
    allowTaint: true,
    scale: window.devicePixelRatio || 1,
    backgroundColor: "#c8a96e",
    logging: false,
  });

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("toBlob returned null")); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = sanitizeFilename(boardName) + ".png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => { URL.revokeObjectURL(url); resolve(); }, 100);
    }, "image/png");
  });
}

function sanitizeFilename(name: string): string {
  return (name || "board").replace(/[^a-z0-9_\-. ]/gi, "_").trim() || "board";
}
