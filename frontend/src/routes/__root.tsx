import { Outlet, createRootRoute, Link } from '@tanstack/react-router'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { useAuth } from '@/AuthContext'
import { Shield } from 'lucide-react'
import { motion } from 'framer-motion'

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    const { user } = useAuth()

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground dark">
            {/* Floating sticky navbar wrapper */}
            <div className="sticky top-0 z-50 pt-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <Navbar />
                    {/* Separate admin badge — positioned to the right of the main header */}
                    {user?.role === "admin" && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+12px)] hidden xl:block"
                        >
                            <Link
                                to="/admin"
                                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-card/80 backdrop-blur-xl px-4 h-16 text-sm font-medium text-red-400 hover:text-red-300 hover:border-red-500/50 transition-all shadow-lg"
                            >
                                <Shield className="h-4 w-4" />
                                Панель администратора
                            </Link>
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
