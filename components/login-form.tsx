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
     // Optional: For testing, you might want a quick signup, 
     // but usually you'd want a separate page or admin-only invite.
     // For now, let's keep it simple.
     toast.info("Sila hubungi admin untuk pendaftaran akaun.")
  }

  return (
    <Card className="w-full max-w-md bg-cream-50 border-olive-200 shadow-xl">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-3xl font-serif font-bold text-olive-900">Permit Akaun</CardTitle>
        <CardDescription className="text-olive-700/70">Selamat datang kembali. Sila log masuk.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Emel</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@contoh.com"
              className="border-olive-200 focus:ring-olive-500 bg-white/50"
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
              className="border-olive-200 focus:ring-olive-500 bg-white/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <Button 
          onClick={handleLogin} 
          disabled={loading}
          className="w-full bg-olive-600 hover:bg-olive-700 text-white font-medium h-12 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm transition-all"
        >
          {loading ? "Sedang Memproses..." : "Log Masuk"}
        </Button>
        <div className="text-center space-y-2">
          <button className="text-sm text-olive-600 hover:underline block w-full">Lupa kata laluan?</button>
          <button onClick={handleSignUp} className="text-xs text-muted-foreground hover:text-olive-600">Belum ada akaun?</button>
        </div>
      </CardContent>
    </Card>
  )
}