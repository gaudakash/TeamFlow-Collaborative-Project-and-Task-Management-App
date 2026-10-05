"use client";

import { UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useMembers, useRemoveMember } from "@/hooks/use-members";
import { getInitials } from "@/lib/format";
import { InviteMemberDialog } from "./invite-member-dialog";

type Props = {
  workspaceId: string;
  currentUserId: string;
  isAdmin: boolean;
};

export function MembersPanel({ workspaceId, currentUserId, isAdmin }: Props) {
  const { data: members, isPending, isError, error } = useMembers(workspaceId);
  const removeMember = useRemoveMember(workspaceId);

  const handleRemove = (userId: string, name: string) => {
    removeMember.mutate(userId, {
      onSuccess: () => toast.success(`${name} removed from workspace`),
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">
          Members{" "}
          {members && (
            <span className="text-muted-foreground">({members.length})</span>
          )}
        </CardTitle>
        {isAdmin && (
          <InviteMemberDialog
            workspaceId={workspaceId}
            trigger={
              <Button size="sm" variant="outline">
                <UserPlus /> Invite
              </Button>
            }
          />
        )}
      </CardHeader>

      <CardContent>
        {isPending && (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        )}

        {isError && (
          <p role="alert" className="text-sm text-destructive">
            {error.message}
          </p>
        )}

        {members && (
          <ul className="space-y-3">
            {members.map(({ profile, role }) => {
              const name = profile.full_name || profile.email || "Unknown user";
              const isSelf = profile.id === currentUserId;

              return (
                <li key={profile.id} className="flex items-center gap-3">
                  <Avatar className="size-9">
                    {profile.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt="" />
                    )}
                    <AvatarFallback>{getInitials(name)}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {name}{" "}
                      {isSelf && (
                        <span className="text-muted-foreground">(you)</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>

                  <Badge variant={role === "admin" ? "default" : "secondary"}>
                    {role}
                  </Badge>

                  {isAdmin && !isSelf && (
                    <ConfirmDialog
                      title={`Remove ${name}?`}
                      description="They will immediately lose access to all boards and tasks in this workspace."
                      confirmLabel="Remove"
                      onConfirm={() => handleRemove(profile.id, name)}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${name}`}
                        >
                          <UserMinus className="size-4" />
                        </Button>
                      }
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
