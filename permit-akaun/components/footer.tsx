export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-border/50 py-16 mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center text-center md:text-left">
          <div className="space-y-4">
            <span className="font-serif font-bold text-2xl text-primary italic tracking-tight">Permit Akaun</span>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Solusi moden pengurusan permit pasar, Uptown, dan rekod kewangan perniagaan secara telus.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm font-semibold text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Terma & Syarat
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Dasar Privasi
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Bantuan Sistem
            </a>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest opacity-60">
              © 2025 PERMIT AKAUN v2.1
            </p>
            <p className="text-muted-foreground text-[10px] font-semibold italic">
              Designed for efficiency and transparency
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
