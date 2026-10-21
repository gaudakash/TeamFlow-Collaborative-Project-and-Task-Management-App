"use client";

import { useActionState, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateProfile, type ProfileFormState } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ProfileFormState = { status: "idle" };

type Props = {
  defaultName: string;
  email: string;
};

export function ProfileForm({ defaultName, email }: Props) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState,
  );
  // Controlled input: React 19 resets uncontrolled forms after an action, which would wipe typed text on errors
  const [name, setName] = useState(defaultName);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Profile updated");
      // Server components are refreshed by revalidatePath. Client caches (member lists,
      // assignee names, comments) are refreshed here.
      queryClient.invalidateQueries();
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state, queryClient]);

  const fieldError = state.status === "error" ? state.fieldError : undefined;
  const unchanged = name.trim() === defaultName.trim();

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          name="full_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={80}
          required
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? "full-name-error" : undefined}
        />
        {fieldError && (
          <p id="full-name-error" className="text-sm text-destructive">
            {fieldError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled readOnly />
        <p className="text-xs text-muted-foreground">
          Your email is used to sign in and can&apos;t be changed here.
        </p>
      </div>

      <Button type="submit" disabled={isPending || unchanged}>
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
