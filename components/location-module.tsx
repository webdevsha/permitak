"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Plus, MapPin, Loader2, Eye, Users, Store } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import useSWR from "swr"
import { createClient } from "@/utils/supabase/client"
import { Location } from "@/types/supabase-types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const fetcher = async () => {
  const supabase = createClient()
  // Fetch locations
  const { data: locations, error } = await supabase.from('locations').select('*').order('created_at', { ascending: true })
  
  if (error) throw error
  
  // Fetch tenant counts for each location
  const locationsWithCounts = await Promise.all(locations.map(async (loc) => {
    const { count } = await supabase
      .from('tenant_locations')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', loc.id)
    
    return { ...loc, tenant_count: count || 0 }
  }))

  return locationsWithCounts
}

export function LocationModule() {
  const { data: locations, error, isLoading, mutate } = useSWR('locations_list_v2', fetcher)
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [locationTenants, setLocationTenants] = useState<any[]>([])
  const [loadingTenants, setLoadingTenants] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  // New Location State
  const [newLocation, setNewLocation] = useState({
    name: "",
    type: "daily" as "daily" | "monthly",
    operating_days: "Setiap Hari",
    total_lots: "50",
    rate_khemah: "0",
    rate_cbs: "0",
    rate_monthly: "0"
  })

  const handleAddLocation = async () => {
    if (!newLocation.name) {
      toast.error("Sila masukkan nama lokasi")
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.from('locations').insert({
        name: newLocation.name,
        type: newLocation.type,
        operating_days: newLocation.operating_days,
        total_lots: parseInt(newLocation.total_lots) || 0,
        rate_khemah: parseFloat(newLocation.rate_khemah) || 0,
        rate_cbs: parseFloat(newLocation.rate_cbs) || 0,
        rate_monthly: parseFloat(newLocation.rate_monthly) || 0
      })

      if (error) throw error

      toast.success("Lokasi baru berjaya ditambah")
      setIsAddDialogOpen(false)
      mutate() // Refresh list
      
      // Reset form
      setNewLocation({
        name: "",
        type: "daily",
        operating_days: "Setiap Hari",
        total_lots: "50",
        rate_khemah: "0",
        rate_cbs: "0",
        rate_monthly: "0"
      })

    } catch (e: any) {
      toast.error("Gagal menambah lokasi: " + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleViewTenants = async (location: any) => {
    setSelectedLocation(location)
    setLoadingTenants(true)
    
    const { data } = await supabase
      .from('tenant_locations')
      .select(`
        *,
        tenants:tenant_id (full_name, business_name, phone_number, status)
      `)
      .eq('location_id', location.id)
      
    setLocationTenants(data || [])
    setLoadingTenants(false)
  }

  // Handle Status Toggle (Active/Inactive)
  const handleRentalStatusChange = async (rentalId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
       const { error } = await supabase.from('tenant_locations').update({ status: newStatus }).eq('id', rentalId)
       if (error) throw error
       
       setLocationTenants(prev => prev.map(r => r.id === rentalId ? {...r, status: newStatus} : r))
       toast.success("Status tapak dikemaskini")
    } catch (e: any) {
       toast.error("Gagal kemaskini: " + e.message)
    }
  }

  // Handle Stall Number Update
  const handleSaveStall = async (rentalId: number, stallNumber: string) => {
    try {
       const { error } = await supabase.from('tenant_locations').update({ stall_number: stallNumber }).eq('id', rentalId)
       if (error) throw error
       toast.success("No. Petak disimpan")
    } catch (e: any) {
       toast.error("Gagal simpan: " + e.message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground">Pengurusan Lokasi</h2>
          <p className="text-muted-foreground">Urus tapak pasar, kapasiti dan jadual operasi</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-2xl h-12 px-6">
              <Plus className="mr-2 h-5 w-5" />
              Tambah Lokasi
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-border rounded-3xl sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Lokasi Baru</DialogTitle>
              <DialogDescription>Konfigurasi tapak pasar baru</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Lokasi</Label>
                <Input 
                  id="name" 
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                  placeholder="Contoh: Uptown Danau Kota" 
                  className="rounded-xl"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                  <Label>Jenis Operasi</Label>
                  <Select 
                    value={newLocation.type} 
                    onValueChange={(v: "daily" | "monthly") => setNewLocation({...newLocation, type: v})}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Harian (Pasar Malam/Pagi)</SelectItem>
                      <SelectItem value="monthly">Bulanan (Kiosk/Uptown)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Jumlah Lot/Tapak</Label>
                  <Input 
                    type="number"
                    value={newLocation.total_lots}
                    onChange={(e) => setNewLocation({...newLocation, total_lots: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Hari/Waktu Operasi</Label>
                <Input 
                  value={newLocation.operating_days}
                  onChange={(e) => setNewLocation({...newLocation, operating_days: e.target.value})}
                  placeholder="Contoh: Sabtu & Ahad (8am - 2pm)" 
                  className="rounded-xl"
                />
              </div>

              <div className="bg-secondary/20 p-4 rounded-xl space-y-3">
                <Label className="font-bold text-primary">Tetapan Kadar Sewa (RM)</Label>
                {newLocation.type === 'daily' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Kadar Tapak (Khemah)</Label>
                      <Input 
                        type="number" 
                        value={newLocation.rate_khemah}
                        onChange={(e) => setNewLocation({...newLocation, rate_khemah: e.target.value})}
                        className="h-9 bg-white" 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Kadar CBS (Lori)</Label>
                      <Input 
                        type="number" 
                        value={newLocation.rate_cbs}
                        onChange={(e) => setNewLocation({...newLocation, rate_cbs: e.target.value})}
                        className="h-9 bg-white" 
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-xs">Kadar Sewa Bulanan</Label>
                    <Input 
                      type="number" 
                      value={newLocation.rate_monthly}
                      onChange={(e) => setNewLocation({...newLocation, rate_monthly: e.target.value})}
                      className="bg-white" 
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleAddLocation} disabled={isSaving} className="w-full rounded-xl h-11 bg-primary text-white">
                {isSaving ? <Loader2 className="animate-spin" /> : "Simpan Lokasi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {locations?.map((loc: any) => {
          const occupancy = Math.round((loc.tenant_count / (loc.total_lots || 1)) * 100)
          
          return (
          <Card key={loc.id} className="border-border/50 shadow-sm bg-white overflow-hidden rounded-[2rem] hover:shadow-md transition-all">
            <CardHeader className="bg-secondary/10 border-b border-border/30 pb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-primary">
                    <Store size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{loc.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                       <Calendar className="w-3 h-3" /> {loc.operating_days || "Setiap Hari"}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={loc.type === 'daily' ? 'default' : 'secondary'} className="capitalize">
                  {loc.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              {/* Capacity Bar */}
              <div className="space-y-2">
                 <div className="flex justify-between text-sm font-medium">
                   <span className="text-muted-foreground">Kapasiti Peniaga</span>
                   <span className={occupancy > 90 ? "text-red-600" : "text-primary"}>
                     {loc.tenant_count} / {loc.total_lots}
                   </span>
                 </div>
                 <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${occupancy > 90 ? 'bg-red-500' : 'bg-primary'}`} 
                      style={{ width: `${Math.min(occupancy, 100)}%` }} 
                    />
                 </div>
              </div>

              {/* Rates */}
              <div className="bg-muted/30 p-3 rounded-xl space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase">Kadar Sewa Semasa</p>
                {loc.type === 'daily' ? (
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="block text-xs text-muted-foreground">Khemah</span>
                      <span className="font-bold">RM {loc.rate_khemah}</span>
                    </div>
                    <div className="h-8 w-px bg-border/50" />
                    <div>
                      <span className="block text-xs text-muted-foreground">CBS (Lori)</span>
                      <span className="font-bold">RM {loc.rate_cbs}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Bulanan</span>
                    <span className="font-bold text-lg">RM {loc.rate_monthly}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                 <Dialog onOpenChange={(open) => open && handleViewTenants(loc)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary">
                      <Users className="mr-2 h-4 w-4" /> Senarai Peniaga ({loc.tenant_count})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl bg-white rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-serif">Peniaga di {loc.name}</DialogTitle>
                      <DialogDescription>Senarai penyewa yang berdaftar di lokasi ini</DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-4 max-h-[400px] overflow-y-auto">
                      {loadingTenants ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                      ) : locationTenants.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nama</TableHead>
                              <TableHead>Bisnes</TableHead>
                              <TableHead>No. Petak</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {locationTenants.map((lt: any) => (
                              <TableRow key={lt.id}>
                                <TableCell className="font-medium">
                                  {lt.tenants?.full_name}
                                  <div className="text-xs text-muted-foreground">{lt.tenants?.phone_number}</div>
                                </TableCell>
                                <TableCell>{lt.tenants?.business_name}</TableCell>
                                <TableCell>
                                  <Input 
                                    className="h-8 w-24 bg-white text-xs border-primary/20" 
                                    defaultValue={lt.stall_number || ""}
                                    placeholder="Petak..."
                                    onBlur={(e) => handleSaveStall(lt.id, e.target.value)}
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                   <div className="flex items-center justify-center gap-2">
                                      <Switch 
                                        checked={lt.status === 'active'}
                                        onCheckedChange={() => handleRentalStatusChange(lt.id, lt.status)}
                                      />
                                      <span className={cn("text-[10px] uppercase font-bold w-12 text-left", lt.status === 'active' ? "text-brand-green" : "text-muted-foreground")}>
                                         {lt.status === 'active' ? 'Aktif' : 'Pend.'}
                                      </span>
                                   </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-12 bg-secondary/10 rounded-2xl text-muted-foreground">
                          <Store className="w-10 h-10 mx-auto mb-2 opacity-20" />
                          <p>Tiada peniaga didaftarkan di lokasi ini.</p>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                       <Button variant="outline" onClick={() => setSelectedLocation(null)}>Tutup</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

            </CardContent>
          </Card>
          )
        })}
      </div>
    </div>
  )
}
