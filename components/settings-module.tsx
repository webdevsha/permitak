"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function SettingsModule() {
  const handleSave = () => {
    toast.success("Tetapan berjaya disimpan")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-bold text-foreground leading-tight">Tetapan Sistem</h2>
        <p className="text-muted-foreground text-lg">Urus profil dan konfigurasi akaun anda</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card className="bg-white border-border/50 shadow-sm rounded-[1.5rem] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-olive-900 font-serif">Profil Pengguna</CardTitle>
            <CardDescription>Maklumat peribadi anda di dalam sistem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Nama Penuh</Label>
              <Input placeholder="Nama anda" className="border-olive-200" />
            </div>
            <div className="grid gap-2">
              <Label>Alamat Emel</Label>
              <Input type="email" placeholder="emel@contoh.com" className="border-olive-200" />
            </div>
            <div className="pt-2">
              <Button onClick={handleSave} className="bg-olive-600 hover:bg-olive-700 text-white">
                Simpan Profil
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border/50 shadow-sm rounded-[1.5rem] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-olive-900 font-serif">Keselamatan</CardTitle>
            <CardDescription>Tukar kata laluan anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Kata Laluan Semasa</Label>
              <Input type="password" underline="false" className="border-olive-200" />
            </div>
            <div className="grid gap-2">
              <Label>Kata Laluan Baru</Label>
              <Input type="password" underline="false" className="border-olive-200" />
            </div>
            <div className="pt-2">
              <Button onClick={handleSave} variant="outline" className="border-olive-200 text-olive-700 bg-transparent">
                Tukar Kata Laluan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
