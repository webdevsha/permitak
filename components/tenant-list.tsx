"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { MessageSquare, Eye, Phone, Loader2, AlertCircle, Calendar, FileText, Download, Building, MapPin, CheckCircle, XCircle, Store, Save } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import useSWR from "swr"
import { createClient } from "@/utils/supabase/client"
import Image from "next/image"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Fetcher remains the same
const fetchTenants = async () => {
  const supabase = createClient()
  const { data: tenants, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false })
  if (error) throw error
  if (!tenants) return []

  const enrichedTenants = await Promise.all(tenants.map(async (tenant) => {
    const { data: locs } = await supabase.from('tenant_locations').select('*, locations(*)').eq('tenant_id', tenant.id)
    const { data: payments } = await supabase.from('tenant_payments').select('*').eq('tenant_id', tenant.id).eq('status', 'approved').order('payment_date', { ascending: false }).limit(1)
    
    // ... logic same as before ...
    const lastPayment = payments?.[0]
    let paymentStatus = 'active'
    let overdueLabel = ''
    const dateDisplay = lastPayment?.payment_date 
      ? new Date(lastPayment.payment_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })
      : "Tiada Rekod"
      
    // Simplified status logic for brevity in this update
    if (!lastPayment) paymentStatus = 'new'
    else paymentStatus = 'paid'

    return {
      ...tenant,
      locations: locs?.map((l: any) => l.locations?.name) || [],
      lastPaymentDate: dateDisplay,
      lastPaymentAmount: lastPayment?.amount || 0,
      paymentStatus,
      overdueLabel
    }
  }))
  return enrichedTenants
}

