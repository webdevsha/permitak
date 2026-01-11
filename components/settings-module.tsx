"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { Loader2, Upload, FileText, Check } from "lucide-react"
import Image from "next/image"

export function SettingsModule() {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    phone: "",
    ssmNumber: "",
    icNumber: "",
    address: ""
  })
  
  const [files, setFiles] = useState<{
    profile?: File,
    ssm?: File,
    ic?: File
  }>({})
  
  const [urls, setUrls] = useState({
    profile: "",
    ssm: "",
    ic: ""
  })

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return
      
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle()
        
      if (data) {
        setTenantId(data.id)
        setFormData({
          fullName: data.full_name || "",
          businessName: data.business_name || "",
          phone: data.phone_number || "",
          ssmNumber: data.ssm_number || "",
          icNumber: data.ic_number || "",
          address: data.address || ""
        })
        setUrls({
          profile: data.profile_image_url || "",
          ssm: data.ssm_file_url || "",
          ic: data.ic_file_url || ""
        })
      }
      setLoading(false)
    }
    
    fetchProfile()
  }, [user, supabase])

  const handleFileUpload = async (file: File, prefix: string) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${prefix}-${user?.id}-${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('tenant-docs')
      .upload(fileName, file)

    if (uploadError) throw uploadError
    
    const { data: { publicUrl } } = supabase.storage
      .from('tenant-docs')
      .getPublicUrl(fileName)
      
    return publicUrl
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let newUrls = { ...urls }
      
      // Upload files if new ones selected
      if (files.profile) newUrls.profile = await handleFileUpload(files.profile, 'profile')
      if (files.ssm) newUrls.ssm = await handleFileUpload(files.ssm, 'ssm')
      if (files.ic) newUrls.ic = await handleFileUpload(files.ic, 'ic')
      
      // Update Database
      const updateData = {
        full_name: formData.fullName,
        business_name: formData.businessName,
        phone_number: formData.phone,
        ssm_number: formData.ssmNumber,
        ic_number: formData.icNumber,
        address: formData.address,
        profile_image_url: newUrls.profile,
        ssm_file_url: newUrls.ssm,
        ic_file_url: newUrls.ic
      }
      
      const { error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', tenantId)
        
      if (error) throw error
      
      setUrls(newUrls)
      setFiles({}) // Reset file inputs
      toast.success("Profil berjaya dikemaskini")
      
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-bold text-foreground leading-tight">Tetapan & Profil</h2>
        <p className="text-muted-foreground text-lg">Lengkapkan maklumat perniagaan anda</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl">
        
        {/* Main Info */}
        <Card className="bg-white border-border/50 shadow-sm rounded-[1.5rem] overflow-hidden lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-primary font-serif">Maklumat Perniagaan</CardTitle>
            <CardDescription>Butiran rasmi untuk rekod sewaan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Nama Penuh (Seperti IC)</Label>
                 <Input 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="border-border bg-secondary/10" 
                 />
               </div>
               <div className="space-y-2">
                 <Label>No. Kad Pengenalan</Label>
                 <Input 
                    value={formData.icNumber}
                    onChange={(e) => setFormData({...formData, icNumber: e.target.value})}
                    placeholder="Contoh: 880101-14-1234"
                    className="border-border bg-secondary/10" 
                 />
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Nama Perniagaan / Syarikat</Label>
                 <Input 
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    className="border-border bg-secondary/10" 
                 />
               </div>
               <div className="space-y-2">
                 <Label>No. Pendaftaran SSM</Label>
                 <Input 
                    value={formData.ssmNumber}
                    onChange={(e) => setFormData({...formData, ssmNumber: e.target.value})}
                    placeholder="Contoh: 202401001234"
                    className="border-border bg-secondary/10" 
                 />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>No. Telefon</Label>
                 <Input 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="border-border bg-secondary/10" 
                 />
               </div>
               <div className="space-y-2">
                 <Label>Alamat Surat Menyurat</Label>
                 <Input 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="border-border bg-secondary/10" 
                 />
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents & Photo */}
        <div className="space-y-6">
           {/* Profile Photo */}
           <Card className="bg-white border-border/50 shadow-sm rounded-[1.5rem] overflow-hidden">
             <CardHeader className="pb-2">
               <CardTitle className="text-primary font-serif text-lg">Gambar Profil</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex flex-col items-center gap-4">
                 <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center group cursor-pointer">
                    {files.profile ? (
                       <Image src={URL.createObjectURL(files.profile)} alt="Preview" fill className="object-cover" />
                    ) : urls.profile ? (
                       <Image src={urls.profile} alt="Current" fill className="object-cover" />
                    ) : (
                       <Upload className="text-muted-foreground" />
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => e.target.files && setFiles({...files, profile: e.target.files[0]})}
                    />
                 </div>
                 <p className="text-xs text-muted-foreground text-center">Klik untuk muat naik gambar berukuran pasport</p>
               </div>
             </CardContent>
           </Card>

           {/* Documents */}
           <Card className="bg-white border-border/50 shadow-sm rounded-[1.5rem] overflow-hidden">
             <CardHeader className="pb-2">
               <CardTitle className="text-primary font-serif text-lg">Dokumen Sokongan</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label className="text-xs">Sijil SSM (PDF/Gambar)</Label>
                 <div className="flex gap-2">
                    <Input 
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => e.target.files && setFiles({...files, ssm: e.target.files[0]})}
                      className="text-xs h-9"
                    />
                    {urls.ssm && (
                       <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => window.open(urls.ssm, '_blank')}>
                          <FileText size={14} />
                       </Button>
                    )}
                 </div>
               </div>
               <div className="space-y-2">
                 <Label className="text-xs">Salinan Kad Pengenalan (Depan/Belakang)</Label>
                 <div className="flex gap-2">
                    <Input 
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => e.target.files && setFiles({...files, ic: e.target.files[0]})}
                      className="text-xs h-9"
                    />
                    {urls.ic && (
                       <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => window.open(urls.ic, '_blank')}>
                          <FileText size={14} />
                       </Button>
                    )}
                 </div>
               </div>
             </CardContent>
           </Card>
        </div>

      </div>

      <div className="flex justify-end pt-4 pb-12 max-w-5xl">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-8 h-12 text-md font-bold shadow-lg shadow-primary/20"
        >
          {saving ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2 h-5 w-5" />}
          Simpan Semua Perubahan
        </Button>
      </div>
    </div>
  )
}
