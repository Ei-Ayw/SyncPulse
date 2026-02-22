import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
    return (
        <div className="flex min-h-screen bg-[#050507] text-white font-sans selection:bg-blue-500/30 selection:text-white overflow-hidden">
            <Sidebar />
            <main className="flex-1 relative overflow-y-auto">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 px-8 py-10 lg:px-12 h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
