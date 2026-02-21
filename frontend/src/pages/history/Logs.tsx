import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { Loader2, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SyncLog {
    id: number;
    github_repo_url: string;
    gitee_repo_url: string;
    status: 'pending' | 'syncing' | 'completed' | 'failed';
    error_message: string | null;
    created_at: string;
    updated_at: string | null;
}

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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'failed': return <XCircle className="w-5 h-5 text-rose-500" />;
            case 'syncing': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
            default: return <Clock className="w-5 h-5 text-amber-500" />;
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
            case 'failed': return 'bg-rose-50 text-rose-700 border-rose-200/50';
            case 'syncing': return 'bg-blue-50 text-blue-700 border-blue-200/50';
            default: return 'bg-amber-50 text-amber-700 border-amber-200/50';
        }
    };

    const extractRepoName = (url: string) => {
        try {
            return url.split('/').slice(-2).join('/').replace('.git', '');
        } catch {
            return url;
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-16">
            <header className="mb-10 px-2 flex justify-between items-end">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
                    <h1 className="text-[2.5rem] font-bold tracking-tight text-slate-900 leading-tight">Sync History</h1>
                    <p className="text-lg text-slate-500 mt-2 font-medium">Review the logs of all recent repository synchronizations.</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex gap-2">
                    {['all', 'completed', 'failed', 'syncing'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${statusFilter === status
                                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </motion.div>
            </header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100/60 overflow-hidden"
            >
                {loading && logs.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64 space-y-4">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64 text-slate-500">
                        <Clock className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-lg font-medium">No sync logs found.</p>
                    </div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="divide-y divide-slate-100">
                        <AnimatePresence>
                            {logs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    variants={itemVariants}
                                    layout
                                    className="p-6 sm:px-8 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-6"
                                >
                                    <div className="flex items-center gap-5 flex-1 min-w-0">
                                        <div className="flex-shrink-0">
                                            {getStatusIcon(log.status)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-base font-bold text-slate-800 truncate mb-1">
                                                {extractRepoName(log.github_repo_url)} <span className="text-slate-400 font-medium">→</span> Gitee
                                            </p>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                                <span>{new Date(log.created_at).toLocaleString()}</span>
                                                {log.error_message && (
                                                    <span className="text-rose-500 truncate max-w-[200px] sm:max-w-xs">{log.error_message}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${getStatusStyle(log.status)}`}>
                                            {log.status}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
