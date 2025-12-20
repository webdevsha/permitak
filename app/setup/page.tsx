"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Shield, User, Users, CheckCircle, AlertTriangle } from "lucide-react"

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const supabase = createClient()

  const addLog = (msg: string) => setLogs(prev => [...prev, msg])

  const users = [
    { email: "admin@permit.com", pass: "pass1234", role: "admin", name: "Super Admin", isTenant: false },
    { email: "staff@permit.com", pass: "pass1234", role: "staff", name: "Staff Member", isTenant: false },
    { email: "siti@permit.com", pass: "pass1234", role: "tenant", name: "Siti Aminah", isTenant: true, business: "Siti Hijab Collection", phone: "0123456789" },
    { email: "ahmad@permit.com", pass: "pass1234", role: "tenant", name: "Ahmad Albab", isTenant: true, business: "Ahmad Burger", phone: "0198765432" },
  ]

  const runSetup = async () => {
    setLoading(true)
    setLogs([])
    addLog("Starting setup...")

    try {
      for (const u of users) {
        addLog(`Processing user: ${u.email}...`)
        
        // 1. Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: u.email,
          password: u.pass,
          options: {
            data: { full_name: u.name }
          }
        })

        if (error) {
          addLog(`⚠️ Auth Note: ${error.message} (User might exist)`)
        } 
        
        // Wait a bit for trigger to run
        await new Promise(r => setTimeout(r, 1000))

        // Get the user ID (whether new or existing)
        // We can't get it easily if signUp failed due to existing, so we try to signIn or just query profile if possible (RLS might block)
        // For setup script, we assume clean slate or we just skip if exists. 
        // BUT, we need the ID to create the Tenant record.
        
        // If we can't get the ID easily from client-side without logging in, we'll try to insert tenant blindly? No, we need profile_id.
        // Let's assume the user was created or we proceed. 
        
        if (data.user) {
             const userId = data.user.id
             addLog(`✅ User ID: ${userId.slice(0, 6)}...`)

             // 2. Set Role
             if (u.role !== 'tenant') {
                 await supabase.rpc('set_user_role', {
                   target_email: u.email,
                   new_role: u.role
                 })
                 addLog(`   Updated role to ${u.role}`)
             }

             // 3. Create Tenant Record if needed
             if (u.isTenant) {
                 // Check if tenant exists
                 const { data: existingTenant } = await supabase
                    .from('tenants')
                    .select('id')
                    .eq('email', u.email)
                    .maybeSingle()
                 
                 if (!existingTenant) {
                     const { error: tenantError } = await supabase
                        .from('tenants')
                        .insert({
                            profile_id: userId,
                            full_name: u.name,
                            business_name: u.business,
                            phone_number: u.phone,
                            email: u.email,
                            status: 'active'
                        })
                     
                     if (tenantError) addLog(`   ❌ Tenant Error: ${tenantError.message}`)
                     else addLog(`   ✨ Created Tenant record`)
                 } else {
                     addLog(`   Tenant record already exists`)
                 }
                 
                 // 4. Create Dummy Transaction for Siti (Overdue)
                 if (u.email === 'siti@permit.com') {
                     // Get Tenant ID
                     const { data: tData } = await supabase.from('tenants').select('id').eq('email', u.email).single()
                     if (tData) {
                         // Check if transaction exists
                         const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('tenant_id', tData.id)
                         
                         if (count === 0) {
                             const date45DaysAgo = new Date()
                             date45DaysAgo.setDate(date45DaysAgo.getDate() - 45)
                             
                             await supabase.from('transactions').insert({
                                 tenant_id: tData.id,
                                 amount: 50.00,
                                 type: 'income',
                                 category: 'Sewa Bulanan',
                                 status: 'approved',
                                 date: date45DaysAgo.toISOString().split('T')[0],
                                 description: 'Bayaran Sewa Bulan Lepas'
                             })
                             addLog(`   📅 Created OLD transaction (Overdue test)`)
                         }
                     }
                 }
             }
        }
      }
      
      addLog("🎉 Setup complete!")
      toast.success("Setup complete")
      
      // Logout
      await supabase.auth.signOut()

    } catch (e: any) {
      addLog(`🔥 Critical Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-none">
        <CardHeader className="bg-white border-b pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
               <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Database Setup & Seeder</CardTitle>
              <CardDescription>Initialize your demo environment</CardDescription>
            </div>
          </div>
          
          <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm flex gap-3 items-start border border-amber-100">
             <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
             <div>
               <p className="font-bold mb-1">Instructions:</p>
               <ol className="list-decimal pl-4 space-y-1">
                 <li>Ensure you have disabled "Confirm Email" in Supabase Auth settings.</li>
                 <li>Click the button below to generate users and data.</li>
                 <li><strong>Siti Aminah</strong> will be created with an overdue payment.</li>
               </ol>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Accounts</h3>
              {users.map((u, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                   <div className="flex items-center gap-3">
                     {u.role === 'admin' ? <Shield size={16} className="text-red-500" /> : 
                      u.role === 'staff' ? <User size={16} className="text-blue-500" /> : 
                      <Users size={16} className="text-green-500" />}
                     <div>
                       <p className="font-bold text-sm">{u.email}</p>
                       <p className="text-xs text-muted-foreground">{u.name}</p>
                     </div>
                   </div>
                   <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">{u.role}</span>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-green-400 h-full min-h-[200px] overflow-y-auto">
              <p className="text-slate-500 border-b border-slate-800 pb-2 mb-2">System Logs...</p>
              {logs.length === 0 && <p className="opacity-50 italic">Ready to start...</p>}
              {logs.map((log, i) => (
                <p key={i} className="mb-1">{log}</p>
              ))}
            </div>
          </div>

          <Button 
            onClick={runSetup} 
            disabled={loading}
            size="lg" 
            className="w-full text-lg font-bold h-14 shadow-lg shadow-primary/20"
          >
            {loading ? "Processing..." : "Run Setup & Seed Data"}
          </Button>

        </CardContent>
      </Card>
    </div>
  )
}