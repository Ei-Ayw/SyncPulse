import { useState, useEffect } from 'react';
import axios from 'axios';
import { GitCommit, GitMerge, Activity, ServerCrash, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

export default function Home() {
    const { userId } = useAuthStore();
    const [statsData, setStatsData] = useState({
        total: 0,
        active: 0,
        queued: 0,
        failed: 0
    });
    const [heatmapData, setHeatmapData] = useState<number[]>(Array.from({ length: 120 }).fill(0) as number[]);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const res = await axios.get(`http://localhost:8001/api/v1/sync/dashboard/${userId}`);
                setStatsData(res.data.stats);
                setHeatmapData(res.data.heatmapData);
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            }
        };
        fetchDashboardStats();
    }, [userId]);

    const stats = [
        { name: 'Total Syncs', value: statsData.total.toLocaleString(), icon: <GitCommit className="w-7 h-7 text-blue-600" />, change: 'All time', trend: 'neutral' },
        { name: 'Active Auto-Syncs', value: statsData.active.toString(), icon: <Activity className="w-7 h-7 text-emerald-600" />, change: 'Running now', trend: statsData.active > 0 ? 'up' : 'neutral' },
        { name: 'Queued Tasks', value: statsData.queued.toString(), icon: <GitMerge className="w-7 h-7 text-amber-500" />, change: 'Waiting', trend: statsData.queued > 0 ? 'down' : 'neutral' },
        { name: 'Failed Syncs', value: statsData.failed.toString(), icon: <ServerCrash className="w-7 h-7 text-rose-500" />, change: statsData.failed === 0 ? 'All clear' : 'Needs attention', trend: statsData.failed === 0 ? 'neutral' : 'down' },
    ];
    const getColorClass = (level: number) => {
        if (level === 0) return 'bg-white/5';
        if (level === 1) return 'bg-blue-900/40';
        if (level === 2) return 'bg-blue-700/60';
        if (level === 3) return 'bg-blue-500/80';
        return 'bg-blue-400';
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-16">
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-10 px-2 flex justify-between items-end"
            >
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">Overview</h1>
                    <p className="text-lg text-white/40 mt-2 font-medium">Welcome back. Here's what's happening with your repositories.</p>
                </div>
                <button className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white/80 font-semibold rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                    View Report
                    <ArrowUpRight className="w-4 h-4 text-white/30" />
                </button>
            </motion.header>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        variants={itemVariants}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="bg-[#0f0f12]/80 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5 shadow-2xl shadow-black/20"
                    >
                        <div className="flex items-start justify-between">
                            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
                                {stat.icon}
                            </div>
                            {stat.trend === 'up' && <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">↑</span>}
                            {stat.trend === 'down' && <span className="flex items-center text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg">↓</span>}
                        </div>
                        <div className="mt-6">
                            <h3 className="text-3xl font-bold text-white tracking-tight">{stat.value}</h3>
                            <p className="text-sm font-semibold text-white/40 mt-1 uppercase tracking-wider">{stat.name}</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="bg-[#0f0f12]/80 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-10 shadow-2xl shadow-black/20"
            >
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-white tracking-tight leading-none">Sync Activity</h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        <span>Less</span>
                        <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-sm bg-white/5"></div>
                            <div className="w-3 h-3 rounded-sm bg-blue-900/40"></div>
                            <div className="w-3 h-3 rounded-sm bg-blue-700/60"></div>
                            <div className="w-3 h-3 rounded-sm bg-blue-500/80"></div>
                            <div className="w-3 h-3 rounded-sm bg-blue-400"></div>
                        </div>
                        <span>More</span>
                    </div>
                </div>

                <div className="overflow-x-auto pb-4 scrollbar-hide">
                    <div className="min-w-[700px]">
                        <div className="grid grid-rows-7 grid-flow-col gap-1.5">
                            {heatmapData.map((level, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.001, duration: 0.2 }}
                                    className={`w-3.5 h-3.5 rounded-[3px] ${getColorClass(level)} hover:ring-2 hover:ring-white/20 hover:ring-offset-2 hover:ring-offset-[#0f0f12] transition-all cursor-pointer`}
                                    title={`Activity level ${level}`}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between mt-6 text-xs font-bold text-white/20 px-1 uppercase tracking-widest">
                            <span>Jan</span>
                            <span>Feb</span>
                            <span>Mar</span>
                            <span>Apr</span>
                            <span>May</span>
                            <span>Jun</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
