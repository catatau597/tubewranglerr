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
  PlaySquare
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
    <div className="grid h-screen w-full pl-[56px]">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="#"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Tv className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">TubeWranglerr</span>
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${pathname === '/' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'} transition-colors hover:text-foreground md:h-8 md:w-8`}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span className="sr-only">Dashboard</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Dashboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/channels"
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${pathname.startsWith('/channels') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'} transition-colors hover:text-foreground md:h-8 md:w-8`}
                >
                  <Radio className="h-5 w-5" />
                  <span className="sr-only">Canais</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Canais</TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/events"
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${pathname.startsWith('/events') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'} transition-colors hover:text-foreground md:h-8 md:w-8`}
                >
                  <ListVideo className="h-5 w-5" />
                  <span className="sr-only">Eventos</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Eventos</TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/playlists"
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${pathname.startsWith('/playlists') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'} transition-colors hover:text-foreground md:h-8 md:w-8`}
                >
                  <PlaySquare className="h-5 w-5" />
                  <span className="sr-only">Playlists</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Playlists</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/settings"
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${pathname.startsWith('/settings') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}  transition-colors hover:text-foreground md:h-8 md:w-8`}
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Configurações</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Configurações</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Sub-menu de Configurações */}
          {pathname.startsWith('/settings') && (
          <nav className="mt-2 flex flex-col items-start gap-1 px-2 text-sm font-medium">
              <Link
                  href="/settings"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings' ? 'bg-muted text-primary' : ''}`}
              >
                  <Settings className="h-4 w-4" />
                  Geral
              </Link>
              <Link
                  href="/settings/title-format"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/title-format' ? 'bg-muted text-primary' : ''}`}
              >
                  <Palette className="h-4 w-4" />
                  Formato de Título
              </Link>
          </nav>
          )}
        </nav>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        </header>
        <main className="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-1">
            {children}
        </main>
      </div>
    </div>
    <Toaster richColors position="bottom-right" />
    </>
  );
}
