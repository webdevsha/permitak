"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { MessageSquare, Eye, Phone, Loader2, AlertCircle, Calendar, FileText, Download, Building, MapPin } from "lucide-react"
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

// Fetcher to get tenants with their locations and latest payment
const fetchTenants = async () => {
  const supabase = createClient()
  
  // 1. Get Tenants
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  if (!tenants) return []

  // 2. Enrich data
  const enrichedTenants = await Promise.all(tenants.map(async (tenant) => {
    // Get Locations
    const { data: locs } = await supabase
      .from('tenant_locations')
      .select('*, locations(*)')
      .eq('tenant_id', tenant.id)
    
    // Get Latest Approved Payment from tenant_payments
    const { data: payments } = await supabase
      .from('tenant_payments')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('status', 'approved')
      .order('payment_date', { ascending: false })
      .limit(1)

    const lastPayment = payments?.[0]
    
    // --- STATUS LOGIC ---
    let status = 'active'
    let overdueLabel = ''
    
    // Determine Rate Type (Weekly vs Monthly)
    const loc = locs?.[0]
    const rateType = loc?.rate_type || 'monthly'

    if (!lastPayment) {
       status = 'new'
    } else {
       const lastDate = new Date(lastPayment.payment_date)
       const today = new Date()
       const diffTime = Math.abs(today.getTime() - lastDate.getTime())
       const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

       if (rateType === 'monthly') {
         if (daysDiff > 35) { // Give 5 days buffer
           status = 'overdue'
           const months = Math.floor(daysDiff / 30)
           overdueLabel = `${months} Bulan`
         } else {
           status = 'paid'
         }
       } else {
         // Weekly (Daily/Khemah/CBS) - Renews every 7 days
         if (daysDiff > 10) { // Give 3 days buffer
           status = 'overdue'
           const weeks = Math.floor(daysDiff / 7)
           overdueLabel = `${weeks} Minggu`
         } else {
           status = 'paid'
         }
       }
    }
    
    // Format Date nicely
    const dateDisplay = lastPayment?.payment_date 
      ? new Date(lastPayment.payment_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })
      : "Tiada Rekod"

    return {
      ...tenant,
      locations: locs?.map((l: any) => l.locations?.name) || [],
      lastPaymentDate: dateDisplay,
      lastPaymentAmount: lastPayment?.amount || 0,
      computedStatus: status,
      overdueLabel
    }
  }))

  return enrichedTenants
}

