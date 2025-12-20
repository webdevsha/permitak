import { DashboardNav } from "@/components/dashboard-nav"
import { VendorModule } from "@/components/vendor-module"

export default function VendorsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto py-6 px-4">
        <VendorModule />
      </main>
    </div>
  )
}
