"use client";

import { useState, useEffect } from 'react';
import { Bell, Save, Download } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function Settings() {
    const [days, setDays] = useState(3);
    const [loading, setLoading] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        // Fetch settings
        fetch('/api/settings').then(res => res.json()).then(data => {
            if (data.days) setDays(data.days);
        });

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');

            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(subscription => {
                    setSubscribed(!!subscription);
                });
            });
        }

        setPermission(Notification.permission);
    }, []);

    const handleSaveDays = async () => {
        setLoading(true);
        await fetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ days }),
        });
        setLoading(false);
        alert('Settings saved');
    };

    const handleSubscribe = async () => {
        if (!('serviceWorker' in navigator)) return;

        const registration = await navigator.serviceWorker.ready;

        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
            });

            await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });

            setSubscribed(true);
            alert('Notifications enabled!');
        } catch (error) {
            console.error(error);
            alert('Failed to subscribe. ensure you are using HTTPS or localhost.');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-indigo-400">Settings</h1>

            <div className="bg-slate-900 rounded-lg p-4 mb-6 shadow-md">
                <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <Bell size={20} />
                    Alert Configuration
                </h2>

                <div className="mb-4">
                    <label className="block text-sm text-slate-400 mb-2">
                        Days before expiration to alert
                    </label>
                    <input
                        type="number"
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-100"
                    />
                </div>

                <button
                    onClick={handleSaveDays}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                >
                    <Save size={16} /> Save Preference
                </button>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 mb-6 shadow-md">
                <h2 className="text-lg font-semibold text-slate-100 mb-4">Push Notifications</h2>

                <div className="text-sm text-slate-400 mb-4">
                    Status: <span className={subscribed ? "text-emerald-400" : "text-yellow-400"}>
                        {subscribed ? "Active" : "Inactive"}
                    </span>
                </div>

                {!subscribed && (
                    <button
                        onClick={handleSubscribe}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-lg font-bold"
                    >
                        Enable Notifications
                    </button>
                )}

                {permission === 'denied' && (
                    <p className="text-red-400 text-xs mt-2">
                        Notifications are blocked by your browser. Please reset permissions in site settings.
                    </p>
                )}
            </div>

            <div className="bg-slate-900 rounded-lg p-4 shadow-md">
                <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <Download size={20} />
                    Data Management
                </h2>

                <p className="text-sm text-slate-400 mb-4">
                    Download your entire pantry inventory as a CSV file for backup or external use.
                </p>

                <a
                    href="/api/export"
                    download="larder-inventory.csv"
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                    <Download size={20} />
                    Export to CSV
                </a>
            </div>
        </div>
    );
}
