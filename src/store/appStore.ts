import { create } from "zustand";
import type { Board } from "../types/board";
import type { OllamaSettings } from "../types/ollama";
import { DEFAULT_OLLAMA_SETTINGS } from "../types/ollama";

interface AppState {
  boards: Board[];
  activeBoardId: string | null;
  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  removeBoard: (id: string) => void;
  updateBoard: (id: string, patch: Partial<Board>) => void;
  setActiveBoardId: (id: string | null) => void;

  boardNavStack: string[];
  pushBoardNav: (boardId: string) => void;
  popBoardNav: () => void;
  clearBoardNav: () => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  ollamaSettings: OllamaSettings;
  setOllamaSettings: (settings: Partial<OllamaSettings>) => void;

  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  boards: [],
  activeBoardId: null,

  setBoards: (boards) => set({ boards }),
  addBoard: (board) => set((s) => ({ boards: [...s.boards, board] })),
  removeBoard: (id) =>
    set((s) => ({ boards: s.boards.filter((b) => b.id !== id) })),
  updateBoard: (id, patch) =>
    set((s) => ({
      boards: s.boards.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })),
  setActiveBoardId: (id) => set({ activeBoardId: id }),

  boardNavStack: [],
  pushBoardNav: (boardId) =>
    set((s) => ({ boardNavStack: [...s.boardNavStack, boardId] })),
  popBoardNav: () =>
    set((s) => ({ boardNavStack: s.boardNavStack.slice(0, -1) })),
  clearBoardNav: () => set({ boardNavStack: [] }),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  ollamaSettings: { ...DEFAULT_OLLAMA_SETTINGS },
  setOllamaSettings: (settings) =>
    set((s) => ({ ollamaSettings: { ...s.ollamaSettings, ...settings } })),

  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
}));
