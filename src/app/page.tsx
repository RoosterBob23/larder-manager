"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PantryItemCard from '@/components/PantryItemCard';

interface PantryItem {
  id: number;
  name: string;
  quantity: number;
  expiryDate: string | null;
  purchaseDate: string;
  used: boolean;
}

export default function Home() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pantry' | 'used'>('pantry');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch items', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    // Optimistic update
    setItems(items.filter(item => item.id !== id));

    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to delete', error);
      fetchItems();
    }
  };

  const handleToggleUsed = async (id: number, used: boolean) => {
    // Optimistic update
    setItems(items.map(item => item.id === id ? { ...item, used } : item));

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ used }),
      });
      if (!res.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to toggle used status', error);
      fetchItems();
    }
  };

  const handleSelect = (id: number, selected: boolean) => {
    if (selected) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) return;

    // Optimistic update
    const remainingItems = items.filter(item => !selectedIds.includes(item.id));
    setItems(remainingItems);
    const deletedCount = selectedIds.length;
    setSelectedIds([]);

    try {
      const res = await fetch('/api/items/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to bulk delete', error);
      fetchItems();
    }
  };

  const handleEdit = (item: PantryItem) => {
    router.push(`/edit/${item.id}`);
  };

  const pantryItems = items.filter(item => !item.used);
  const usedItems = items.filter(item => item.used);
  const displayItems = activeTab === 'pantry' ? pantryItems : usedItems;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Larder Manager
        </h1>
        <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono text-slate-400">
          {items.length} Total Items
        </div>
      </header>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex bg-slate-900 p-1 rounded-lg w-fit">
          <button
            onClick={() => { setActiveTab('pantry'); setSelectedIds([]); }}
            className={`px-4 py-2 rounded-md transition-all ${activeTab === 'pantry' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Pantry ({pantryItems.length})
          </button>
          <button
            onClick={() => { setActiveTab('used'); setSelectedIds([]); }}
            className={`px-4 py-2 rounded-md transition-all ${activeTab === 'used' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Used Items ({usedItems.length})
          </button>
        </div>

        {activeTab === 'used' && usedItems.length > 0 && (
          <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <span className="text-sm text-slate-400">
              {selectedIds.length} items selected
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.length === 0}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedIds.length > 0 ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50' : 'text-slate-600 cursor-not-allowed border border-slate-700'}`}
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center mt-20 text-slate-500 bg-slate-900/50 py-12 rounded-xl border border-dashed border-slate-800">
          <p>Your {activeTab === 'pantry' ? 'pantry' : 'used list'} is empty.</p>
          {activeTab === 'pantry' && (
            <p className="text-sm mt-2">Tap "Add Item" to get started.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {displayItems.map(item => (
            <PantryItemCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onToggleUsed={handleToggleUsed}
              onSelect={activeTab === 'used' ? handleSelect : undefined}
              selected={selectedIds.includes(item.id)}
              showCheckbox={activeTab === 'used'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
