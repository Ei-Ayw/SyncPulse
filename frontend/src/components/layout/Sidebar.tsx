import { Link, useLocation } from 'react-router-dom';
import { Home, GitBranchPlus, Settings, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function Sidebar() {
    const location = useLocation();

    const navItems = [
        { name: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
        { name: 'Repositories', path: '/repositories', icon: <div className="p-1 bg-blue-600 rounded-lg shadow-[0_0_10px_rgba(59,130,246,0.5)]"><GitBranchPlus className="w-5 h-5 text-white" /></div> },
        { name: 'History', path: '/history', icon: <History className="w-5 h-5" /> },
        { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
    ];

    return (
        <aside className="w-24 bg-[#0a0a0c] border-r border-white/5 flex flex-col items-center py-8 sticky top-0 h-screen z-50">
            <div className="mb-12">
                <div className="text-xl font-bold bg-gradient-to-br from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    SH
                </div>
            </div>

            <nav className="flex-1 flex flex-col gap-8">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path} title={item.name} className="relative group">
                            <div className={cn(
                                "p-3 rounded-2xl transition-all duration-300 flex items-center justify-center",
                                isActive
                                    ? "bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}>
                                {typeof item.icon === 'object' && 'type' in item.icon && (item.icon as any).type === 'div' ? item.icon : item.icon}
                            </div>
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active-indicator"
                                    className="absolute -right-12 w-1 h-8 bg-blue-500 rounded-full blur-[2px]"
                                />
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-auto">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-400 transition-transform hover:scale-110 cursor-pointer">
                    JS
                </div>
            </div>
        </aside>
    );
}
