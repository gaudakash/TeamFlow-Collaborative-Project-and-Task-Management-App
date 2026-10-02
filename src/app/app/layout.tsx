import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher";

// Private dashboard: keep it out of Google
export const metadata: Metadata = {
  title: "Dashboard | TeamFlow",
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth: proxy already protects /app, but never rely on one layer
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || profile?.email || user.email;

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Link href="/app/workspaces" className="font-semibold tracking-tight">
            TeamFlow
          </Link>
          <WorkspaceSwitcher />

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground md:inline">
              {displayName}
            </span>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut aria-hidden />
                <span className="sr-only sm:not-sr-only">Log out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
