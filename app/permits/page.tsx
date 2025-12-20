import { DashboardNav } from "@/components/dashboard-nav"
import { PermitsModule } from "@/components/permits-module"

export default function PermitsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto py-6 px-4">
        <PermitsModule />
      </main>
    </div>
  )
}
