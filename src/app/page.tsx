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
}

export default function Home() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
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
        // Revert if failed
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to delete', error);
      fetchItems();
    }
  };

  const handleEdit = (item: PantryItem) => {
    router.push(`/edit/${item.id}`);
  };

  return (
    <div className="p-6">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          My Pantry
        </h1>
        <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono text-slate-400">
          {items.length} Items
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center mt-20 text-slate-500">
          <p>Your pantry is empty.</p>
          <p className="text-sm mt-2">Tap "Add Item" to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <PantryItemCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
