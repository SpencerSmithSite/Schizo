export interface Pin {
  id: string;
  itemId: string;
  /** Normalized offset from item center: -0.5 to 0.5 */
  offsetX: number;
  offsetY: number;
}

export interface BaseItem {
  id: string;
  boardId: string;
  /** World-space position (top-left corner) */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Degrees, for the slightly-crooked aesthetic */
  rotation: number;
  zIndex: number;
  createdAt: number;
  label?: string;
  pins: Pin[];
}

export interface NoteItem extends BaseItem {
  type: "note";
  content: string;
  color: string;
  fontSize: number;
}

export interface ImageItem extends BaseItem {
  type: "image";
  /** URL or data URL for the image */
  src: string;
  altText?: string;
}

export interface ScreenshotItem extends BaseItem {
  type: "screenshot";
  src: string;
  capturedAt: number;
  sourceUrl?: string;
}

export interface LinkItem extends BaseItem {
  type: "link";
  url: string;
  title?: string;
  description?: string;
  faviconUrl?: string;
  previewImageUrl?: string;
  fetchedAt?: number;
}

export interface VideoItem extends BaseItem {
  type: "video";
  src?: string;
  url?: string;
  startTime: number;
  endTime?: number;
  thumbnailUrl?: string;
}

export interface BoardPortalItem extends BaseItem {
  type: "board-portal";
  targetBoardId: string;
}

export type Item =
  | NoteItem
  | ImageItem
  | ScreenshotItem
  | LinkItem
  | VideoItem
  | BoardPortalItem;

export type ItemType = Item["type"];
