import { Outlet, createRootRoute, Link } from '@tanstack/react-router'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { NotFound } from '@/pages/NotFound'
import { useAuth } from '@/AuthContext'
import { Shield, Database } from 'lucide-react'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import TargetCursor from '@/components/TargetCursor'
import { usePreferences } from '@/PreferencesContext'

export const Route = createRootRoute({
    component: RootComponent,
    notFoundComponent: NotFound,
})

function RootComponent() {
    const { user } = useAuth()
    const { customCursor } = usePreferences()

    return (
        <div className={`min-h-screen flex flex-col bg-background text-foreground dark${customCursor ? ' custom-cursor-active' : ''}`}>
            {customCursor && <TargetCursor spinDuration={5} hideDefaultCursor parallaxOn hoverDuration={1} />}
            <Toaster position="bottom-right" theme="dark" richColors toastOptions={{ style: { background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)' } }} />
            {/* Floating sticky navbar wrapper */}
            <div className="sticky top-0 z-50 pt-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <Navbar />
                    {/* Admin badges — compact bar always below navbar */}
                    {(user?.role === "admin" || user?.role === "superadmin") && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="flex gap-2 mt-2 overflow-x-auto scrollbar-none"
                        >
                            <Link
                                to="/admin"
                                className="cursor-target flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-card/80 backdrop-blur-xl px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:border-red-500/50 transition-all shadow-lg whitespace-nowrap flex-shrink-0"
                            >
                                <Shield className="h-3.5 w-3.5" />
                                Панель администратора
                            </Link>
                            <a
                                href="http://localhost/aml"
                                className="cursor-target flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-card/80 backdrop-blur-xl px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 hover:border-blue-500/50 transition-all shadow-lg whitespace-nowrap flex-shrink-0"
                            >
                                <Database className="h-3.5 w-3.5" />
                                Управление БД (AML)
                            </a>
                        </motion.div>
                    )}
                </div>
            </div>
            <div className="flex-1">
                <Outlet />
            </div>
            <div className="pb-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Footer />
                </div>
            </div>
        </div>
    )
}
