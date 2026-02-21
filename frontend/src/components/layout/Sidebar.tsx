import { Link, useLocation } from 'react-router-dom';
import { Home, GitBranchPlus, Settings, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function Sidebar() {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: <Home className="w-[18px] h-[18px]" /> },
        { name: 'Repositories', path: '/repositories', icon: <GitBranchPlus className="w-[18px] h-[18px]" /> },
        { name: 'History', path: '/history', icon: <History className="w-[18px] h-[18px]" /> },
        { name: 'Settings', path: '/settings', icon: <Settings className="w-[18px] h-[18px]" /> },
    ];

    return (
        <aside className="w-72 bg-white/70 backdrop-blur-3xl border-r border-slate-200/60 flex flex-col min-h-screen sticky top-0">
            <div className="p-8 pb-4">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 shadow-md flex items-center justify-center text-white">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                    </div>
                    SyncHub
                </h1>
            </div>

            <div className="px-5 flex-1 pt-6 space-y-1.5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-3 pb-2">Menu</h3>
                <nav className="space-y-1 relative">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;

                        return (
                            <Link key={item.path} to={item.path} className="relative block">
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 bg-slate-100 rounded-xl"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                    />
                                )}
                                <div className={cn(
                                    "relative flex items-center px-3 py-2.5 rounded-xl transition-colors duration-200",
                                    isActive ? "text-slate-900 font-semibold" : "text-slate-500 font-medium hover:text-slate-800 hover:bg-slate-50/80"
                                )}>
                                    <div className={cn("mr-3 p-1.5 rounded-lg transition-colors", isActive ? "bg-white shadow-sm ring-1 ring-slate-900/5" : "")}>
                                        {item.icon}
                                    </div>
                                    {item.name}
                                </div>
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="p-6">
                <div className="p-4 bg-slate-50 border border-slate-100/80 rounded-2xl flex items-center gap-3 hover:border-slate-200 transition-colors shadow-sm cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center border border-white shadow-sm">
                        <span className="text-slate-600 font-bold text-sm">ME</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">Workspace</p>
                        <p className="text-xs text-slate-500 font-medium">Free Plan</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
