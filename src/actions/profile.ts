"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/profile";

// ⚠️ A 'use server' file may only export async functions (types are fine, they're erased)
export type ProfileFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldError?: string;
};

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  // Never trust the client: validate again on the server
  const parsed = profileSchema.safeParse({
    full_name: String(formData.get("full_name") ?? ""),
  });
  if (!parsed.success) {
    return {
      status: "error",
      fieldError: parsed.error.issues[0]?.message ?? "Invalid name",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "You must be signed in" };

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", user.id)
    .select("id");

  if (error) return { status: "error", message: error.message };
  if (!data || data.length === 0)
    return { status: "error", message: "Could not update your profile" };

  // Refresh server-rendered UI that shows the name (header)
  revalidatePath("/app", "layout");
  return { status: "success", message: "Profile updated" };
}
