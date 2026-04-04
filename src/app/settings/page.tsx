"use client";

import { useState, useEffect } from 'react';
import { Bell, Save, Download, Camera } from 'lucide-react';

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
    const [haUrl, setHaUrl] = useState('');
    const [haToken, setHaToken] = useState('');
    const [haService, setHaService] = useState('');
    const [loading, setLoading] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [preferredCamera, setPreferredCamera] = useState('');

    useEffect(() => {
        // Fetch settings
        fetch('/api/settings').then(res => res.json()).then(data => {
            if (data.days) setDays(data.days);
            if (data.haUrl) setHaUrl(data.haUrl);
            if (data.haToken) setHaToken(data.haToken);
            if (data.haService) setHaService(data.haService);
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

        // Fetch cameras
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                const videoDevices = devices.filter(d => d.kind === 'videoinput');
                setCameras(videoDevices);
                
                const savedCamera = localStorage.getItem('preferredCameraId');
                if (savedCamera) {
                    setPreferredCamera(savedCamera);
                } else if (videoDevices.length > 0) {
                    // Default to first camera if nothing saved
                    setPreferredCamera(videoDevices[0].deviceId);
                }
            });
        }
    }, []);

    const handleSaveCamera = () => {
        localStorage.setItem('preferredCameraId', preferredCamera);
        alert('Camera preference saved');
    };

    const handleSaveDays = async () => {
        setLoading(true);
        await fetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ days, haUrl, haToken, haService }),
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
                <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <Bell size={20} className="text-orange-400" />
                    Home Assistant Integration
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">
                            Home Assistant URL
                        </label>
                        <input
                            type="text"
                            placeholder="http://homeassistant.local:8123"
                            value={haUrl}
                            onChange={(e) => setHaUrl(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-100 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1">
                            Long-Lived Access Token
                        </label>
                        <input
                            type="password"
                            placeholder="Paste token here"
                            value={haToken}
                            onChange={(e) => setHaToken(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-100 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1">
                            Notification Services (comma-separated)
                        </label>
                        <input
                            type="text"
                            placeholder="mobile_app_ultra_phone, mobile_app_susan"
                            value={haService}
                            onChange={(e) => setHaService(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-100 text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Example: mobile_app_phone, persistent_notification
                        </p>
                    </div>

                    <button
                        onClick={handleSaveDays}
                        disabled={loading}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <Save size={16} /> {loading ? 'Saving...' : 'Save HA Settings'}
                    </button>
                </div>
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

            <div className="bg-slate-900 rounded-lg p-4 mb-6 shadow-md">
                <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <Camera size={20} className="text-indigo-400" />
                    Camera Settings
                </h2>

                <div className="mb-4">
                    <label className="block text-sm text-slate-400 mb-2">
                        Default Scanner Camera
                    </label>
                    {cameras.length > 0 ? (
                        <select
                            value={preferredCamera}
                            onChange={(e) => setPreferredCamera(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-100 text-sm"
                        >
                            {cameras.map((camera, i) => (
                                <option key={camera.deviceId} value={camera.deviceId}>
                                    {camera.label || `Camera ${i + 1}`}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-sm text-slate-500 italic">No cameras detected or permission not granted.</p>
                    )}
                </div>

                <button
                    onClick={handleSaveCamera}
                    disabled={cameras.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                    <Save size={16} /> Save Camera Preference
                </button>
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
