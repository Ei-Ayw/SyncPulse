import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
    return (
        <div className="flex min-h-screen bg-[#f9fafb] font-sans selection:bg-blue-100 selection:text-blue-900">
            <Sidebar />
            <main className="flex-1 px-12 py-10 overflow-y-auto">
                <div className="max-w-6xl mx-auto h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
