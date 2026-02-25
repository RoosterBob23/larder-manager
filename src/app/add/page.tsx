"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scan, Calendar, Camera } from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';
import DateScanner from '@/components/DateScanner';

export default function AddItem() {
    const router = useRouter();
    const [showScanner, setShowScanner] = useState(false);
    const [showDateScanner, setShowDateScanner] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        quantity: 1,
        expiryDate: '',
    });

    const handleScan = async (decodedText: string) => {
        setShowScanner(false);
        setFormData(prev => ({ ...prev, barcode: decodedText }));
        setLoading(true);

        try {
            // Lookup product
            const res = await fetch(`/api/products/${decodedText}`);
            if (res.ok) {
                const data = await res.json();
                if (data.name) {
                    setFormData(prev => ({ ...prev, name: data.name }));
                }
            }
        } catch (err) {
            console.error('Lookup failed', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push('/');
                router.refresh();
            } else {
                setError('Failed to save item');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            {showScanner && (
                <BarcodeScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {showDateScanner && (
                <DateScanner
                    onScan={(date) => {
                        setFormData(prev => ({ ...prev, expiryDate: date }));
                        setShowDateScanner(false);
                    }}
                    onClose={() => setShowDateScanner(false)}
                />
            )}

            <h1 className="text-2xl font-bold mb-6 text-indigo-400">Add Item</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Scan Button */}
                <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-xl shadow-lg transition-all"
                >
                    <Scan size={24} />
                    <span className="font-semibold">Scan Barcode</span>
                </button>

                {formData.barcode && (
                    <div className="text-center text-sm text-slate-500">
                        Barcode: <span className="font-mono text-slate-300">{formData.barcode}</span>
                    </div>
                )}

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Item Name</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Tomato Sauce"
                    />
                </div>

                {/* Quantity */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Quantity</label>
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                            className="w-10 h-10 rounded-lg bg-slate-800 text-slate-200 text-xl font-bold flex items-center justify-center hover:bg-slate-700"
                        >
                            -
                        </button>
                        <input
                            type="number"
                            min="1"
                            value={formData.quantity}
                            onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                            className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-3 text-center text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                            className="w-10 h-10 rounded-lg bg-slate-800 text-slate-200 text-xl font-bold flex items-center justify-center hover:bg-slate-700"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Expiry Date */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Expiration Date</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Calendar className="absolute left-3 top-3.5 text-slate-500" size={18} />
                            <input
                                type="date"
                                id="expiryDate"
                                value={formData.expiryDate}
                                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none [color-scheme:dark]"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowDateScanner(true)}
                            className="bg-slate-800 hover:bg-slate-700 text-indigo-400 p-3 rounded-lg border border-slate-700"
                            title="Scan date with camera"
                        >
                            <Camera size={24} />
                        </button>
                    </div>
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                        {[7, 14, 30, 90, 180, 365].map(days => (
                            <button
                                type="button"
                                key={days}
                                onClick={() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + days);
                                    setFormData({ ...formData, expiryDate: d.toISOString().split('T')[0] });
                                }}
                                className="px-3 py-1 bg-slate-800 text-xs rounded-full text-slate-400 hover:bg-indigo-900 hover:text-indigo-200 whitespace-nowrap"
                            >
                                +{days}d
                            </button>
                        ))}
                    </div>
                </div>

                {error && <div className="text-red-500 text-center">{error}</div>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold p-4 rounded-xl shadow-lg mt-8 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Add to Pantry'}
                </button>
            </form>
        </div>
    );
}