export function TenantList() {
  const { data: tenants, isLoading } = useSWR('enriched_tenants_v7', fetchTenants)
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [tenantTransactions, setTenantTransactions] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const supabase = createClient()

  const handleViewTenant = async (tenant: any) => {
    setSelectedTenant(tenant)
    setLoadingHistory(true)
    
    // Fetch transaction history for this tenant
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('date', { ascending: false })
      
    setTenantTransactions(data || [])
    setLoadingHistory(false)
  }

  const getStatusBadge = (tenant: any) => {
    switch (tenant.computedStatus) {
      case "paid":
        return <Badge className="bg-brand-green/10 text-brand-green border-none hover:bg-brand-green/20">Berbayar</Badge>
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800 border-none hover:bg-red-200 animate-pulse">
            Tunggakan {tenant.overdueLabel && `(${tenant.overdueLabel})`}
          </Badge>
        )
      case "new":
        return <Badge className="bg-brand-blue/10 text-brand-blue border-none hover:bg-brand-blue/20">Baru</Badge>
      default:
        return <Badge variant="secondary">Tiada Rekod</Badge>
    }
  }

  const openWhatsApp = (phone: string | null) => {
    if (!phone) return
    window.open(`https://wa.me/${phone.replace(/\D/g,'')}`, "_blank")
  }

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
  }

  return (
    <Card className="border-border/50 shadow-sm bg-white">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="font-serif text-2xl text-foreground">Pengurusan Peniaga & Sewa</CardTitle>
            <CardDescription className="text-muted-foreground">
              Senarai peniaga aktif dan status pembayaran sewa terkini
            </CardDescription>
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
                <TableHead className="text-foreground font-bold">Status</TableHead>
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
                        <div className="font-medium text-foreground">{tenant.full_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {tenant.business_name || "Tiada Nama Bisnes"}
                        </div>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {tenant.locations.length > 0 ? tenant.locations.map((loc: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full border border-border/50"
                        >
                          {loc}
                        </span>
                      )) : <span className="text-xs text-muted-foreground italic">Tiada Lokasi</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {tenant.lastPaymentDate}
                    {tenant.lastPaymentAmount > 0 && (
                      <span className="block text-xs text-muted-foreground">RM {tenant.lastPaymentAmount}</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(tenant)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={() => handleViewTenant(tenant)}
                          >
                            <Eye size={16} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-border sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-serif text-foreground">Maklumat Peniaga</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                              Profil lengkap dan rekod perniagaan
                            </DialogDescription>
                          </DialogHeader>
                          {selectedTenant && (
                            <div className="space-y-6 py-4">
                              
                              {/* Profile Header */}
                              <div className="flex items-start gap-4">
                                 <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-border bg-secondary/30 shrink-0">
                                   {selectedTenant.profile_image_url ? (
                                      <Image src={selectedTenant.profile_image_url} alt="Profile" fill className="object-cover" />
                                   ) : (
                                      <div className="w-full h-full flex items-center justify-center text-primary text-2xl font-bold">
                                         {selectedTenant.full_name?.charAt(0)}
                                      </div>
                                   )}
                                 </div>
                                 <div className="flex-1">
                                    <h3 className="text-xl font-bold text-foreground">{selectedTenant.full_name}</h3>
                                    <p className="text-muted-foreground flex items-center gap-1.5 text-sm mt-1">
                                       <Building size={14} /> {selectedTenant.business_name || "Tiada Nama Perniagaan"}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                       {selectedTenant.ssm_number && (
                                          <Badge variant="outline" className="text-[10px] font-mono">SSM: {selectedTenant.ssm_number}</Badge>
                                       )}
                                       {selectedTenant.ic_number && (
                                          <Badge variant="outline" className="text-[10px] font-mono">IC: {selectedTenant.ic_number}</Badge>
                                       )}
                                    </div>
                                 </div>
                              </div>

                              {/* Detailed Info Grid */}
                              <div className="grid grid-cols-2 gap-4 bg-secondary/10 p-5 rounded-2xl border border-border/50">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                     <Phone size={10} /> No. Telefon
                                  </label>
                                  <p className="font-medium text-foreground text-sm">{selectedTenant.phone_number || "-"}</p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                     <MapPin size={10} /> Alamat
                                  </label>
                                  <p className="font-medium text-foreground text-sm truncate">{selectedTenant.address || "-"}</p>
                                </div>
                                
                                <div className="col-span-2 grid grid-cols-2 gap-2 mt-2">
                                   {selectedTenant.ssm_file_url && (
                                      <Button variant="outline" size="sm" className="w-full text-xs h-9 bg-white" onClick={() => window.open(selectedTenant.ssm_file_url, '_blank')}>
                                         <FileText className="w-3 h-3 mr-2" /> Lihat Sijil SSM
                                      </Button>
                                   )}
                                   {selectedTenant.ic_file_url && (
                                      <Button variant="outline" size="sm" className="w-full text-xs h-9 bg-white" onClick={() => window.open(selectedTenant.ic_file_url, '_blank')}>
                                         <FileText className="w-3 h-3 mr-2" /> Lihat Salinan IC
                                      </Button>
                                   )}
                                </div>
                              </div>

                              {/* Status Alert */}
                              {selectedTenant.computedStatus === 'overdue' ? (
                                <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex gap-3 items-center">
                                  <AlertCircle className="text-red-600 h-5 w-5" />
                                  <div>
                                    <p className="text-red-900 font-bold text-sm">Tunggakan Dikesan</p>
                                    <p className="text-red-700 text-xs">
                                      Peniaga ini lewat membayar selama <strong>{selectedTenant.overdueLabel}</strong>.
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-brand-green/10 border border-brand-green/20 p-3 rounded-lg flex gap-3 items-center">
                                  <Calendar className="text-brand-green h-5 w-5" />
                                  <div>
                                    <p className="text-brand-green font-bold text-sm">Akaun Berbayar</p>
                                    <p className="text-brand-green/80 text-xs">
                                      Tiada tunggakan. Bayaran terakhir diterima pada {selectedTenant.lastPaymentDate}.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Transaction History Section */}
                              <div>
                                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-primary" /> Sejarah Transaksi
                                </h3>
                                <div className="border border-border/50 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                                  {loadingHistory ? (
                                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
                                  ) : tenantTransactions.length > 0 ? (
                                    <Table>
                                      <TableHeader className="bg-secondary/20 sticky top-0 z-10">
                                        <TableRow className="h-9">
                                          <TableHead className="text-xs">Tarikh</TableHead>
                                          <TableHead className="text-xs">Keterangan</TableHead>
                                          <TableHead className="text-xs text-right">Jumlah</TableHead>
                                          <TableHead className="text-xs text-center">Status</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {tenantTransactions.map((tx) => (
                                          <TableRow key={tx.id} className="h-10 text-xs">
                                            <TableCell className="font-mono">{tx.date}</TableCell>
                                            <TableCell className="capitalize">{tx.description || tx.category}</TableCell>
                                            <TableCell className={`text-right font-bold ${tx.type === 'income' ? 'text-brand-green' : 'text-red-600'}`}>
                                              {tx.type === 'income' ? '+' : '-'} {tx.amount}
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <Badge variant="outline" className={`text-[10px] px-1 py-0 h-5 ${tx.status === 'approved' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                                                {tx.status}
                                              </Badge>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  ) : (
                                    <div className="p-6 text-center text-muted-foreground text-sm bg-secondary/5">
                                      Tiada rekod transaksi dijumpai.
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-3 pt-2">
                                <Button
                                  className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white font-bold"
                                  onClick={() => openWhatsApp(selectedTenant.phone_number)}
                                  disabled={!selectedTenant.phone_number}
                                >
                                  <Phone className="mr-2 h-4 w-4" />
                                  Hubungi WhatsApp
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
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
