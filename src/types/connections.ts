export type StringTexture = "thread" | "yarn" | "wire" | "rope";

export interface StringStyle {
  color: string;
  thickness: number;
  texture: StringTexture;
  /** 0 = taut, 1 = very slack */
  slack: number;
}

export interface Connection {
  id: string;
  boardId: string;
  fromPinId: string;
  toPinId: string;
  style: StringStyle;
  label?: string;
  createdAt: number;
}

export const DEFAULT_STRING_STYLE: StringStyle = {
  color: "#cc2200",
  thickness: 2,
  texture: "yarn",
  slack: 0.3,
};
