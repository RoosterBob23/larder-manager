import { Trash2, Edit2, CheckCircle2, Circle, Square, CheckSquare } from 'lucide-react';

interface PantryItem {
    id: number;
    name: string;
    quantity: number;
    expiryDate: string | null;
    purchaseDate: string;
    used: boolean;
}

interface Props {
    item: PantryItem;
    onDelete: (id: number) => void;
    onEdit: (item: PantryItem) => void;
    onToggleUsed: (id: number, used: boolean) => void;
    onSelect?: (id: number, selected: boolean) => void;
    selected?: boolean;
    showCheckbox?: boolean;
}

export default function PantryItemCard({ 
    item, 
    onDelete, 
    onEdit, 
    onToggleUsed, 
    onSelect, 
    selected = false, 
    showCheckbox = false 
}: Props) {
    const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
    const now = new Date();

    let statusColor = item.used ? "border-l-4 border-slate-700 opacity-60" : "border-l-4 border-emerald-500";
    let daysLeft = null;

    if (expiry && !item.used) {
        const diffTime = expiry.getTime() - now.getTime();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) statusColor = "border-l-4 border-red-500"; // Expired
        else if (daysLeft <= 3) statusColor = "border-l-4 border-orange-500"; // Very soon
        else if (daysLeft <= 7) statusColor = "border-l-4 border-yellow-400"; // Soon
    }

    return (
        <div className={`bg-slate-900 rounded-lg p-4 mb-3 shadow-md flex justify-between items-center transition-all ${statusColor} ${selected ? 'ring-2 ring-indigo-500' : ''}`}>
            <div className="flex items-center gap-3 flex-1">
                {showCheckbox && (
                    <button 
                        onClick={() => onSelect?.(item.id, !selected)}
                        className="text-slate-500 hover:text-indigo-400 transition-colors"
                    >
                        {selected ? <CheckSquare size={20} className="text-indigo-500" /> : <Square size={20} />}
                    </button>
                )}
                <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${item.used ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                        {item.name}
                    </h3>
                    <div className="text-xs text-slate-400 mt-1 flex gap-3">
                        <span>Qty: {item.quantity}</span>
                        {expiry && (
                            <span className={!item.used && daysLeft && daysLeft < 0 ? "text-red-400 font-bold" : !item.used && daysLeft && daysLeft <= 7 ? "text-orange-300" : ""}>
                                {daysLeft && daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago` : `Exp: ${expiry.toLocaleDateString()}`}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-1 items-center">
                <button
                    onClick={() => onToggleUsed(item.id, !item.used)}
                    className={`p-2 transition-colors ${item.used ? 'text-indigo-400 hover:text-indigo-300' : 'text-slate-400 hover:text-emerald-400'}`}
                    title={item.used ? "Mark as unused" : "Mark as used"}
                >
                    {item.used ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                
                {!item.used && (
                    <button
                        onClick={() => onEdit(item)}
                        className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                        aria-label="Edit"
                    >
                        <Edit2 size={18} />
                    </button>
                )}
                
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
