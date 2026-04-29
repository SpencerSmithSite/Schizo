export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export type BoardBackground = "cork" | "dark-cork" | "felt" | "whiteboard";

export interface Board {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  backgroundStyle: BoardBackground;
  viewport: Viewport;
  parentBoardId?: string;
}
