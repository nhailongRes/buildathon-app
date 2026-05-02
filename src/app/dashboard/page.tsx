import { logout } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">Your planner is coming soon.</p>
      <form action={logout} className="mt-4">
        <Button variant="outline" size="sm" type="submit">Sign out</Button>
      </form>
    </div>
  )
}
