"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [statusText, setStatusText] = useState("Log Masuk")
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Sila masukkan emel dan kata laluan")
      return
    }

    setLoading(true)
    setStatusText("Sedang Memproses...")
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Login Error:", error)
        toast.error(error.message === "Invalid login credentials" ? "Emel atau kata laluan salah" : error.message)
        setLoading(false)
        setStatusText("Log Masuk")
      } else {
        setStatusText("Mengalihkan...")
        toast.success("Berjaya log masuk!")
        
        // Critical: Refresh router to sync server cookies before navigation
        router.refresh() 
        router.push("/dashboard")
      }
    } catch (err: any) {
      console.error("Unexpected Login Error:", err)
      toast.error("Ralat tidak dijangka: " + (err.message || "Sila cuba lagi"))
      setLoading(false)
      setStatusText("Log Masuk")
    }
  }

  const handleSignUp = async () => {
     toast.info("Sila hubungi admin untuk pendaftaran akaun.")
  }

  return (
    <Card className="w-full max-w-md bg-white border-border shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="text-center space-y-2 pt-10 pb-6 bg-secondary/20 border-b border-border/30">
        <div className="relative w-48 h-20 mx-auto mb-2">
           <Image 
             src="/logo.png" 
             alt="Permit Akaun" 
             fill 
             className="object-contain"
             priority
           />
        </div>
        <p className="text-muted-foreground font-medium">Sistem Pengurusan Permit & Akaun</p>
      </CardHeader>
      <CardContent className="space-y-6 p-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Emel</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@contoh.com"
              className="border-input focus:ring-primary/50 bg-white h-12 rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Kata Laluan</Label>
              <button 
                className="text-xs text-primary font-semibold hover:underline" 
                disabled={loading}
                onClick={() => toast.info("Sila hubungi admin untuk set semula kata laluan.")}
              >
                Lupa kata laluan?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="border-input focus:ring-primary/50 bg-white h-12 rounded-xl"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
        </div>
        
        <Button 
          onClick={handleLogin} 
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 text-md rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {statusText}
            </>
          ) : (
            "Log Masuk"
          )}
        </Button>
        
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">
            Belum ada akaun? <button onClick={handleSignUp} className="text-primary font-bold hover:underline">Hubungi Admin</button>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
