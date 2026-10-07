"use client";

import dynamic from "next/dynamic";
import { BoardSkeleton } from "./board-skeleton";

// dnd-kit + the board code load in a separate chunk, only on board pages.
// ssr: false because the board is fully interactive and fetches its data on the client anyway.
export const KanbanBoardLoader = dynamic(
  () => import("./kanban-board").then((mod) => mod.KanbanBoard),
  { ssr: false, loading: () => <BoardSkeleton /> },
);
