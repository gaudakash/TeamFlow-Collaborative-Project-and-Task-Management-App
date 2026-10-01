import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export default function WorkspacesPage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Workspaces</h1>
      <p>You are logged in 🎉</p>
      <form action={logout}>
        <Button type="submit" variant="outline">
          Log out
        </Button>
      </form>
    </div>
  );
}
