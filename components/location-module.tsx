"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Plus, MapPin, Loader2, Eye, Users, Store, User, Edit, DollarSign, UserX } from "lucide-react"
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
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"

// Fetcher with role handling
const fetcher = async ([, role, userId]: [string, string, string]) => {
  const supabase = createClient()
  let query = supabase.from('locations').select('*')
  
  if (role === 'organizer') {
    query = query.eq('organizer_id', userId)
  }
  
  const { data: locations, error } = await query.order('created_at', { ascending: true })
  
  if (error) throw error
  
  // Fetch tenant counts and organizer details
  const locationsWithCounts = await Promise.all(locations.map(async (loc) => {
    const { count } = await supabase
      .from('tenant_locations')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', loc.id)
      
    let organizerName = null
    if (loc.organizer_id) {
       const { data } = await supabase.from('profiles').select('full_name').eq('id', loc.organizer_id).single()
       organizerName = data?.full_name
    }
    
    return { ...loc, tenant_count: count || 0, organizer_name: organizerName }
  }))

  return locationsWithCounts
}

// Fetch organizers list for assignment dropdown
const fetchOrganizers = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'organizer')
    return data || []
}

export function LocationModule() {
  const { user, role } = useAuth()
  const { data: locations, error, isLoading, mutate } = useSWR(user ? ['locations_list_v7', role, user.id] : null, fetcher)
  const { data: organizers } = useSWR('organizers_list_dd', fetchOrganizers)
  
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [locationTenants, setLocationTenants] = useState<any[]>([])
  const [loadingTenants, setLoadingTenants] = useState(false)
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  
  const supabase = createClient()

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "daily" as "daily" | "monthly",
    operating_days: "",
    rate_khemah: "0",
    rate_cbs: "0",
    rate_monthly: "0",
    organizer_id: "none"
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "daily",
      operating_days: "",
      rate_khemah: "0",
      rate_cbs: "0",
      rate_monthly: "0",
      organizer_id: "none"
    })
    setIsEditing(false)
    setEditId(null)
  }

  const handleOpenAdd = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (loc: any) => {
    setFormData({
      name: loc.name || "",
      description: loc.description || "",
      type: loc.type || "daily",
      operating_days: loc.operating_days || "",
      rate_khemah: loc.rate_khemah?.toString() || "0",
      rate_cbs: loc.rate_cbs?.toString() || "0",
      rate_monthly: loc.rate_monthly?.toString() || "0",
      organizer_id: loc.organizer_id || "none"
    })
    setEditId(loc.id)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleSaveLocation = async () => {
    if (!formData.name) {
      toast.error("Sila masukkan Nama Program")
      return
    }

    setIsSaving(true)
    try {
      // Ensure organizer_id is correctly formatted for UUID or NULL
      const organizerValue = formData.organizer_id === "none" || !formData.organizer_id ? null : formData.organizer_id;

      const payload: any = {
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        operating_days: formData.operating_days,
        rate_khemah: parseFloat(formData.rate_khemah) || 0,
        rate_cbs: parseFloat(formData.rate_cbs) || 0,
        rate_monthly: parseFloat(formData.rate_monthly) || 0,
        organizer_id: organizerValue
      }

      if (isEditing && editId) {
        const { error } = await supabase.from('locations').update(payload).eq('id', editId)
        if (error) throw error
        toast.success("Lokasi berjaya dikemaskini")
      } else {
        const { error } = await supabase.from('locations').insert(payload)
        if (error) throw error
        toast.success("Lokasi baru berjaya ditambah")
      }

      setIsDialogOpen(false)
      mutate() // Refresh list
      resetForm()

    } catch (e: any) {
      console.error(e)
      toast.error("Ralat: " + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  // ... (Keep existing helper functions: handleViewTenants, handleRentalStatusChange, handleSaveStall)

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
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground">Pengurusan Lokasi</h2>
          <p className="text-muted-foreground">Urus tapak pasar, program dan kadar sewa</p>
        </div>
        {role === 'admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAdd} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-2xl h-12 px-6">
                <Plus className="mr-2 h-5 w-5" />
                Tambah Lokasi
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-border rounded-3xl sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">{isEditing ? "Kemaskini Lokasi" : "Lokasi Baru"}</DialogTitle>
                <DialogDescription>Konfigurasi butiran program dan sewaan</DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Program</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Contoh: Pasar Malam Rabu" 
                    className="rounded-xl"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Lokasi (Venue)</Label>
                  <Input 
                    id="description" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Contoh: Danau Kota, Setapak" 
                    className="rounded-xl"
                  />
                </div>
                
                <div className="grid gap-2">
                   <Label>Lantik Penganjur (Pilihan)</Label>
                   <Select 
                      value={formData.organizer_id || "none"} 
                      onValueChange={(v) => setFormData({...formData, organizer_id: v})}
                   >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Pilih Penganjur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Tiada (Admin) --</SelectItem>
                        {organizers?.map((org: any) => (
                           <SelectItem key={org.id} value={org.id}>{org.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                   {organizers?.length === 0 && (
                      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
                        Tiada penganjur dijumpai. Sila pergi ke halaman <strong>Setup</strong> untuk menambah data penganjur.
                      </p>
                   )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="grid gap-2">
                    <Label>Jenis Operasi</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(v: "daily" | "monthly") => setFormData({...formData, type: v})}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Mingguan (Weekly)</SelectItem>
                        <SelectItem value="monthly">Bulanan (Monthly)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Waktu Operasi</Label>
                    <Input 
                      value={formData.operating_days}
                      onChange={(e) => setFormData({...formData, operating_days: e.target.value})}
                      placeholder="e.g. 5pm - 10pm" 
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="bg-secondary/20 p-4 rounded-xl space-y-3">
                  <Label className="font-bold text-primary flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Tetapan Kadar Sewa
                  </Label>
                  
                  <div>
                    <Label className="text-xs">Harga Bulanan (RM)</Label>
                    <Input 
                      type="number" 
                      value={formData.rate_monthly}
                      onChange={(e) => setFormData({...formData, rate_monthly: e.target.value})}
                      className="bg-white font-bold text-lg" 
                      placeholder="0.00"
                    />
                  </div>

                  {formData.type === 'daily' && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                      <div>
                        <Label className="text-xs">Kadar Tapak (Khemah)</Label>
                        <Input 
                          type="number" 
                          value={formData.rate_khemah}
                          onChange={(e) => setFormData({...formData, rate_khemah: e.target.value})}
                          className="h-9 bg-white" 
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Kadar CBS (Lori)</Label>
                        <Input 
                          type="number" 
                          value={formData.rate_cbs}
                          onChange={(e) => setFormData({...formData, rate_cbs: e.target.value})}
                          className="h-9 bg-white" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleSaveLocation} disabled={isSaving} className="w-full rounded-xl h-11 bg-primary text-white">
                  {isSaving ? <Loader2 className="animate-spin" /> : (isEditing ? "Simpan Perubahan" : "Tambah Lokasi")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {locations?.map((loc: any) => {
          return (
          <Card key={loc.id} className="border-border/50 shadow-sm bg-white overflow-hidden rounded-[2rem] hover:shadow-md transition-all group relative">
            
            {/* Edit Button Overlay */}
            {role === 'admin' && (
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-sm" onClick={() => handleOpenEdit(loc)}>
                    <Edit className="w-4 h-4" />
                 </Button>
              </div>
            )}

            <CardHeader className="bg-secondary/10 border-b border-border/30 pb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-primary">
                    <Store size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-lg leading-tight">{loc.name}</CardTitle>
                    {loc.description && (
                      <p className="text-xs font-bold text-muted-foreground mt-1">{loc.description}</p>
                    )}
                    <CardDescription className="flex items-center gap-1 mt-1 text-[10px]">
                       <Calendar className="w-3 h-3" /> {loc.operating_days || "Setiap Hari"}
                    </CardDescription>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                <Badge variant={loc.type === 'daily' ? 'default' : 'secondary'} className="capitalize text-[10px]">
                  {loc.type === 'daily' ? 'Mingguan' : 'Bulanan'}
                </Badge>
                
                {loc.organizer_name ? (
                  <Badge variant="outline" className="text-[10px] bg-white border-primary/20 text-primary">
                     <User className="w-3 h-3 mr-1" /> {loc.organizer_name}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-white text-muted-foreground border-dashed">
                     <UserX className="w-3 h-3 mr-1" /> Tiada Penganjur
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              <div className="text-center p-4 bg-muted/30 rounded-xl space-y-1">
                 <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Harga Bulanan</p>
                 <p className="text-3xl font-black text-primary">
                    RM {Number(loc.rate_monthly || 0).toLocaleString()}
                 </p>
                 {loc.type === 'daily' && (
                   <p className="text-[10px] text-muted-foreground">atau RM{loc.rate_khemah}/hari</p>
                 )}
              </div>

              <div className="flex justify-between items-center text-sm font-medium px-2">
                 <span className="text-muted-foreground">Peniaga Aktif</span>
                 <span className="text-foreground font-bold">{loc.tenant_count}</span>
              </div>

              <div className="pt-2">
                 <Dialog onOpenChange={(open) => open && handleViewTenants(loc)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary">
                      <Users className="mr-2 h-4 w-4" /> Senarai Peniaga
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl bg-white rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-serif">{loc.name}</DialogTitle>
                      <DialogDescription>{loc.description} • Senarai penyewa</DialogDescription>
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
        {locations?.length === 0 && (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
             <MapPin className="w-10 h-10 mx-auto mb-2 opacity-20" />
             <p>Tiada lokasi ditemui.</p>
          </div>
        )}
      </div>
    </div>
  )
}
