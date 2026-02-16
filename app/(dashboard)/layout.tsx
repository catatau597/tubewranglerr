'use client'

import React, { useEffect, useRef, useState } from 'react';
import Link from "next/link"
import {
  Bell,
  Settings,
  Youtube,
  ListVideo,
  FileText,
  Palette,
  Tv,
  LayoutDashboard,
  Radio,
  PlaySquare,
  Key as KeyIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Server,
  Shuffle,
  Bug,
} from 'lucide-react'
import { Toaster } from 'sonner';
import { usePathname } from "next/navigation"

const SIDEBAR_MIN = 220;
const SIDEBAR_MAX = 420;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(280);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing || isSidebarCollapsed) return;
      const delta = e.clientX - resizeStartX.current;
      const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, resizeStartWidth.current + delta));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing, isSidebarCollapsed]);

  const startResizing = (e: React.MouseEvent) => {
    if (isSidebarCollapsed) return;
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <>
      <div className="flex h-screen w-full transition-all duration-150">
        <aside 
          className="hidden shrink-0 border-r bg-muted/40 md:block transition-[width] duration-300 ease-in-out"
          style={{ width: isSidebarCollapsed ? 80 : sidebarWidth }}
        >
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Tv className="h-6 w-6 text-red-600" />
                {!isSidebarCollapsed && <span className="transition-opacity duration-300">TubeWranglerr</span>}
              </Link>
            </div>
            <div className="flex-1 overflow-auto">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                <Link href="/" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/' ? 'bg-muted text-primary' : ''}`}>
                  <LayoutDashboard className="h-4 w-4" />
                  {!isSidebarCollapsed && 'Dashboard'}
                </Link>
                <Link href="/channels" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.startsWith('/channels') ? 'bg-muted text-primary' : ''}`}>
                  <Radio className="h-4 w-4" />
                  {!isSidebarCollapsed && 'Canais'}
                </Link>
                <Link href="/events" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.startsWith('/events') ? 'bg-muted text-primary' : ''}`}>
                  <ListVideo className="h-4 w-4" />
                  {!isSidebarCollapsed && 'Eventos'}
                </Link>
                <Link href="/playlists" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.startsWith('/playlists') ? 'bg-muted text-primary' : ''}`}>
                  <PlaySquare className="h-4 w-4" />
                  {!isSidebarCollapsed && 'Playlists'}
                </Link>
                <Link href="/settings" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.startsWith('/settings') ? 'bg-muted text-primary' : ''}`}>
                  <Settings className="h-4 w-4" />
                  {!isSidebarCollapsed && 'Configurações'}
                </Link>

                {pathname.startsWith('/settings') && (
                  <nav className="ml-4 mt-2 flex flex-col items-start gap-1 text-sm font-medium">
                    <Link href="/settings/api" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/api' ? 'bg-muted text-primary' : ''}`}>
                      <KeyIcon className="h-4 w-4" />
                      {!isSidebarCollapsed && 'API & Canais'}
                    </Link>
                    <Link href="/settings/scheduler" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/scheduler' ? 'bg-muted text-primary' : ''}`}>
                      <Bell className="h-4 w-4" />
                      {!isSidebarCollapsed && 'Agendador'}
                    </Link>
                    <Link href="/settings/filters" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/filters' ? 'bg-muted text-primary' : ''}`}>
                      <ListVideo className="h-4 w-4" />
                      {!isSidebarCollapsed && 'Conteúdo & Filtros'}
                    </Link>
                    <Link href="/settings/mappings" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/mappings' ? 'bg-muted text-primary' : ''}`}>
                      <Shuffle className="h-4 w-4" />
                      {!isSidebarCollapsed && 'Mapeamentos'}
                    </Link>
                    <Link href="/settings/title-format" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/title-format' ? 'bg-muted text-primary' : ''}`}>
                      <Palette className="h-4 w-4" />
                      {!isSidebarCollapsed && 'Formato de Título'}
                    </Link>
                    <Link href="/settings/retention" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/retention' ? 'bg-muted text-primary' : ''}`}>
                      <FileText className="h-4 w-4" />
                      {!isSidebarCollapsed && 'Retenção (VOD)'}
                    </Link>
                    <Link href="/settings/output" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/output' ? 'bg-muted text-primary' : ''}`}>
                      <PlaySquare className="h-4 w-4" />
                      {!isSidebarCollapsed && 'Arquivos de Saída'}
                    </Link>
                    <Link href="/settings/media" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/media' ? 'bg-muted text-primary' : ''}`}>
                      <Youtube className="h-4 w-4" />
                      {!isSidebarCollapsed && 'Mídia & Placeholders'}
                    </Link>
                    <Link href="/settings/system" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/system' ? 'bg-muted text-primary' : ''}`}>
                      <Server className="h-4 w-4" />
                      {!isSidebarCollapsed && 'Técnico'}
                    </Link>
                    <Link href="/settings/logs" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname === '/settings/logs' ? 'bg-muted text-primary' : ''}`}>
                      <Bug className="h-4 w-4" />
                      {!isSidebarCollapsed && 'Logs'}
                    </Link>
                  </nav>
                )}
              </nav>
            </div>
          </div>
        </aside>

        <div className="relative hidden w-1 cursor-col-resize hover:bg-primary/30 md:block" onMouseDown={startResizing} />

        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:block p-2 text-muted-foreground hover:text-primary"
              aria-label="Toggle sidebar"
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">{children}</main>
        </div>
      </div>
      <Toaster richColors position="bottom-right" />
    </>
  );
}
