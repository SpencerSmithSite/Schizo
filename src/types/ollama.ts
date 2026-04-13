export interface OllamaSettings {
  baseUrl: string;
  model: string;
  enabled: boolean;
}

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaModel {
  name: string;
  size: number;
  modifiedAt: string;
}

export const DEFAULT_OLLAMA_SETTINGS: OllamaSettings = {
  baseUrl: "http://localhost:11434",
  model: "",
  enabled: false,
};
