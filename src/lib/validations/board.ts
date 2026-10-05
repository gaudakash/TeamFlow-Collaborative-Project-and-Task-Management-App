import { z } from "zod";

export const boardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Board name is required")
    .max(60, "Keep it under 60 characters"),
});

export type BoardFormValues = z.infer<typeof boardSchema>;
