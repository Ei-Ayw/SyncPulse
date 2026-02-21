import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { Github, PlayCircle, Loader2, Search, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Repo {
    name: string;
    full_name: string;
    html_url: string;
    clone_url: string;
    description: string;
}

export default function Repositories() {
    const { userId } = useAuthStore();
    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncingRepo, setSyncingRepo] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchRepos();
    }, [userId]);

    const fetchRepos = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:8000/api/v1/sync/github/repos/${userId}`);
            setRepos(res.data);
        } catch (error) {
            console.error("Failed to fetch repositories", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async (repoUrl: string) => {
        try {
            setSyncingRepo(repoUrl);
            await axios.post('http://localhost:8000/api/v1/sync/trigger', {
                user_id: userId,
                github_repo_url: repoUrl
            });
            setTimeout(() => setSyncingRepo(null), 3000);
        } catch (error) {
            console.error("Failed to trigger sync", error);
            setSyncingRepo(null);
        }
    };

    const filteredRepos = repos.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
    };

    return (
        <div className="max-w-6xl mx-auto pb-16 space-y-8">
            <header className="mb-10 px-2 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
                    <h1 className="text-[2.5rem] font-bold tracking-tight text-slate-900 leading-tight">Repositories</h1>
                    <p className="text-lg text-slate-500 mt-2 font-medium">Select and mirror your GitHub repositories to Gitee.</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search repositories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-3.5 bg-white border border-slate-200/80 rounded-full shadow-sm text-base placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all w-full md:w-80"
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchRepos}
                        className="p-3.5 bg-white text-slate-600 border border-slate-200/80 rounded-full shadow-sm hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                        title="Refresh List"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                    </motion.button>
                </motion.div>
            </header>

            {loading && repos.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-64 space-y-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Fetching repositories from GitHub...</p>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    <AnimatePresence>
                        {filteredRepos.map((repo) => (
                            <motion.div
                                key={repo.full_name}
                                variants={itemVariants}
                                layout
                                className="bg-white rounded-[2rem] p-7 shadow-lg shadow-slate-200/30 border border-slate-100/80 hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden flex flex-col"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-50 to-transparent opacity-50 pointer-events-none rounded-bl-full"></div>

                                <div className="flex items-start justify-between mb-5 z-10">
                                    <div className="p-3 bg-slate-50 rounded-[1.25rem] border border-slate-100/80 group-hover:bg-blue-50 transition-colors">
                                        <Github className="w-6 h-6 text-slate-700 group-hover:text-blue-600 transition-colors" />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 break-words mb-2 z-10 leading-snug">{repo.name}</h3>
                                <p className="text-sm text-slate-500 font-medium mb-8 line-clamp-2 z-10 flex-1">
                                    {repo.description || 'No description provided.'}
                                </p>

                                <div className="pt-5 border-t border-slate-100/80 flex justify-between items-center z-10 mt-auto">
                                    <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1 group/link">
                                        GitHub
                                        <ArrowRight className="w-3.5 h-3.5 -translate-x-1 opacity-0 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                                    </a>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleSync(repo.clone_url)}
                                        disabled={syncingRepo === repo.clone_url}
                                        className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm flex items-center ${syncingRepo === repo.clone_url
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                                            } disabled:opacity-70 disabled:cursor-not-allowed`}
                                    >
                                        {syncingRepo === repo.clone_url ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing</>
                                        ) : (
                                            <><PlayCircle className="w-4 h-4 mr-2" /> Mirror</>
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredRepos.length === 0 && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="col-span-full py-20 text-center bg-white/50 backdrop-blur-sm rounded-[2rem] border border-dashed border-slate-300"
                        >
                            <Github className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-700">No repositories found</h3>
                            <p className="text-slate-500 mt-2 font-medium">Try adjusting your search or ensure your GitHub account is connected.</p>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
