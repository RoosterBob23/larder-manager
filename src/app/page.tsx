"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PantryItemCard from '@/components/PantryItemCard';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'expiryDate'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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

  const handleSort = (field: 'name' | 'quantity' | 'expiryDate') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const pantryItems = items.filter(item => !item.used);
  const usedItems = items.filter(item => item.used);
  const displayItems = activeTab === 'pantry' ? pantryItems : usedItems;

  const filteredItems = displayItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    let compareA: any = a[sortBy];
    let compareB: any = b[sortBy];

    if (sortBy === 'expiryDate') {
      if (!compareA) return sortOrder === 'asc' ? 1 : -1;
      if (!compareB) return sortOrder === 'asc' ? -1 : 1;
      compareA = new Date(compareA).getTime();
      compareB = new Date(compareB).getTime();
    }

    if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

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

      <div className="flex flex-col gap-4 mb-4">
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

      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md pb-4 pt-2 -mx-6 px-6 mb-2">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'pantry' ? 'pantry' : 'used'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-1">Sort by:</span>
            {[
              { id: 'name', label: 'Name' },
              { id: 'quantity', label: 'Qty' },
              { id: 'expiryDate', label: 'Expiry' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleSort(btn.id as any)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                  sortBy === btn.id
                    ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                {btn.label}
                {sortBy === btn.id && (
                  sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="text-center mt-20 text-slate-500 bg-slate-900/50 py-12 rounded-xl border border-dashed border-slate-800">
          <p>
            {searchQuery 
              ? `No items matching "${searchQuery}" found.` 
              : `Your ${activeTab === 'pantry' ? 'pantry' : 'used list'} is empty.`}
          </p>
          {!searchQuery && activeTab === 'pantry' && (
            <p className="text-sm mt-2">Tap "Add Item" to get started.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map(item => (
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
