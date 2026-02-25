"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Settings } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe pt-2 px-6 pb-2 z-50">
            <div className="flex justify-around items-center h-16">
                <Link
                    href="/"
                    className={`flex flex-col items-center gap-1 transition-colors ${isActive('/') ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Home size={24} />
                    <span className="text-xs font-medium">Pantry</span>
                </Link>

                <Link
                    href="/add"
                    className="flex flex-col items-center -mt-8"
                >
                    <div className={`p-4 rounded-full shadow-lg transition-transform ${isActive('/add') ? 'bg-indigo-500 scale-110' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                        <PlusCircle size={32} className="text-white" />
                    </div>
                    <span className={`text-xs font-medium mt-1 ${isActive('/add') ? 'text-indigo-400' : 'text-slate-400'}`}>Add Item</span>
                </Link>

                <Link
                    href="/settings"
                    className={`flex flex-col items-center gap-1 transition-colors ${isActive('/settings') ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Settings size={24} />
                    <span className="text-xs font-medium">Settings</span>
                </Link>
            </div>
        </div>
    );
}
