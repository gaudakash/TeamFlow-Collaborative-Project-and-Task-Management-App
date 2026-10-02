// Centralized query keys = no typos, easy cache invalidation
export const queryKeys = {
  workspaces: {
    all: ["workspaces"] as const,
    detail: (id: string) => ["workspaces", id] as const,
  },
};
