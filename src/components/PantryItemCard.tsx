import { Trash2, Edit2, AlertTriangle } from 'lucide-react';

interface PantryItem {
    id: number;
    name: string;
    quantity: number;
    expiryDate: string | null;
    purchaseDate: string;
}

interface Props {
    item: PantryItem;
    onDelete: (id: number) => void;
    onEdit: (item: PantryItem) => void;
}

export default function PantryItemCard({ item, onDelete, onEdit }: Props) {
    const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
    const now = new Date();

    let statusColor = "border-l-4 border-emerald-500";
    let daysLeft = null;

    if (expiry) {
        const diffTime = expiry.getTime() - now.getTime();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) statusColor = "border-l-4 border-red-500"; // Expired
        else if (daysLeft <= 3) statusColor = "border-l-4 border-orange-500"; // Very soon
        else if (daysLeft <= 7) statusColor = "border-l-4 border-yellow-400"; // Soon
    }

    return (
        <div className={`bg-slate-900 rounded-lg p-4 mb-3 shadow-md flex justify-between items-center ${statusColor}`}>
            <div className="flex-1">
                <h3 className="font-semibold text-lg text-slate-100">{item.name}</h3>
                <div className="text-xs text-slate-400 mt-1 flex gap-3">
                    <span>Qty: {item.quantity}</span>
                    {expiry && (
                        <span className={daysLeft && daysLeft < 0 ? "text-red-400 font-bold" : daysLeft && daysLeft <= 7 ? "text-orange-300" : ""}>
                            {daysLeft && daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago` : `Exp: ${expiry.toLocaleDateString()}`}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onEdit(item)}
                    className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                    aria-label="Edit"
                >
                    <Edit2 size={18} />
                </button>
                <button
                    onClick={() => onDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    aria-label="Delete"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
