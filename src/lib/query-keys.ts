export const queryKeys = {
  workspaces: {
    all: ["workspaces"] as const,
    detail: (id: string) => ["workspaces", id] as const,
  },
  boards: {
    byWorkspace: (workspaceId: string) => ["boards", workspaceId] as const,
  },
  members: {
    byWorkspace: (workspaceId: string) => ["members", workspaceId] as const,
  },
  tasks: {
    all: ["tasks"] as const, // prefix: invalidating this refreshes every task query
    byBoard: (boardId: string) => ["tasks", boardId] as const,
    detail: (taskId: string) => ["tasks", "detail", taskId] as const,
  },
  comments: {
    byTask: (taskId: string) => ["comments", taskId] as const,
  },
};
