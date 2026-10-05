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
};
