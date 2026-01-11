"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Loader2, Upload, FileText } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { Tenant, Transaction } from "@/types/supabase-types"

export function RentalModule() {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [myLocations, setMyLocations] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch Data
  useEffect(() => {
    async function fetchData() {
      if (!user) return
      
      try {
        setLoading(true)
        
        // 1. Get Tenant Profile
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle()
          
        let currentTenant = tenantData
        
        if (!currentTenant && user.email) {
           const { data: tenantByEmail } = await supabase
            .from('tenants')
            .select('*')
            .eq('email', user.email)
            .maybeSingle()
            currentTenant = tenantByEmail
        }

        if (currentTenant) {
          setTenant(currentTenant)
          
          // 2. Get Assigned Locations
          const { data: locData } = await supabase
            .from('tenant_locations')
            .select(`
              *,
              locations:location_id (*)
            `)
            .eq('tenant_id', currentTenant.id)
            
          if (locData) {
             const processedLocations = locData.map((item: any) => {
               let price = 0
               if (item.rate_type === 'khemah') price = item.locations.rate_khemah
               else if (item.rate_type === 'cbs') price = item.locations.rate_cbs
               else if (item.rate_type === 'monthly') price = item.locations.rate_monthly
               
               return {
                 ...item,
                 display_price: price,
                 location_name: item.locations.name
               }
             })
             setMyLocations(processedLocations)
             if (processedLocations.length > 0) {
               setSelectedLocationId(processedLocations[0].id.toString())
               setPaymentAmount(processedLocations[0].display_price.toString())
             }
          }

          // 3. Get Payment History from NEW TABLE
          const { data: payData } = await supabase
            .from('tenant_payments')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .order('payment_date', { ascending: false })
            
          if (payData) setHistory(payData)
        }
        
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user, supabase])

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locId = e.target.value
    setSelectedLocationId(locId)
    const loc = myLocations.find(l => l.id.toString() === locId)
    if (loc) {
      setPaymentAmount(loc.display_price.toString())
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0])
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant || !selectedLocationId) return

    setIsProcessing(true)
    
    try {
      let receiptUrl = null

      // Upload Receipt if exists
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop()
        const fileName = `${tenant.id}-${Math.random()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, receiptFile)

        if (uploadError) throw uploadError
        
        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName)
          
        receiptUrl = publicUrl
      }

      const selectedLoc = myLocations.find(l => l.id.toString() === selectedLocationId)
      const payDate = new Date().toISOString().split('T')[0]
      const payDesc = `Bayaran Sewa - ${selectedLoc?.location_name} (${selectedLoc?.stall_number})`
      
      // 1. Insert into Accounting Transactions (The Ledger)
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert({
          tenant_id: tenant.id,
          amount: parseFloat(paymentAmount),
          type: 'income',
          category: 'Servis', // Updated to 'Servis' to align with "Cash In" categories (jualan, servis, lain-lain)
          description: payDesc,
          status: 'pending', 
          date: payDate,
          receipt_url: receiptUrl // Optional fallback
        })
        .select()
        .single()

      if (txError) throw txError

      // 2. Insert into Tenant Payments (The History Record)
      const { error: payError } = await supabase
        .from('tenant_payments')
        .insert({
          tenant_id: tenant.id,
          transaction_id: txData.id,
          amount: parseFloat(paymentAmount),
          payment_date: payDate,
          receipt_url: receiptUrl,
          status: 'pending',
          remarks: payDesc
        })

      if (payError) throw payError

      toast.success("Pembayaran Berjaya dihantar! Menunggu pengesahan.")
      setReceiptFile(null)
      
      // Refresh history
      const { data: histData } = await supabase
        .from('tenant_payments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('payment_date', { ascending: false })
      
      if (histData) setHistory(histData)

    } catch (err: any) {
      toast.error("Gagal memproses bayaran: " + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
  }

  if (!tenant) {
    return (
      <div className="p-8 text-center bg-yellow-50 rounded-xl border border-yellow-200 text-yellow-800">
        <h3 className="font-bold text-lg">Akaun Belum Diaktifkan</h3>
        <p>Sila hubungi Admin untuk mengaktifkan akaun perniagaan anda.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-bold text-foreground">Pengurusan Sewa</h2>
        <p className="text-muted-foreground">Urus status sewa dan pembayaran tapak untuk <strong>{tenant.business_name}</strong></p>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="status" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
            Status Sewa
          </TabsTrigger>
          <TabsTrigger value="payment" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
            Bayar Sewa
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
            Sejarah Bayaran
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {myLocations.map((rental) => (
              <Card key={rental.id} className="bg-white border-border/50 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all">
                <CardHeader className="pb-4 bg-secondary/30 border-b border-border/30">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-foreground font-serif text-xl">{rental.location_name}</CardTitle>
                    <Badge className="bg-brand-green/10 text-brand-green border-none capitalize">{rental.status}</Badge>
                  </div>
                  <CardDescription>No. Petak: <strong>{rental.stall_number}</strong></CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-muted-foreground font-medium">Jenis Sewa:</span>
                    <Badge variant="outline" className="capitalize">{rental.rate_type}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Kadar Semasa:</span>
                    <span className="text-2xl font-bold text-primary">RM {rental.display_price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {myLocations.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-white rounded-3xl border border-dashed border-border text-muted-foreground">
                 Anda belum mempunyai sebarang tapak sewa.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <Card className="max-w-xl mx-auto bg-white border-border/50 shadow-sm rounded-[2rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground font-serif">
                <CreditCard className="text-primary" />
                Pembayaran Sewa Pantas
              </CardTitle>
              <CardDescription>Selesaikan bayaran harian atau bulanan anda secara atas talian</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-6">
                <div className="space-y-2">
                  <Label>Pilih Lokasi & Tapak</Label>
                  <select 
                    className="w-full h-12 px-3 rounded-xl border border-input bg-transparent text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={selectedLocationId}
                    onChange={handleLocationChange}
                  >
                    {myLocations.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.location_name} ({r.stall_number})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Jumlah Bayaran (RM)</Label>
                  <Input 
                    type="number" 
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="h-12 text-lg font-bold rounded-xl" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Muat Naik Resit
                  </Label>
                  <Input 
                    type="file" 
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="h-12 pt-2 rounded-xl bg-secondary/20 cursor-pointer" 
                  />
                  <p className="text-xs text-muted-foreground">Format: JPG, PNG atau PDF (Max 5MB)</p>
                </div>

                <div className="pt-4">
                  <Button
                    disabled={isProcessing || myLocations.length === 0}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl text-md shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
                      </>
                    ) : (
                      "Hantar Bukti Bayaran"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-white border-border/50 shadow-sm rounded-[2rem] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-foreground font-serif">Rekod Pembayaran Terdahulu</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-secondary/30">
                  <TableRow className="border-border/30 h-12">
                    <TableHead className="pl-6">Tarikh</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-center">Resit</TableHead>
                    <TableHead className="text-center pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((pay) => (
                    <TableRow key={pay.id} className="border-border/30 hover:bg-secondary/20 transition-colors">
                      <TableCell className="pl-6 font-mono text-xs text-muted-foreground">{pay.payment_date}</TableCell>
                      <TableCell className="font-medium text-foreground">{pay.remarks || "Bayaran Sewa"}</TableCell>
                      <TableCell className="text-right font-bold text-brand-green">+ RM {Number(pay.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                         {pay.receipt_url ? (
                           <a href={pay.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-primary underline">
                             <FileText className="w-3 h-3 mr-1" /> Lihat
                           </a>
                         ) : (
                           <span className="text-xs text-muted-foreground">-</span>
                         )}
                      </TableCell>
                      <TableCell className="text-center pr-6">
                        <Badge 
                          className={pay.status === 'approved' 
                            ? "bg-brand-green/10 text-brand-green border-none" 
                            : "bg-amber-100 text-amber-800 border-none"}
                        >
                          {pay.status === 'approved' ? "Berjaya" : "Diproses"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {history.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Tiada rekod pembayaran dijumpai.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
