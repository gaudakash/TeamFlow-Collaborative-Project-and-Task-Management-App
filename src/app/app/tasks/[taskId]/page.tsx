import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TaskDetail } from "@/components/tasks/task-detail";

type Props = {
  params: Promise<{ taskId: string }>;
};

// React `cache` dedupes this call: generateMetadata and the page share ONE database query
const getTaskContext = cache(async (taskId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("id, title, board:boards(id, name, workspace:workspaces(id, name))")
    .eq("id", taskId)
    .maybeSingle();
  return data;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { taskId } = await params;
  const task = await getTaskContext(taskId);
  // `robots: noindex` is inherited from the /app layout
  return {
    title: task ? `${task.title} | TeamFlow` : "Task not found | TeamFlow",
  };
}

export default async function TaskPage({ params }: Props) {
  const { taskId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const [task, { data: profile }] = await Promise.all([
    getTaskContext(taskId),
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  // RLS hides tasks in workspaces you don't belong to → 404
  if (!task?.board?.workspace) notFound();

  const { board } = task;
  const workspace = board.workspace;

  const currentUser = profile ?? {
    id: user.id,
    full_name: null,
    email: user.email ?? null,
    avatar_url: null,
  };

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <li>
            <Link
              href={`/app/workspaces/${workspace.id}`}
              className="hover:text-foreground"
            >
              {workspace.name}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-4" />
          </li>
          <li>
            <Link
              href={`/app/boards/${board.id}`}
              className="hover:text-foreground"
            >
              {board.name}
            </Link>
          </li>
        </ol>
      </nav>

      <TaskDetail
        taskId={task.id}
        boardId={board.id}
        workspaceId={workspace.id}
        currentUser={currentUser}
      />
    </div>
  );
}
