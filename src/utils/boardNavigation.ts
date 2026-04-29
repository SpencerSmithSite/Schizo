import { useBoardStore } from "../store/boardStore";
import { useAppStore } from "../store/appStore";
import { getAdapter } from "./adapter";
import { nanoid } from "./nanoid";
import type { Board } from "../types/board";
import type { BoardPortalItem } from "../types/items";

async function saveCurrentBoard(): Promise<void> {
  const { board, items, connections, viewport } = useBoardStore.getState();
  if (!board) return;
  const adapter = await getAdapter();
  await adapter
    .saveBoard({ ...board, viewport, updatedAt: Date.now() }, items, connections)
    .catch(console.error);
}

async function loadBoard(id: string): Promise<void> {
  const { initBoard } = useBoardStore.getState();
  const { boards, setActiveBoardId } = useAppStore.getState();
  const adapter = await getAdapter();
  setActiveBoardId(id);
  try {
    const { board: b, items: it, connections: cn } = await adapter.loadBoard(id);
    initBoard(b, it, cn);
  } catch {
    const target = boards.find((b) => b.id === id);
    if (target) initBoard(target, [], []);
  }
}

export async function navigateToBoard(targetBoardId: string): Promise<void> {
  const { board } = useBoardStore.getState();
  const { pushBoardNav } = useAppStore.getState();
  await saveCurrentBoard();
  if (board) pushBoardNav(board.id);
  await loadBoard(targetBoardId);
}

export async function navigateBack(): Promise<void> {
  const { boardNavStack, popBoardNav } = useAppStore.getState();
  const parentBoardId = boardNavStack[boardNavStack.length - 1];
  if (!parentBoardId) return;
  await saveCurrentBoard();
  popBoardNav();
  await loadBoard(parentBoardId);
}

export async function createSubBoardPortal(name: string, worldX: number, worldY: number): Promise<void> {
  const { board, addItem } = useBoardStore.getState();
  const { addBoard: addBoardToApp } = useAppStore.getState();
  if (!board) return;
  const adapter = await getAdapter();

  const newBoardId = nanoid();
  const newBoard: Board = {
    id: newBoardId,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    backgroundStyle: "cork",
    viewport: { x: 0, y: 0, scale: 1 },
    parentBoardId: board.id,
  };

  await adapter.saveBoard(newBoard, [], []);
  addBoardToApp(newBoard);

  const portalId = nanoid();
  const portal: BoardPortalItem = {
    id: portalId,
    boardId: board.id,
    type: "board-portal",
    targetBoardId: newBoardId,
    x: worldX,
    y: worldY,
    width: 160,
    height: 130,
    rotation: (Math.random() - 0.5) * 4,
    zIndex: Date.now(),
    createdAt: Date.now(),
    pins: [
      { id: nanoid(), itemId: portalId, offsetX: -0.5, offsetY: -0.5 },
      { id: nanoid(), itemId: portalId, offsetX: 0.5, offsetY: -0.5 },
      { id: nanoid(), itemId: portalId, offsetX: 0, offsetY: -0.5 },
      { id: nanoid(), itemId: portalId, offsetX: -0.5, offsetY: 0.5 },
      { id: nanoid(), itemId: portalId, offsetX: 0.5, offsetY: 0.5 },
    ],
  };

  addItem(portal);
}
