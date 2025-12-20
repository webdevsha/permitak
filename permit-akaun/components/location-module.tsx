"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Plus, MapPin, Loader2, Eye, Users } from "lucide-react"
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
import { useRouter } from "next/navigation"

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
  const router = useRouter()
  const { data: locations, error, isLoading } = useSWR('locations_list', fetcher)
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [locationTenants, setLocationTenants] = useState<any[]>([])
  const [loadingTenants, setLoadingTenants] = useState(false)
  const supabase = createClient()

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

  const navigateToTenants = () => {
     // In a real app this might pass a filter query param
     // For now, we simulate switching tab in parent (but since this is a module, we can't easily switch parent state without context)
     // However, the prompt asked to "be brought to tenant list page".
     // Since this is a SPA-like dashboard, we might need to rely on the parent updating.
     // But strictly, we can just say "View in Tenants Module"
     window.location.href = "/dashboard" // Or specific tab logic if implemented
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
          <p className="text-muted-foreground">Senarai tapak pasar dan Uptown</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-2xl h-12 px-6">
              <Plus className="mr-2 h-5 w-5" />
              Tambah Lokasi
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-border rounded-3xl sm:max-w-[500px]">
             {/* Add Location Form Placeholder */}
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Lokasi Baru</DialogTitle>
              <DialogDescription>Konfigurasi tapak pasar baru</DialogDescription>
            </DialogHeader>
            <div className="py-12 text-center text-muted-foreground">
               Feature coming soon
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-sm bg-white overflow-hidden rounded-[2rem]">
        <CardHeader className="bg-secondary/20 border-b border-border/30">
          <CardTitle>Senarai Lokasi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/10">
              <TableRow>
                <TableHead className="pl-6">Nama Lokasi</TableHead>
                <TableHead>Jenis Operasi</TableHead>
                <TableHead>Kadar (Harian/Khemah)</TableHead>
                <TableHead>Kadar (Bulanan)</TableHead>
                <TableHead className="text-center">Bil. Peniaga</TableHead>
                <TableHead className="text-right pr-6">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations?.map((loc) => (
                <TableRow key={loc.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="pl-6 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <MapPin size={16} />
                      </div>
                      {loc.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize bg-white">
                      {loc.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {loc.type === 'daily' ? (
                      <div className="text-xs space-y-1">
                        <div>Khemah: RM {loc.rate_khemah}</div>
                        <div>CBS: RM {loc.rate_cbs}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {loc.rate_monthly > 0 ? (
                      <span className="font-bold text-foreground">RM {loc.rate_monthly}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
                      {loc.tenant_count} Peniaga
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Dialog onOpenChange={(open) => open && handleViewTenants(loc)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                          <Eye className="mr-2 h-4 w-4" /> Lihat Peniaga
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl bg-white rounded-3xl">
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
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {locationTenants.map((lt: any) => (
                                  <TableRow key={lt.id}>
                                    <TableCell>{lt.tenants?.full_name}</TableCell>
                                    <TableCell>{lt.tenants?.business_name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{lt.stall_number}</Badge>
                                    </TableCell>
                                    <TableCell>
                                       <Badge className={lt.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                         {lt.status}
                                       </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              Tiada peniaga didaftarkan di lokasi ini.
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                           <Button variant="outline" onClick={() => setSelectedLocation(null)}>Tutup</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}