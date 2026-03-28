"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, ChevronLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import PantryItemCard from '@/components/PantryItemCard';

interface PantryItem {
    id: number;
    name: string;
    quantity: number;
    expiryDate: string | null;
    purchaseDate: string;
    used: boolean;
}

export default function ExpirationReport() {
    const [items, setItems] = useState<PantryItem[]>([]);
    const [days, setDays] = useState<number>(3);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchReport = useCallback(async (threshold: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/report?days=${threshold}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
                setDays(data.days);
            }
        } catch (error) {
            console.error('Failed to fetch report', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial fetch, backend will use system setting if days is not provided
        // but we'll fetch settings first to show the correct number in the input
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                const d = data.days || 3;
                setDays(d);
                fetchReport(d);
            })
            .catch(() => fetchReport(3));
    }, [fetchReport]);

    const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val >= 0) {
            setDays(val);
            fetchReport(val);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        setItems(items.filter(item => item.id !== id));
        try {
            await fetch(`/api/items/${id}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Failed to delete', error);
            fetchReport(days);
        }
    };

    const handleEdit = (item: PantryItem) => {
        router.push(`/edit/${item.id}`);
    };

    const handleToggleUsed = async (id: number, used: boolean) => {
        // Optimistic update
        setItems(items.map(item => item.id === id ? { ...item, used } : item));
        try {
            const item = items.find(i => i.id === id);
            if (!item) return;
            
            await fetch(`/api/items/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: item.name,
                    quantity: item.quantity,
                    expiryDate: item.expiryDate,
                    purchaseDate: item.purchaseDate,
                    used
                })
            });
        } catch (error) {
            console.error('Failed to toggle used', error);
            fetchReport(days);
        }
    };

    return (
        <div className="p-6 pb-24">
            <header className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Link href="/" className="text-slate-400 hover:text-indigo-400 transition-colors">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
                        Expiration Report
                    </h1>
                </div>
                <p className="text-slate-500 text-sm">
                    Items expiring within the specified number of days.
                </p>
            </header>

            <div className="bg-slate-900 rounded-xl p-4 mb-6 shadow-lg border border-slate-800">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex-1 w-full shrink-0">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Days threshold
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="number"
                                value={days}
                                onChange={handleDaysChange}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                min="0"
                            />
                        </div>
                    </div>

                    <a
                        href={`/api/report/export?days=${days}`}
                        download={`larder-report-${days}-days.csv`}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
                    >
                        <Download size={18} />
                        Export CSV
                    </a>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center mt-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center mt-20 text-slate-500">
                    <div className="bg-slate-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                        <FileText size={32} className="text-slate-700" />
                    </div>
                    <p>No items expiring within {days} days.</p>
                    <p className="text-sm mt-2">Try increasing the threshold.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1 mb-2">
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                            {items.length} expiring items
                        </span>
                    </div>
                    {items.map(item => (
                        <PantryItemCard
                            key={item.id}
                            item={item}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onToggleUsed={handleToggleUsed}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
