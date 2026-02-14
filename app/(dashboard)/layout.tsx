import Link from "next/link"
import { LayoutDashboard, Radio, Settings, Tv } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-full flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r bg-gray-100/40 p-4 dark:bg-gray-800/40">
        <div className="flex h-full flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link className="flex items-center gap-2 font-semibold" href="/">
              <Tv className="h-6 w-6 text-red-600" />
              <span className="">TubeWranglerr</span>
            </Link>
          </div>
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <Link
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              href="/"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              href="/channels"
            >
              <Radio className="h-4 w-4" />
              Canais
            </Link>
            <Link
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
              href="/settings"
            >
              <Settings className="h-4 w-4" />
              Configurações
            </Link>
          </nav>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
