import { DashboardNav } from "@/components/dashboard-nav"
import { AccountingModule } from "@/components/accounting-module"

export default function AccountingPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto py-6 px-4">
        <AccountingModule />
      </main>
    </div>
  )
}