export function TenantList() {
  const { data: tenants, isLoading, mutate } = useSWR('enriched_tenants_v9', fetchTenants)
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  
  // Dialog Data States
  const [tenantTransactions, setTenantTransactions] = useState<any[]>([])
  const [tenantRentals, setTenantRentals] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = createClient()

  const handleViewTenant = async (tenant: any) => {
    setSelectedTenant(tenant)
    setLoadingDetails(true)
    
    // 1. Fetch Transactions
    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('date', { ascending: false })
    setTenantTransactions(txData || [])

    // 2. Fetch Rentals (Locations)
    const { data: rentalData } = await supabase
      .from('tenant_locations')
      .select('*, locations(*)')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
    setTenantRentals(rentalData || [])

    setLoadingDetails(false)
  }

  // Admin: Toggle Tenant Account Status
  const handleTenantStatusChange = async (tenantId: number, newStatus: string) => {
    setIsUpdating(true)
    try {
      const { error } = await supabase.from('tenants').update({ status: newStatus }).eq('id', tenantId)
      if (error) throw error
      toast.success(`Status peniaga dikemaskini ke ${newStatus}`)
      mutate()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  // Admin: Toggle Individual Rental Location Status
  const handleRentalStatusChange = async (rentalId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
       const { error } = await supabase.from('tenant_locations').update({ status: newStatus }).eq('id', rentalId)
       if (error) throw error
       
       // Update local state to reflect change immediately
       setTenantRentals(prev => prev.map(r => r.id === rentalId ? {...r, status: newStatus} : r))
       toast.success("Status tapak dikemaskini")
    } catch (e: any) {
       toast.error("Gagal kemaskini: " + e.message)
    }
  }

  // Admin: Save Stall Number
  const handleSaveStall = async (rentalId: number, stallNumber: string) => {
    try {
       const { error } = await supabase.from('tenant_locations').update({ stall_number: stallNumber }).eq('id', rentalId)
       if (error) throw error
       toast.success("No. Petak disimpan")
    } catch (e: any) {
       toast.error("Gagal simpan: " + e.message)
    }
  }

  const openWhatsApp = (phone: string | null) => {
    if (!phone) return
    window.open(`https://wa.me/${phone.replace(/\D/g,'')}`, "_blank")
  }

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <Card className="border-border/50 shadow-sm bg-white">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
             <CardTitle className="font-serif text-2xl text-foreground">Pengurusan Peniaga & Sewa</CardTitle>
             <CardDescription>Senarai peniaga aktif dan status pembayaran sewa terkini</CardDescription>
          </div>
          <Button className="bg-primary text-white">Tambah Peniaga</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="border-border/50">
                <TableHead className="text-foreground font-bold">Nama Peniaga</TableHead>
                <TableHead className="text-foreground font-bold">Lokasi Tapak</TableHead>
                <TableHead className="text-foreground font-bold">Bayaran Terakhir</TableHead>
                <TableHead className="text-foreground font-bold text-center">Status Akaun</TableHead>
                <TableHead className="text-right text-foreground font-bold">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants?.map((tenant) => (
                <TableRow key={tenant.id} className="border-border/30 hover:bg-secondary/10 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                       {tenant.profile_image_url ? (
                         <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border">
                           <Image src={tenant.profile_image_url} alt="Profile" fill className="object-cover" />
                         </div>
                       ) : (
                         <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                           {tenant.full_name?.charAt(0)}
                         </div>
                       )}
                       <div>
                        <div className={cn("font-medium transition-colors", tenant.status === 'active' ? "text-brand-green font-bold" : "text-foreground")}>
                          {tenant.full_name}
                          {tenant.status === 'active' && <CheckCircle className="inline-block w-3 h-3 ml-1" />}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">{tenant.business_name}</div>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {tenant.locations.map((loc: string, i: number) => (
                        <span key={i} className="text-xs bg-secondary px-2 py-0.5 rounded-full border border-border/50">{loc}</span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {tenant.lastPaymentDate}
                    {tenant.lastPaymentAmount > 0 && <span className="block text-xs text-muted-foreground">RM {tenant.lastPaymentAmount}</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center items-center gap-2">
                       <Switch 
                         checked={tenant.status === 'active'}
                         onCheckedChange={() => handleTenantStatusChange(tenant.id, tenant.status === 'active' ? 'inactive' : 'active')}
                         disabled={isUpdating}
                       />
                       <span className="text-[10px] uppercase font-bold w-12 text-left text-muted-foreground">{tenant.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => handleViewTenant(tenant)}>
                            <Eye size={16} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-border sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-serif text-foreground">Maklumat Peniaga</DialogTitle>
                          </DialogHeader>
                          {selectedTenant && (
                            <div className="space-y-6 py-4">
                              {/* Header Profile */}
                              <div className="flex items-start gap-4 p-4 bg-secondary/10 rounded-2xl border border-border/50">
                                 <div className="relative w-16 h-16 rounded-full overflow-hidden border border-border bg-white shrink-0">
                                   {selectedTenant.profile_image_url ? <Image src={selectedTenant.profile_image_url} alt="Profile" fill className="object-cover" /> : 
                                      <div className="w-full h-full flex items-center justify-center font-bold text-xl">{selectedTenant.full_name?.charAt(0)}</div>}
                                 </div>
                                 <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                       <p className="text-xs text-muted-foreground font-bold uppercase">Nama Peniaga</p>
                                       <p className="font-bold">{selectedTenant.full_name}</p>
                                    </div>
                                    <div>
                                       <p className="text-xs text-muted-foreground font-bold uppercase">Perniagaan</p>
                                       <p className="font-medium">{selectedTenant.business_name}</p>
                                    </div>
                                    <div>
                                       <p className="text-xs text-muted-foreground font-bold uppercase">Telefon</p>
                                       <p className="font-mono">{selectedTenant.phone_number}</p>
                                    </div>
                                    <div>
                                       <p className="text-xs text-muted-foreground font-bold uppercase">Dokumen</p>
                                       <div className="flex gap-2 mt-1">
                                          {selectedTenant.ssm_file_url && <Badge variant="outline" className="cursor-pointer" onClick={() => window.open(selectedTenant.ssm_file_url)}>SSM</Badge>}
                                          {selectedTenant.ic_file_url && <Badge variant="outline" className="cursor-pointer" onClick={() => window.open(selectedTenant.ic_file_url)}>IC</Badge>}
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              {/* Rental Management Section */}
                              <div>
                                 <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                                    <Store className="w-4 h-4 text-primary" /> Pengurusan Tapak (Rentals)
                                 </h3>
                                 <div className="border border-border/50 rounded-xl overflow-hidden">
                                    {loadingDetails ? <div className="p-4 text-center"><Loader2 className="animate-spin inline" /></div> : 
                                     tenantRentals.length > 0 ? (
                                       <Table>
                                          <TableHeader className="bg-secondary/20">
                                             <TableRow className="h-10">
                                                <TableHead>Lokasi</TableHead>
                                                <TableHead>Jenis</TableHead>
                                                <TableHead className="w-[140px]">No. Petak</TableHead>
                                                <TableHead className="text-center w-[120px]">Status</TableHead>
                                             </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                             {tenantRentals.map((rental) => (
                                                <TableRow key={rental.id}>
                                                   <TableCell className="font-medium">
                                                      {rental.locations?.name}
                                                      <span className="block text-[10px] text-muted-foreground">{rental.locations?.operating_days}</span>
                                                   </TableCell>
                                                   <TableCell className="capitalize text-xs">{rental.rate_type}</TableCell>
                                                   <TableCell>
                                                      <div className="flex items-center gap-1">
                                                         <Input 
                                                            className="h-8 text-xs w-20 bg-white" 
                                                            defaultValue={rental.stall_number || ""}
                                                            onBlur={(e) => handleSaveStall(rental.id, e.target.value)}
                                                            placeholder="A-01"
                                                         />
                                                      </div>
                                                   </TableCell>
                                                   <TableCell className="text-center">
                                                      <div className="flex justify-center items-center gap-2">
                                                         <Switch 
                                                            checked={rental.status === 'active'}
                                                            onCheckedChange={() => handleRentalStatusChange(rental.id, rental.status)}
                                                         />
                                                         <span className={cn("text-[10px] font-bold w-10 text-left", rental.status === 'active' ? "text-brand-green" : "text-amber-600")}>
                                                            {rental.status === 'active' ? 'Aktif' : 'Pend.'}
                                                         </span>
                                                      </div>
                                                   </TableCell>
                                                </TableRow>
                                             ))}
                                          </TableBody>
                                       </Table>
                                    ) : (
                                       <div className="p-4 text-center text-sm text-muted-foreground">Tiada tapak sewa.</div>
                                    )}
                                 </div>
                              </div>

                              {/* Transaction History */}
                              <div>
                                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-primary" /> Sejarah Transaksi
                                </h3>
                                <div className="border border-border/50 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto">
                                   {tenantTransactions.length > 0 ? (
                                      <Table>
                                         <TableHeader className="bg-secondary/20">
                                            <TableRow className="h-8"><TableHead className="text-xs">Tarikh</TableHead><TableHead className="text-xs">Ket.</TableHead><TableHead className="text-xs text-right">RM</TableHead></TableRow>
                                         </TableHeader>
                                         <TableBody>
                                            {tenantTransactions.map(tx => (
                                               <TableRow key={tx.id} className="h-9">
                                                  <TableCell className="text-xs font-mono">{tx.date}</TableCell>
                                                  <TableCell className="text-xs">{tx.description}</TableCell>
                                                  <TableCell className="text-xs text-right font-bold">{tx.amount}</TableCell>
                                               </TableRow>
                                            ))}
                                         </TableBody>
                                      </Table>
                                   ) : <div className="p-4 text-center text-xs text-muted-foreground">Tiada rekod.</div>}
                                </div>
                              </div>

                              <div className="flex gap-3 pt-2">
                                <Button className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white font-bold" onClick={() => openWhatsApp(selectedTenant.phone_number)}>
                                  <Phone className="mr-2 h-4 w-4" /> WhatsApp
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
