import { useState, useEffect } from 'react';

interface Props {
    value: string;
    onChange: (val: string) => void;
}

export default function ExpirationDatePicker({ value, onChange }: Props) {
    const currentYear = new Date().getFullYear();
    const futureYears = Array.from({ length: 15 }, (_, i) => currentYear + i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const parts = value ? value.split('-') : [];
    const yearStr = parts[0] || '';
    const monthStr = parts[1] || '';
    const dayStr = parts[2] || '';

    // Ensure inputted year is in the list
    let displayYears = [...futureYears];
    if (yearStr && !displayYears.includes(parseInt(yearStr))) {
        displayYears.push(parseInt(yearStr));
        displayYears.sort((a, b) => a - b);
    }

    const getDaysInMonth = (y: number, m: number) => {
        if (!y || !m) return 31;
        return new Date(y, m, 0).getDate();
    };

    const daysCount = getDaysInMonth(parseInt(yearStr) || currentYear, parseInt(monthStr) || 1);
    const days = Array.from({ length: daysCount }, (_, i) => i + 1);

    const updateDate = (y: string, m: string, d: string) => {
        if (!y || !m || !d) {
             onChange('');
             return;
        }
        
        const newDaysInMonth = getDaysInMonth(parseInt(y), parseInt(m));
        const safeDay = Math.min(parseInt(d), newDaysInMonth).toString().padStart(2, '0');
        onChange(`${y}-${m.padStart(2, '0')}-${safeDay}`);
    };

    return (
        <div className="flex gap-2 w-full">
            <select
                className="flex-[1.2] bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={monthStr.replace(/^0+/, '')}
                onChange={(e) => updateDate(yearStr || currentYear.toString(), e.target.value, dayStr || '1')}
            >
                <option value="">Month</option>
                {months.map(m => (
                    <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'short' })}</option>
                ))}
            </select>
            
            <select
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={dayStr.replace(/^0+/, '')}
                onChange={(e) => updateDate(yearStr || currentYear.toString(), monthStr || '1', e.target.value)}
            >
                <option value="">Day</option>
                {days.map(d => (
                    <option key={d} value={d}>{d}</option>
                ))}
            </select>

            <select
                className="flex-[1.2] bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={yearStr}
                onChange={(e) => updateDate(e.target.value, monthStr || '1', dayStr || '1')}
            >
                <option value="">Year</option>
                {displayYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
        </div>
    );
}
