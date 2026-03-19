"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Calendar, Save, Camera } from 'lucide-react';
import DateScanner from '@/components/DateScanner';
import ExpirationDatePicker from '@/components/ExpirationDatePicker';

export default function EditItem() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [showDateScanner, setShowDateScanner] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        quantity: 1,
        expiryDate: '',
        purchaseDate: '',
    });

    useEffect(() => {
        if (id) {
            fetch(`/api/items/${id}`) // This API route was actually not implemented for GET single item in my previous steps!
                // Wait, let me check api/items/[id]/route.ts. I implemented PUT and DELETE.
                // I need to add GET to src/app/api/items/[id]/route.ts as well!
                .then(res => {
                    if (!res.ok) throw new Error('Failed to load');
                    return res.json();
                })
                .then(data => {
                    setFormData({
                        name: data.name,
                        quantity: data.quantity,
                        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString().split('T')[0] : '',
                        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString().split('T')[0] : '',
                    });
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setError('Item not found');
                    setLoading(false);
                });
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const res = await fetch(`/api/items/${id}`, {
                method: 'PUT',
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
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6 text-center text-slate-400">Loading...</div>;
    if (error) return <div className="p-6 text-center text-red-400">{error}</div>;

    return (
        <div className="p-6">
            {showDateScanner && (
                <DateScanner
                    onScan={(date) => {
                        setFormData(prev => ({ ...prev, expiryDate: date }));
                        setShowDateScanner(false);
                    }}
                    onClose={() => setShowDateScanner(false)}
                />
            )}

            <h1 className="text-2xl font-bold mb-6 text-indigo-400">Edit Item</h1>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Item Name</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                    <div className="flex gap-2 items-start">
                        <div className="flex-1">
                            <ExpirationDatePicker
                                value={formData.expiryDate}
                                onChange={(val) => setFormData({ ...formData, expiryDate: val })}
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
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-4 rounded-xl shadow-lg mt-8 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                    <Save size={20} />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}
