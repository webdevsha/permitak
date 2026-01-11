"use client"

import { AppSidebar, MobileNav } from "@/components/app-sidebar"
import { Footer } from "@/components/footer"
import { RecentTransactions } from "@/components/recent-transactions"
import { Users, AlertCircle, Loader2, TrendingUp, ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"
import { TenantList } from "@/components/tenant-list"
import { AccountingModule } from "@/components/accounting-module"
import { RentalModule } from "@/components/rental-module"
import { SettingsModule } from "@/components/settings-module"
import { LocationModule } from "@/components/location-module"
import useSWR from "swr"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const fetchDashboardData = async () => {
  const supabase = createClient()
  
  // 1. Fetch Transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    
  // 2. Fetch Tenants with their Locations to know rates
  const { data: tenants } = await supabase
    .from('tenants')
    .select('*, tenant_locations(*, locations(*))')
  
  // 3. Logic: Calculate Overdue based on Rate Type
  const overdueTenants = []
  
  if (tenants && transactions) {
     for (const t of tenants) {
       // Find last approved income
       const lastTx = transactions.find(
         tx => tx.tenant_id === t.id && tx.type === 'income' && tx.status === 'approved'
       )
       
       // Determine primary rate type from assigned locations (take first for simplicity)
       const loc = t.tenant_locations?.[0]
       const rateType = loc?.rate_type || 'monthly' // Default to monthly if unknown
       const locationName = loc?.locations?.name || 'Unknown'

       // Calculate Days passed
       let daysDiff = 0
       let lastDateStr = 'Tiada Rekod'
       
       if (!lastTx) {
          daysDiff = 999 // Never paid
       } else {
          const lastDate = new Date(lastTx.date)
          const today = new Date()
          const diffTime = Math.abs(today.getTime() - lastDate.getTime())
          daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          lastDateStr = lastTx.date
       }

       // --- Overdue Logic ---
       let isOverdue = false
       let arrearsAmount = 0
       let overdueText = ""

       if (rateType === 'monthly') {
         // Monthly renews monthly (30 days)
         if (daysDiff > 30) {
           isOverdue = true
           const monthsOverdue = Math.floor(daysDiff / 30)
           const rate = loc?.locations?.rate_monthly || 0
           arrearsAmount = monthsOverdue * rate
           overdueText = `${monthsOverdue} Bulan`
         }
       } else {
         // Daily/Khemah/CBS renews WEEKLY (7 days)
         if (daysDiff > 7) {
           isOverdue = true
           const weeksOverdue = Math.floor(daysDiff / 7)
           const rate = rateType === 'cbs' ? (loc?.locations?.rate_cbs || 0) : (loc?.locations?.rate_khemah || 0)
           arrearsAmount = weeksOverdue * rate
           overdueText = `${weeksOverdue} Minggu`
         }
       }

       if (isOverdue) {
          overdueTenants.push({
             ...t,
             lastDate: lastDateStr,
             arrears: arrearsAmount,
             overdueText,
             locationName
          })
       }
     }
  }
  
  return {
    transactions: transactions || [],
    tenants: tenants || [],
    overdueTenants
  }
}

export default function DashboardPage() {
  const { role, isLoading: authLoading } = useAuth()
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  const { data: dashData, isLoading: dataLoading } = useSWR(role === 'admin' || role === 'staff' ? 'dashboard_data' : null, fetchDashboardData)

  useEffect(() => {
    if (authLoading) return
    
    if (role === 'admin' || role === 'staff') {
      setActiveModule("overview")
    } else {
      setActiveModule("rentals")
    }
  }, [role, authLoading])

  if (authLoading || !activeModule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  const displayRole = role === "admin" ? "Admin" : role === "staff" ? "Staff" : "Peniaga"

  const transactions = dashData?.transactions || []
  const tenants = dashData?.tenants || []
  const overdueTenants = dashData?.overdueTenants || []
  
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'approved')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const activeTenantsCount = tenants.filter(t => t.status === 'active').length
  
  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      {/* Sidebar for Desktop */}
      <AppSidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* Navbar for Mobile */}
        <MobileNav 
          activeModule={activeModule} 
          setActiveModule={setActiveModule} 
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-10 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-border/30">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground tracking-tighter">
                  Hai, <span className="text-primary italic">{displayRole}</span>
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl font-medium tracking-tight opacity-70">
                  {role === "admin"
                    ? "Ringkasan operasi dan kewangan semasa."
                    : "Urus tapak dan bayaran dengan mudah."}
                </p>
              </div>
              <div className="hidden md:flex bg-white px-6 py-3 rounded-2xl text-primary font-bold border border-border/50 shadow-sm items-center gap-3 text-sm">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                {new Date().toLocaleDateString("ms-MY", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </header>

            {activeModule === "overview" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20 rounded-[2rem]">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-primary-foreground/80 font-medium text-xs uppercase tracking-wider">Jumlah Kutipan</CardDescription>
                      <CardTitle className="text-3xl lg:text-4xl font-sans font-bold">
                        RM {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-xs bg-primary-foreground/10 w-fit px-3 py-1 rounded-full">
                        <TrendingUp size={14} />
                        <span>{transactions.filter(t => t.type === 'income').length} Transaksi</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-border/50 shadow-sm rounded-[2rem]">
                     <CardHeader className="pb-2">
                      <CardDescription className="font-medium text-xs uppercase tracking-wider">Peniaga Berdaftar</CardDescription>
                      <CardTitle className="text-3xl lg:text-4xl font-sans font-bold text-foreground">
                        {tenants.length}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                       <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full w-fit">
                        <Users size={14} />
                        <span>{activeTenantsCount} Aktif</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-orange-50 border-orange-100 shadow-sm rounded-[2rem]">
                     <CardHeader className="pb-2">
                      <CardDescription className="text-orange-800/70 font-medium text-xs uppercase tracking-wider">Tunggakan</CardDescription>
                      <CardTitle className="text-3xl lg:text-4xl font-sans font-bold text-orange-700">
                        RM {overdueTenants.reduce((acc, t) => acc + t.arrears, 0).toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                       <div className="flex items-center gap-2 text-xs text-orange-700/80 bg-orange-100/50 px-3 py-1 rounded-full w-fit">
                        <AlertCircle size={14} />
                        <span>{overdueTenants.length} Kes Lewat</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                   {/* Left Column: Transaction List */}
                   <div className="xl:col-span-2 space-y-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-serif font-semibold">Transaksi Terkini</h2>
                        <Button variant="link" onClick={() => setActiveModule('accounting')} className="text-primary text-sm h-auto p-0">
                          Lihat Semua &rarr;
                        </Button>
                      </div>
                      <RecentTransactions data={transactions} />
                   </div>

                   {/* Right Column: Problematic Tenants List */}
                   <div className="space-y-6">
                      <h2 className="text-xl font-serif font-semibold">Senarai Tunggakan</h2>
                      
                      <Card className="bg-white border-border/50 shadow-sm rounded-3xl overflow-hidden h-fit">
                        <CardHeader className="bg-red-50/50 border-b border-red-100/50 py-4">
                          <CardTitle className="text-base flex items-center gap-2 text-red-900">
                            <AlertCircle size={18} className="text-red-600" />
                            {overdueTenants.length} Peniaga Lewat Bayar
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-y-auto max-h-[400px]">
                          {overdueTenants.length > 0 ? (
                             <ul className="divide-y divide-border/30">
                               {overdueTenants.map((t: any) => (
                                 <li key={t.id} className="p-4 hover:bg-red-50/30 transition-colors flex justify-between items-center group">
                                   <div>
                                     <div className="flex items-center gap-2">
                                       <p className="font-bold text-sm text-foreground">{t.full_name}</p>
                                       <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full font-bold">
                                         -{t.overdueText}
                                       </span>
                                     </div>
                                     <p className="text-xs text-muted-foreground">{t.business_name} • {t.locationName}</p>
                                     <p className="text-xs text-red-600 font-bold mt-1">
                                       Tunggakan: RM {t.arrears}
                                     </p>
                                   </div>
                                   <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setActiveModule('tenants')}>
                                      <ArrowRight size={14} />
                                   </Button>
                                 </li>
                               ))}
                             </ul>
                          ) : (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                               <p>Tiada tunggakan dikesan.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                   </div>
                </div>

              </div>
            )}

            {activeModule === "tenants" && <TenantList />}
            {activeModule === "accounting" && <AccountingModule />}
            {activeModule === "locations" && <LocationModule />}
            {activeModule === "rentals" && <RentalModule />}
            {activeModule === "settings" && <SettingsModule />}
            
            <Footer />
          </div>
        </main>
      </div>
    </div>
  )
}
