import { DashboardNav } from "@/components/dashboard-nav"
import { UsersModule } from "@/components/users-module"

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto py-6 px-4">
        <UsersModule />
      </main>
    </div>
  )
}
