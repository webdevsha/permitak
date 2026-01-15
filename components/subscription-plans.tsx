"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Lock, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function SubscriptionPlans() {
  const plans = [
    {
      name: "Asas (Basic)",
      price: "19",
      description: "Untuk peniaga kecil yang baru bermula",
      features: [
        "Rekod Jualan & Sewa Harian",
        "Resit Digital Tanpa Had",
        "Peringatan Sewa Automatik",
        "Simpanan Data Asas"
      ],
      popular: false,
      color: "bg-white",
      buttonVariant: "outline" as const
    },
    {
      name: "Standard",
      price: "39",
      description: "Pilihan terbaik untuk perniagaan berkembang",
      features: [
        "Semua Ciri Asas",
        "Laporan Kewangan Bulanan (PDF)",
        "Sokongan 2 Pengguna",
        "Analisis Untung Rugi",
        "Akses Modul Akaun Penuh"
      ],
      popular: true,
      color: "bg-primary text-primary-foreground",
      buttonVariant: "secondary" as const
    },
    {
      name: "Premium",
      price: "99",
      description: "Untuk syarikat atau francais",
      features: [
        "Semua Ciri Standard",
        "Pengguna Tanpa Had",
        "Integrasi Bank Automatik",
        "Sokongan Keutamaan 24/7",
        "Khidmat Nasihat Akaun"
      ],
      popular: false,
      color: "bg-white",
      buttonVariant: "default" as const
    }
  ]

  return (
    <div className="space-y-8 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-sm font-bold border border-amber-200">
          <Lock className="w-4 h-4" />
          <span>Akses Terhad</span>
        </div>
        <h2 className="text-4xl font-serif font-bold tracking-tight">Naik Taraf Akaun Anda</h2>
        <p className="text-xl text-muted-foreground">
          Modul Akaun Profesional dikhaskan untuk pengguna Premium. 
          Pilih pelan langganan untuk membuka akses penuh laporan kewangan dan analisis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto pt-6">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={`relative rounded-[2rem] border-2 flex flex-col ${
              plan.popular 
                ? "border-primary shadow-xl scale-105 z-10 " + plan.color
                : "border-border shadow-sm hover:shadow-md transition-shadow bg-white"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <Badge className="bg-amber-400 text-black hover:bg-amber-500 border-none px-4 py-1 text-xs uppercase font-bold tracking-widest shadow-sm">
                  <Star className="w-3 h-3 mr-1 fill-black" /> Paling Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-serif text-2xl">{plan.name}</CardTitle>
              <CardDescription className={plan.popular ? "text-primary-foreground/80" : ""}>
                {plan.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 space-y-6">
              <div className="text-center">
                <span className="text-5xl font-bold tracking-tight">RM{plan.price}</span>
                <span className={`text-sm font-medium ${plan.popular ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  /bulan
                </span>
              </div>
              
              <ul className="space-y-3 text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className={`rounded-full p-1 ${plan.popular ? "bg-white/20" : "bg-primary/10"}`}>
                      <Check className={`w-3 h-3 ${plan.popular ? "text-white" : "text-primary"}`} />
                    </div>
                    <span className={plan.popular ? "text-primary-foreground/90" : "text-foreground"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter>
              <Button 
                variant={plan.buttonVariant} 
                className="w-full h-12 rounded-xl font-bold text-md shadow-sm"
              >
                Langgan Sekarang
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="text-center pt-8">
         <p className="text-sm text-muted-foreground">
           Perlukan bantuan memilih? <a href="#" className="text-primary font-bold hover:underline">Hubungi Sokongan</a>
         </p>
      </div>
    </div>
  )
}