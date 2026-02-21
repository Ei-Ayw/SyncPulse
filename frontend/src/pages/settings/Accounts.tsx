import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { Github, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Accounts() {
    const { userId, githubLinked, giteeLinked, setLinked } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [ghToken, setGhToken] = useState('');
    const [ghUser, setGhUser] = useState('');
    const [gtToken, setGtToken] = useState('');
    const [gtUser, setGtUser] = useState('');

    useEffect(() => {
        checkStatus();
    }, [userId]);

    const checkStatus = async () => {
        try {
            const res = await axios.get(`http://localhost:8000/api/v1/auth/status/${userId}`);
            setLinked(res.data.github_linked, res.data.gitee_linked);
        } catch (e) {
            console.error(e);
        }
    };

    const handleLink = async (platform: 'github' | 'gitee') => {
        try {
            setLoading(true);
            await axios.post('http://localhost:8000/api/v1/auth/link', {
                user_id: userId,
                platform,
                username: platform === 'github' ? ghUser : gtUser,
                access_token: platform === 'github' ? ghToken : gtToken
            });
            await checkStatus();
            if (platform === 'github') {
                setGhToken(''); setGhUser('');
            } else {
                setGtToken(''); setGtUser('');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlink = async (platform: 'github' | 'gitee') => {
        try {
            setLoading(true);
            await axios.delete(`http://localhost:8000/api/v1/auth/unlink/${userId}/${platform}`);
            await checkStatus();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const variants = {
        hidden: { opacity: 0, y: 15 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
        })
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-16">
            <motion.header custom={0} initial="hidden" animate="visible" variants={variants} className="mb-10 px-2">
                <h1 className="text-[2.5rem] font-bold tracking-tight text-slate-900 leading-tight">Accounts</h1>
                <p className="text-lg text-slate-500 mt-2 font-medium">Manage your connected version control platforms.</p>
            </motion.header>

            <motion.div custom={1} initial="hidden" animate="visible" variants={variants} className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100/60 overflow-hidden divide-y divide-slate-100">

                {/* GitHub Linked Section */}
                <div className="p-8 sm:p-10 transition-colors duration-300 hover:bg-slate-50/30">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-6">
                            <div className="p-4 bg-slate-50 rounded-[1.25rem] shadow-sm border border-slate-100">
                                <Github className="w-8 h-8 text-slate-800" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 flex items-center tracking-tight">
                                    GitHub
                                    {githubLinked && <CheckCircle2 className="w-[22px] h-[22px] ml-3 text-emerald-500" strokeWidth={2.5} />}
                                </h3>
                                <p className="text-base text-slate-500 mt-1.5 font-medium">Source repositories platform</p>
                            </div>
                        </div>
                        {githubLinked ? (
                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: "#fee2e2" }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleUnlink('github')}
                                className="px-5 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 rounded-xl transition-colors"
                                disabled={loading}
                            >
                                Disconnect
                            </motion.button>
                        ) : null}
                    </div>

                    {!githubLinked && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-8 flex flex-col space-y-4 ml-[5.5rem] items-start">
                            <a
                                href={`http://localhost:8000/api/v1/auth/oauth/github/login?user_id=${userId}`}
                                className="px-6 py-3.5 bg-slate-900 text-white font-bold text-base rounded-2xl shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 transition-all flex items-center gap-3"
                            >
                                <Github className="w-5 h-5" />
                                <span className="pr-2">Authorize with GitHub OAuth</span>
                            </a>
                        </motion.div>
                    )}
                </div>

                {/* Gitee Linked Section */}
                <div className="p-8 sm:p-10 transition-colors duration-300 hover:bg-slate-50/30">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-6">
                            <div className="p-4 bg-red-50/80 rounded-[1.25rem] shadow-sm border border-red-100/50">
                                <svg className="w-8 h-8 text-red-600" viewBox="0 0 1024 1024" fill="currentColor">
                                    <path d="M512 1024C229.2 1024 0 794.8 0 512S229.2 0 512 0s512 229.2 512 512-229.2 512-512 512zm259.5-568.8H293v-95.2h478.5v95.2zm0 181.8H481.5v-92.7h290v92.7z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 flex items-center tracking-tight">
                                    Gitee
                                    {giteeLinked && <CheckCircle2 className="w-[22px] h-[22px] ml-3 text-emerald-500" strokeWidth={2.5} />}
                                </h3>
                                <p className="text-base text-slate-500 mt-1.5 font-medium">Destination repositories platform</p>
                            </div>
                        </div>
                        {giteeLinked ? (
                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: "#fee2e2" }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleUnlink('gitee')}
                                className="px-5 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 rounded-xl transition-colors"
                                disabled={loading}
                            >
                                Disconnect
                            </motion.button>
                        ) : null}
                    </div>

                    {!giteeLinked && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-8 flex flex-col space-y-4 ml-[5.5rem] items-start">
                            <a
                                href={`http://localhost:8000/api/v1/auth/oauth/gitee/login?user_id=${userId}`}
                                className="px-6 py-3.5 bg-red-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-600/30 hover:bg-red-500 transition-all flex items-center gap-3"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 1024 1024" fill="currentColor">
                                    <path d="M512 1024C229.2 1024 0 794.8 0 512S229.2 0 512 0s512 229.2 512 512-229.2 512-512 512zm259.5-568.8H293v-95.2h478.5v95.2zm0 181.8H481.5v-92.7h290v92.7z"></path>
                                </svg>
                                <span className="pr-2">Authorize with Gitee OAuth</span>
                            </a>
                        </motion.div>
                    )}
                </div>

            </motion.div>
        </div>
    );
}
