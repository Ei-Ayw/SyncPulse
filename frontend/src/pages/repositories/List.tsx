import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { Github, Search, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Repo {
    name: string;
    full_name: string;
    html_url: string;
    clone_url: string;
    description: string;
    sync_status?: 'pending' | 'syncing' | 'completed' | 'failed' | null;
    activity_data?: number[];
}

const GiteeIcon = ({ className }: { className?: string }) => (
    <div className={cn("bg-[#c71d23] rounded-[4px] flex items-center justify-center p-0.5", className)}>
        <svg viewBox="0 0 24 24" className="w-full h-full text-white fill-current">
            <path d="M11.977 24c6.626 0 11.998-5.372 11.998-12S18.604 0 11.977 0C5.352 0 .002 5.372.002 12s5.35 12 11.975 12zM6.166 6.848h11.621v2.105H8.381v2.105h9.406v2.105H8.381v2.105h9.406v2.105H6.166V6.848z" />
        </svg>
    </div>
);

const MiniHeatmap = ({ data }: { data?: number[] }) => (
    <div className="grid grid-cols-7 gap-0.5">
        {(data?.slice(-21) || [...Array(21)]).map((level, i) => (
            <div
                key={i}
                className={cn(
                    "w-1.5 h-1.5 rounded-[1px]",
                    level === 0 ? "bg-white/10" :
                        level === 1 ? "bg-emerald-500/30" :
                            level === 2 ? "bg-emerald-500/50" :
                                level === 3 ? "bg-emerald-500/80" : "bg-emerald-400"
                )}
            />
        ))}
    </div>
);

const RepoSkeleton = () => (
    <div className="w-full p-8 rounded-[2.5rem] bg-[#0f0f12] border border-white/5 animate-pulse">
        <div className="flex justify-between mb-6">
            <div className="flex gap-2.5">
                <div className="w-5 h-5 bg-white/5 rounded-full" />
                <div className="w-4 h-4 bg-white/5 rounded-full" />
            </div>
            <div className="flex gap-4">
                <div className="w-16 h-3 bg-white/5 rounded-full" />
                <div className="w-12 h-3 bg-white/5 rounded-full" />
            </div>
        </div>
        <div className="w-3/4 h-8 bg-white/5 rounded-xl mb-8" />
        <div className="w-full h-1.5 bg-white/5 rounded-full" />
    </div>
);

export default function Repositories() {
    const { userId } = useAuthStore();
    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncingRepo, setSyncingRepo] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({ total: 0, active: 0, failed: 0 });
    const [heatmapData, setHeatmapData] = useState<number[]>([]);

    useEffect(() => {
        fetchRepos(false);
        fetchDashboard();
    }, [userId]);

    const fetchRepos = async (isRefresh: boolean = false) => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:8000/api/v1/sync/github/repos/${userId}`, {
                params: { refresh: isRefresh }
            });
            setRepos(res.data);
        } catch (error) {
            console.error("Failed to fetch repositories", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboard = async () => {
        try {
            const res = await axios.get(`http://localhost:8000/api/v1/sync/dashboard/${userId}`);
            setStats(res.data.stats);
            setHeatmapData(res.data.heatmapData);
        } catch (err) {
            console.error("Dashboard failed", err);
        }
    };

    const handleSync = async (repoUrl: string) => {
        try {
            setSyncingRepo(repoUrl);
            await axios.post('http://localhost:8000/api/v1/sync/trigger', {
                user_id: userId,
                github_repo_url: repoUrl
            });
            // Polling or refreshing after a delay
            setTimeout(() => {
                fetchRepos();
                fetchDashboard();
                setSyncingRepo(null);
            }, 2000);
        } catch (error) {
            console.error("Failed to trigger sync", error);
            setSyncingRepo(null);
        }
    };

    const filteredRepos = repos.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getStatusText = (repo: Repo) => {
        if (syncingRepo === repo.clone_url) return "Syncing...";
        if (repo.sync_status === 'syncing' || repo.sync_status === 'pending') return "Syncing...";
        if (repo.sync_status === 'completed') return "Completed";
        if (repo.sync_status === 'failed') return "Failed";
        return "Not Mirrored";
    };

    const getStatusColor = (repo: Repo) => {
        const text = getStatusText(repo);
        if (text === "Syncing...") return "text-blue-400 animate-pulse";
        if (text === "Completed") return "text-emerald-500/80";
        if (text === "Failed") return "text-rose-500/80";
        return "text-white/20";
    };

    return (
        <div className="max-w-5xl mx-auto pb-16">
            <header className="mb-12 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Sync Projects</h1>
                    <p className="text-white/40 font-medium">Manage your repository mirrors</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { fetchRepos(true); fetchDashboard(); }}
                        disabled={loading}
                        className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                        title="Force Refresh Cache"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>

                    <div className="bg-white/5 border border-white/10 p-1.5 flex items-center gap-2 rounded-2xl">
                        <div className="px-4 py-2 bg-white/10 rounded-xl flex items-center gap-2">
                            <Github className="w-4 h-4 text-white/60" />
                            <span className="text-sm font-semibold text-white/80 transition-colors">GitHub</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-white/20" />
                        <div className="px-4 py-2 hover:bg-white/5 rounded-xl flex items-center gap-2 cursor-pointer group transition-all">
                            <GiteeIcon className="w-4 h-4 opacity-60 group-hover:opacity-100" />
                            <span className="text-sm font-medium text-white/40 group-hover:text-white/60">Gitee</span>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type="text"
                            placeholder="Find repository..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 pr-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64 transition-all"
                        />
                    </div>
                </div>
            </header>

            {loading && repos.length === 0 ? (
                <div className="flex gap-10">
                    <div className="flex-1 space-y-6">
                        {[...Array(3)].map((_, i) => <RepoSkeleton key={i} />)}
                    </div>
                    <div className="w-80 hidden lg:block">
                        <div className="h-[400px] bg-[#0f0f12] border border-white/5 rounded-[2.5rem] animate-pulse" />
                    </div>
                </div>
            ) : (
                <div className="flex gap-10">
                    {/* Left List */}
                    <div className="flex-1 space-y-6">
                        <AnimatePresence mode="popLayout">
                            {filteredRepos.map((repo, idx) => {
                                const statusText = getStatusText(repo);
                                const isSyncing = statusText === "Syncing...";
                                return (
                                    <motion.div
                                        key={repo.full_name}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        layout
                                        className={cn(
                                            "group relative p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer overflow-hidden",
                                            isSyncing
                                                ? "bg-blue-600/10 border-blue-500/40 shadow-[0_0_40px_rgba(37,99,235,0.15)]"
                                                : "bg-[#0f0f12] border-white/5 hover:border-white/10 hover:bg-[#141417]"
                                        )}
                                        onClick={() => handleSync(repo.clone_url)}
                                    >
                                        {/* Status Header */}
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-2.5">
                                                <Github className="w-5 h-5 text-white/60" />
                                                <div className="w-1.5 h-px bg-white/20" />
                                                <GiteeIcon className="w-4 h-4" />
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <MiniHeatmap data={repo.activity_data} />
                                                <span className={cn(
                                                    "text-xs font-bold uppercase tracking-wider",
                                                    getStatusColor(repo)
                                                )}>
                                                    {statusText}
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-bold text-white mb-8 tracking-tight group-hover:text-blue-400 transition-colors uppercase">{repo.name}</h3>

                                        {/* Progress Bar */}
                                        <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                className={cn(
                                                    "absolute h-full rounded-full transition-all duration-1000",
                                                    isSyncing
                                                        ? "bg-gradient-to-r from-blue-600 to-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                                        : statusText === "Completed" ? "bg-emerald-500/50" : "bg-transparent"
                                                )}
                                                initial={{ width: 0 }}
                                                animate={{ width: isSyncing ? "60%" : statusText === "Completed" ? "100%" : "0%" }}
                                            />
                                        </div>

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Right Side Activity */}
                    <div className="w-80 hidden lg:block">
                        <div className="bg-[#0f0f12]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 sticky top-10">
                            <h3 className="text-lg font-bold text-white mb-6">Activity</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-12 gap-1.5">
                                    {(heatmapData.slice(-60)).map((level, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "aspect-square rounded-[3px]",
                                                level === 0 ? "bg-white/5" :
                                                    level === 1 ? "bg-emerald-500/30" :
                                                        level === 2 ? "bg-emerald-500/50" :
                                                            level === 3 ? "bg-emerald-500/80" : "bg-emerald-500"
                                            )}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pt-4">
                                    <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Yearly active</span>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-sm bg-white/5" />
                                        <div className="w-2 h-2 rounded-sm bg-emerald-500/40" />
                                        <div className="w-2 h-2 rounded-sm bg-emerald-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-white/5 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                        <RefreshCw className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white/80">{stats.total} Total Syncs</p>
                                        <p className="text-xs text-white/30 font-medium font-bold">ALL TIME</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white/80">{stats.total > 0 ? (100 - (stats.failed / stats.total * 100)).toFixed(1) : 100}% Success</p>
                                        <p className="text-xs text-white/30 font-medium font-bold uppercase">Auto-retry active</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
