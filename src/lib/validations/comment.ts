import { z } from "zod";

// Matches the DB check constraint (1–2000 chars)
export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Write something first")
    .max(2000, "Keep it under 2000 characters"),
});

export type CommentFormValues = z.infer<typeof commentSchema>;
