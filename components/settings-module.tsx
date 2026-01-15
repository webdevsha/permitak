"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { Loader2, Upload, FileText, Check, Database, Download, Trash2, RefreshCw, Shield, HardDrive, Pencil, X } from "lucide-react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Helper component defined outside to prevent re-renders causing focus loss
const DataField = ({ 
  label, 
  value, 
  field, 
  placeholder, 
  isEditing, 
  onChange 
}: { 
  label: string, 
  value: string, 
  field: string, 
  placeholder?: string, 
  isEditing: boolean, 
  onChange: (field: string, val: string) => void 
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {isEditing ? (
      <Input 
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="border-border bg-white" 
        placeholder={placeholder}
      />
    ) : (
      <div className="p-3 bg-secondary/10 rounded-xl border border-transparent font-medium min-h-[2.75rem] flex items-center text-sm">
        {value || <span className="text-muted-foreground italic text-xs">Belum ditetapkan</span>}
      </div>
    )}
  </div>
)

export function SettingsModule() {
  const { user, role } = useAuth()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState<number | null>(null)
  
  // UI State
  const [isEditing, setIsEditing] = useState(false)
  
  // Profile State
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

  // Backup State
  const [backups, setBackups] = useState<any[]>([])
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)

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
    if (role === 'admin') {
      fetchBackups()
    }
  }, [user, supabase, role])

  const fetchBackups = async () => {
    setLoadingBackups(true)
    const { data, error } = await supabase.storage.from('backups').list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    })
    
    if (!error && data) {
      setBackups(data)
    }
    setLoadingBackups(false)
  }

  const handleCreateBackup = async () => {
    setCreatingBackup(true)
    try {
      const { data, error } = await supabase.functions.invoke('system-backup')
      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)
      
      toast.success("Backup berjaya dicipta!")
      fetchBackups()
    } catch (e: any) {
      toast.error("Gagal backup: " + e.message)
    } finally {
      setCreatingBackup(false)
    }
  }

  const handleDownloadBackup = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('backups').download(fileName)
      if (error) throw error
      
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error("Gagal muat turun: " + e.message)
    }
  }

  const handleDeleteBackup = async (fileName: string) => {
    if (!confirm("Adakah anda pasti mahu memadam backup ini?")) return
    
    try {
      const { error } = await supabase.storage.from('backups').remove([fileName])
      if (error) throw error
      
      toast.success("Backup dipadam")
      setBackups(prev => prev.filter(b => b.name !== fileName))
    } catch (e: any) {
      toast.error("Gagal padam: " + e.message)
    }
  }

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

  const handleSaveProfile = async () => {
    if (!tenantId) {
      toast.error("Ralat: Rekod pengguna tidak dijumpai")
      return
    }

    setSaving(true)
    try {
      let newUrls = { ...urls }
      
      // Upload files if new ones selected
      if (files.profile) newUrls.profile = await handleFileUpload(files.profile, 'profile')
      if (files.ssm) newUrls.ssm = await handleFileUpload(files.ssm, 'ssm')
      if (files.ic) newUrls.ic = await handleFileUpload(files.ic, 'ic')
      
      // Prepare Update Data
      // IMPORTANT: Send null instead of empty string for optional fields to satisfy DB types
      const updateData = {
        full_name: formData.fullName,
        business_name: formData.businessName || null,
        phone_number: formData.phone || null,
        ssm_number: formData.ssmNumber || null,
        ic_number: formData.icNumber || null,
        address: formData.address || null,
        profile_image_url: newUrls.profile || null,
        ssm_file_url: newUrls.ssm || null,
        ic_file_url: newUrls.ic || null
      }
      
      const { error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', tenantId)
        
      if (error) throw error
      
      setUrls(newUrls)
      setFiles({}) // Reset file inputs
      setIsEditing(false) // Switch back to read-only
      toast.success("Profil berjaya dikemaskini")
      
    } catch (err: any) {
      console.error(err)
      toast.error("Gagal menyimpan: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Handle Input Change for DataField
  const handleInputChange = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }))
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-serif font-bold text-foreground leading-tight">Tetapan</h2>
        <p className="text-muted-foreground text-lg">Urus profil dan konfigurasi sistem</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-white border border-border/50 p-1 rounded-xl mb-6">
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            <Shield className="w-4 h-4 mr-2" /> Profil Saya
          </TabsTrigger>
          {role === 'admin' && (
            <TabsTrigger value="backup" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <Database className="w-4 h-4 mr-2" /> Backup & Sistem
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="flex justify-between items-center max-w-5xl">
             <h3 className="text-xl font-bold">Maklumat Akaun</h3>
             {!isEditing ? (
               <Button onClick={() => setIsEditing(true)} className="rounded-xl shadow-sm">
                 <Pencil className="w-4 h-4 mr-2" /> Edit Profil
               </Button>
             ) : (
               <div className="flex gap-2">
                 <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl">
                   <X className="w-4 h-4 mr-2" /> Batal
                 </Button>
                 <Button 
                   onClick={handleSaveProfile} 
                   disabled={saving}
                   className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 font-bold shadow-lg shadow-primary/20"
                 >
                   {saving ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2 h-4 w-4" />}
                   Simpan
                 </Button>
               </div>
             )}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl">
            
            {/* Main Info */}
            <Card className="bg-white border-border/50 shadow-sm rounded-[1.5rem] overflow-hidden lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-primary font-serif">Maklumat Perniagaan</CardTitle>
                <CardDescription>Butiran rasmi untuk rekod sewaan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DataField label="Nama Penuh (Seperti IC)" value={formData.fullName} field="fullName" isEditing={isEditing} onChange={handleInputChange} />
                  <DataField label="No. Kad Pengenalan" value={formData.icNumber} field="icNumber" placeholder="Contoh: 880101-14-1234" isEditing={isEditing} onChange={handleInputChange} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DataField label="Nama Perniagaan / Syarikat" value={formData.businessName} field="businessName" isEditing={isEditing} onChange={handleInputChange} />
                  <DataField label="No. Pendaftaran SSM" value={formData.ssmNumber} field="ssmNumber" placeholder="Contoh: 202401001234" isEditing={isEditing} onChange={handleInputChange} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DataField label="No. Telefon" value={formData.phone} field="phone" isEditing={isEditing} onChange={handleInputChange} />
                  <DataField label="Alamat Surat Menyurat" value={formData.address} field="address" isEditing={isEditing} onChange={handleInputChange} />
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
                    <div className={`relative w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center group ${isEditing ? 'cursor-pointer hover:bg-secondary/50' : ''}`}>
                        {files.profile ? (
                          <Image src={URL.createObjectURL(files.profile)} alt="Preview" fill className="object-cover" />
                        ) : urls.profile ? (
                          <Image src={urls.profile} alt="Current" fill className="object-cover" />
                        ) : (
                          <Upload className="text-muted-foreground" />
                        )}
                        {isEditing && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Pencil className="text-white w-6 h-6" />
                          </div>
                        )}
                        {isEditing && (
                          <input 
                            type="file" 
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => e.target.files && setFiles({...files, profile: e.target.files[0]})}
                          />
                        )}
                    </div>
                    {isEditing && <p className="text-xs text-muted-foreground text-center">Klik untuk tukar gambar</p>}
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
                    <div className="flex gap-2 items-center">
                        {isEditing ? (
                           <Input 
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => e.target.files && setFiles({...files, ssm: e.target.files[0]})}
                            className="text-xs h-9"
                          />
                        ) : (
                          <div className="flex-1 p-2 bg-secondary/10 rounded-lg text-xs italic text-muted-foreground border">
                             {urls.ssm ? "Fail dimuat naik" : "Tiada fail"}
                          </div>
                        )}
                        
                        {urls.ssm && (
                          <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => window.open(urls.ssm, '_blank')}>
                              <FileText size={14} />
                          </Button>
                        )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Salinan Kad Pengenalan</Label>
                    <div className="flex gap-2 items-center">
                        {isEditing ? (
                          <Input 
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => e.target.files && setFiles({...files, ic: e.target.files[0]})}
                            className="text-xs h-9"
                          />
                        ) : (
                          <div className="flex-1 p-2 bg-secondary/10 rounded-lg text-xs italic text-muted-foreground border">
                             {urls.ic ? "Fail dimuat naik" : "Tiada fail"}
                          </div>
                        )}
                        
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
        </TabsContent>

        {role === 'admin' && (
          <TabsContent value="backup" className="space-y-6">
             <Card className="bg-white border-border/50 shadow-sm rounded-[1.5rem] overflow-hidden">
               <CardHeader className="bg-secondary/10 border-b border-border/30">
                 <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="font-serif text-2xl flex items-center gap-2">
                        <HardDrive className="text-primary w-6 h-6" /> Pangkalan Data Backup
                      </CardTitle>
                      <CardDescription>Urus salinan backup database sistem</CardDescription>
                    </div>
                    <Button 
                      onClick={handleCreateBackup} 
                      disabled={creatingBackup}
                      className="rounded-xl shadow-md"
                    >
                      {creatingBackup ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                      Create Backup Now
                    </Button>
                 </div>
               </CardHeader>
               <CardContent className="p-0">
                 {loadingBackups ? (
                   <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
                 ) : (
                   <Table>
                     <TableHeader className="bg-secondary/20">
                       <TableRow>
                         <TableHead className="pl-6">File Name</TableHead>
                         <TableHead>Size</TableHead>
                         <TableHead>Created At</TableHead>
                         <TableHead className="text-right pr-6">Actions</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {backups.length > 0 ? backups.map((file) => (
                         <TableRow key={file.id}>
                           <TableCell className="pl-6 font-medium flex items-center gap-2">
                             <FileText className="w-4 h-4 text-primary" />
                             {file.name}
                           </TableCell>
                           <TableCell className="font-mono text-xs text-muted-foreground">
                             {(file.metadata?.size / 1024).toFixed(2)} KB
                           </TableCell>
                           <TableCell className="text-xs text-muted-foreground">
                             {new Date(file.created_at).toLocaleString('ms-MY')}
                           </TableCell>
                           <TableCell className="text-right pr-6">
                             <div className="flex justify-end gap-2">
                               <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(file.name)}>
                                 <Download className="w-4 h-4" />
                               </Button>
                               <Button variant="destructive" size="sm" onClick={() => handleDeleteBackup(file.name)}>
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                             </div>
                           </TableCell>
                         </TableRow>
                       )) : (
                         <TableRow>
                           <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                             Tiada backup dijumpai. Sila cipta backup baru.
                           </TableCell>
                         </TableRow>
                       )}
                     </TableBody>
                   </Table>
                 )}
               </CardContent>
             </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
