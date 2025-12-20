"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Sila masukkan emel dan kata laluan")
      return
    }

    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Berjaya log masuk!")
        router.push("/dashboard")
      }
    } catch (err) {
      toast.error("Ralat tidak dijangka berlaku")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
     toast.info("Sila hubungi admin untuk pendaftaran akaun.")
  }

  return (
    <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-primary/20 shadow-xl">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-3xl font-serif font-bold text-primary">Permit Akaun</CardTitle>
        <CardDescription className="text-muted-foreground">Selamat datang kembali. Sila log masuk.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Emel</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@contoh.com"
              className="border-primary/20 focus:ring-primary/50 bg-white/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Kata Laluan</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="border-primary/20 focus:ring-primary/50 bg-white/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <Button 
          onClick={handleLogin} 
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-12 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm transition-all shadow-lg shadow-primary/20"
        >
          {loading ? "Sedang Memproses..." : "Log Masuk"}
        </Button>
        <div className="text-center space-y-2">
          <button className="text-sm text-primary hover:underline block w-full">Lupa kata laluan?</button>
          <button onClick={handleSignUp} className="text-xs text-muted-foreground hover:text-primary">Belum ada akaun?</button>
        </div>
      </CardContent>
    </Card>
  )
}
