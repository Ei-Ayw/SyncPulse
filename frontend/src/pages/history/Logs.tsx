import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { CheckCircle2, XCircle, Clock, RefreshCw, Github, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SyncLog {
    id: number;
    github_repo_url: string;
    gitee_repo_url: string;
    status: 'pending' | 'syncing' | 'completed' | 'failed';
    error_message: string | null;
    created_at: string;
    updated_at: string | null;
}

const GiteeIcon = ({ className }: { className?: string }) => (
    <div className={cn("bg-[#c71d23] rounded-[4px] flex items-center justify-center p-0.5", className)}>
        <svg viewBox="0 0 24 24" className="w-full h-full text-white fill-current">
            <path d="M11.977 24c6.626 0 11.998-5.372 11.998-12S18.604 0 11.977 0C5.352 0 .002 5.372.002 12s5.35 12 11.975 12zM6.166 6.848h11.621v2.105H8.381v2.105h9.406v2.105H8.381v2.105h9.406v2.105H6.166V6.848z" />
        </svg>
    </div>
);

export default function SyncLogs() {
    const { userId } = useAuthStore();
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchLogs();
    }, [userId, statusFilter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const queryParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
            const res = await axios.get(`http://localhost:8000/api/v1/logs/${userId}${queryParam}`);
            setLogs(res.data);
        } catch (error) {
            console.error("Failed to fetch sync logs", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'completed': return { icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
            case 'failed': return { icon: <XCircle className="w-5 h-5 text-rose-400" />, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" };
            case 'syncing': return { icon: <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
            default: return { icon: <Clock className="w-5 h-5 text-amber-400" />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
        }
    };

    const extractRepoName = (url: string) => {
        try {
            return url.split('/').slice(-1)[0].replace('.git', '');
        } catch {
            return url;
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } }
    };

    return (
        <div className="max-w-5xl mx-auto pb-16">
            <header className="mb-12 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Sync History</h1>
                    <p className="text-white/40 font-medium font-bold uppercase tracking-widest text-[10px]">Review all repository synchronization logs</p>
                </div>

                <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl gap-1">
                    {['all', 'completed', 'failed', 'syncing'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-xs font-bold capitalize transition-all",
                                statusFilter === status
                                    ? "bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </header>

            {loading && logs.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-[400px] bg-[#0f0f12]/50 border border-white/5 rounded-[2.5rem] backdrop-blur-xl">
                    <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
            ) : logs.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-[400px] bg-[#0f0f12]/50 border border-white/5 rounded-[2.5rem] backdrop-blur-xl opacity-40">
                    <Clock className="w-14 h-14 text-white/20 mb-6" />
                    <p className="text-xl font-bold text-white tracking-tight">No history found</p>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-4"
                >
                    <AnimatePresence mode="popLayout">
                        {logs.map((log) => {
                            const statusInfo = getStatusInfo(log.status);
                            return (
                                <motion.div
                                    key={log.id}
                                    variants={itemVariants}
                                    layout
                                    className="group relative bg-[#0f0f12]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 hover:bg-[#141417] hover:border-white/10 transition-all duration-300 overflow-hidden"
                                >
                                    <div className="flex items-center justify-between gap-8 relative z-10">
                                        <div className="flex items-center gap-6 flex-1 min-w-0">
                                            <div className={cn("p-4 rounded-2xl flex items-center justify-center shadow-lg", statusInfo.bg, statusInfo.border)}>
                                                {statusInfo.icon}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Github className="w-4 h-4 text-white/40" />
                                                    <span className="text-lg font-bold text-white tracking-tight uppercase group-hover:text-blue-400 transition-colors">
                                                        {extractRepoName(log.github_repo_url)}
                                                    </span>
                                                    <div className="w-1.5 h-px bg-white/20" />
                                                    <GiteeIcon className="w-4 h-4" />
                                                </div>

                                                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white/20">
                                                    <span>{new Date(log.created_at).toLocaleString()}</span>
                                                    {log.error_message && (
                                                        <span className="text-rose-500/80 normal-case tracking-normal truncate max-w-[300px]">
                                                            ERR: {log.error_message}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform">
                                            <span className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                                statusInfo.color, statusInfo.bg, statusInfo.border
                                            )}>
                                                {log.status}
                                            </span>
                                            <button
                                                onClick={() => window.open(log.gitee_repo_url, '_blank')}
                                                className="text-white/20 hover:text-white transition-colors p-2"
                                            >
                                                <GitBranch className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Subtle Gradient Backlight */}
                                    <div className={cn(
                                        "absolute top-0 right-0 w-64 h-64 blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none rounded-full",
                                        log.status === 'completed' ? "bg-emerald-500" : log.status === 'failed' ? "bg-rose-500" : "bg-blue-500"
                                    )} />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
