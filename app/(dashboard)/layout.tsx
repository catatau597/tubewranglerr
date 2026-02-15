'use client'

import Link from "next/link"
import {
  Bell,
  Home,
  Settings,
  Youtube,
  ListVideo,
  FileText,
  Palette,
  Tv,
  LayoutDashboard,
  Radio,
  PlaySquare,
  Key as KeyIcon
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePathname } from "next/navigation"
import { Toaster } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <>
    <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Tv className="h-6 w-6 text-red-600" />
              <span className="">TubeWranglerr</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                href="/"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/' ? 'bg-muted text-primary' : ''}`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/channels"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.startsWith('/channels') ? 'bg-muted text-primary' : ''}`}
              >
                <Radio className="h-4 w-4" />
                Canais
              </Link>
              <Link
                href="/events"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.startsWith('/events') ? 'bg-muted text-primary' : ''}`}
              >
                <ListVideo className="h-4 w-4" />
                Eventos
              </Link>
              <Link
                href="/playlists"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.startsWith('/playlists') ? 'bg-muted text-primary' : ''}`}
              >
                <PlaySquare className="h-4 w-4" />
                Playlists
              </Link>
              <Link
                href="/settings"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.startsWith('/settings') ? 'bg-muted text-primary' : ''}`}
              >
                <Settings className="h-4 w-4" />
                Configurações
              </Link>
              
              {/* Sub-menu de Configurações */}
              {pathname.startsWith('/settings') && (
                <nav className="ml-4 mt-2 flex flex-col items-start gap-1 text-sm font-medium">
                  <Link
                    href="/settings/api"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/api' ? 'bg-muted text-primary' : ''}`}
                  >
                    <KeyIcon className="h-4 w-4" />
                    API & Credenciais
                  </Link>
                  <Link
                    href="/settings/scheduler"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/scheduler' ? 'bg-muted text-primary' : ''}`}
                  >
                    <Bell className="h-4 w-4" />
                    Agendador
                  </Link>
                  <Link
                    href="/settings/filters"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/filters' ? 'bg-muted text-primary' : ''}`}
                  >
                    <ListVideo className="h-4 w-4" />
                    Conteúdo & Filtros
                  </Link>
                  <Link
                    href="/settings/title-format"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/title-format' ? 'bg-muted text-primary' : ''}`}
                  >
                    <Palette className="h-4 w-4" />
                    Formato de Título
                  </Link>
                  <Link
                    href="/settings/retention"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/retention' ? 'bg-muted text-primary' : ''}`}
                  >
                    <FileText className="h-4 w-4" />
                    Retenção (VOD)
                  </Link>
                  <Link
                    href="/settings/output"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/output' ? 'bg-muted text-primary' : ''}`}
                  >
                    <PlaySquare className="h-4 w-4" />
                    Arquivos de Saída
                  </Link>
                  <Link
                    href="/settings/media"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/media' ? 'bg-muted text-primary' : ''}`}
                  >
                    <Youtube className="h-4 w-4" />
                    Mídia & Placeholders
                  </Link>
                </nav>
              )}
            </nav>
          </div>
        </div>
      </aside>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
           {/* Header content pode vir aqui no futuro, como busca ou perfil do usuário */}
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
            {children}
        </main>
      </div>
    </div>
    <Toaster richColors position="bottom-right" />
    </>
  );
}
