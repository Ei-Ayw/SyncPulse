import { GitCommit, GitMerge, Activity, ServerCrash, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Generate mock data for the heatmap
const generateHeatmapData = () => {
    const days = 30 * 4; // roughly 4 months
    return Array.from({ length: days }).map(() => Math.floor(Math.random() * 5));
};

export default function Home() {
    const stats = [
        { name: 'Total Syncs', value: '1,248', icon: <GitCommit className="w-7 h-7 text-blue-600" />, change: '+12% this week', trend: 'up' },
        { name: 'Active Auto-Syncs', value: '18', icon: <Activity className="w-7 h-7 text-emerald-600" />, change: 'Steady', trend: 'neutral' },
        { name: 'Queued Tasks', value: '3', icon: <GitMerge className="w-7 h-7 text-amber-500" />, change: '-2 since yesterday', trend: 'down' },
        { name: 'Failed Syncs', value: '0', icon: <ServerCrash className="w-7 h-7 text-rose-500" />, change: 'All clear', trend: 'neutral' },
    ];

    const heatmapData = generateHeatmapData();
    const getColorClass = (level: number) => {
        if (level === 0) return 'bg-slate-100';
        if (level === 1) return 'bg-blue-200';
        if (level === 2) return 'bg-blue-400';
        if (level === 3) return 'bg-blue-500';
        return 'bg-blue-600';
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
                    <h1 className="text-[2.5rem] font-bold tracking-tight text-slate-900 leading-tight">Overview</h1>
                    <p className="text-lg text-slate-500 mt-2 font-medium">Welcome back. Here's what's happening with your repositories.</p>
                </div>
                <button className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 font-semibold rounded-full shadow-sm shadow-slate-200/50 border border-slate-200/80 hover:bg-slate-50 transition-colors">
                    View Report
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
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
                        className="bg-white rounded-[1.5rem] p-7 shadow-xl shadow-slate-200/30 border border-slate-100/80"
                    >
                        <div className="flex items-start justify-between">
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100/50">
                                {stat.icon}
                            </div>
                            {stat.trend === 'up' && <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">↑</span>}
                            {stat.trend === 'down' && <span className="flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">↓</span>}
                        </div>
                        <div className="mt-5">
                            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stat.value}</h3>
                            <p className="text-sm font-semibold text-slate-500 mt-1">{stat.name}</p>
                        </div>
                        <div className="mt-5 pt-4 border-t border-slate-50">
                            <span className="text-sm font-medium text-slate-400">{stat.change}</span>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
                className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100/80 p-8 sm:p-10"
            >
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Sync Activity</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <span>Less</span>
                        <div className="w-3 h-3 rounded-sm bg-slate-100"></div>
                        <div className="w-3 h-3 rounded-sm bg-blue-200"></div>
                        <div className="w-3 h-3 rounded-sm bg-blue-400"></div>
                        <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                        <div className="w-3 h-3 rounded-sm bg-blue-600"></div>
                        <span>More</span>
                    </div>
                </div>

                <div className="overflow-x-auto pb-4">
                    <div className="min-w-[700px]">
                        <div className="grid grid-rows-7 grid-flow-col gap-1.5">
                            {heatmapData.map((level, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.002, duration: 0.2 }}
                                    className={`w-3.5 h-3.5 rounded-sm ${getColorClass(level)} hover:ring-2 hover:ring-slate-300 hover:ring-offset-1 transition-all cursor-pointer`}
                                    title={`Activity level ${level}`}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-xs font-semibold text-slate-400 px-1">
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
