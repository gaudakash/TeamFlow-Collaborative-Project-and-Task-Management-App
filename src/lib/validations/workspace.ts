import { z } from "zod";

// Matches the DB check constraint (1–60 chars), so validation happens on client AND database
export const workspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required")
    .max(60, "Keep it under 60 characters"),
});

export type WorkspaceFormValues = z.infer<typeof workspaceSchema>;
