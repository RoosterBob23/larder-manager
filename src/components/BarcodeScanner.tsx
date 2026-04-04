"use client";

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { RefreshCw, X } from 'lucide-react';

interface Props {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
    const [devices, setDevices] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isStarted, setIsStarted] = useState(false);

    useEffect(() => {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        const initScanner = async () => {
            try {
                const videoDevices = await Html5Qrcode.getCameras();
                setDevices(videoDevices);

                if (videoDevices.length > 0) {
                    const savedId = localStorage.getItem('preferredCameraId');
                    let startIndex = 0;
                    
                    if (savedId) {
                        const foundIndex = videoDevices.findIndex(d => d.id === savedId);
                        if (foundIndex !== -1) startIndex = foundIndex;
                    }
                    
                    setCurrentIndex(startIndex);
                    startScanning(videoDevices[startIndex].id);
                } else {
                    // Fallback to default
                    startScanning({ facingMode: "environment" });
                }
            } catch (err) {
                console.error("Failed to list cameras", err);
                startScanning({ facingMode: "environment" });
            }
        };

        initScanner();

        return () => {
            if (scannerRef.current && isStarted) {
                scannerRef.current.stop().catch(err => console.error('Failed to stop scanner', err));
            }
        };
    }, []);

    const startScanning = async (cameraId: any) => {
        if (!scannerRef.current) return;
        
        try {
            // If already started, stop first
            if (isStarted) {
                await scannerRef.current.stop();
                setIsStarted(false);
            }

            await scannerRef.current.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    if (scannerRef.current) {
                        scannerRef.current.stop().then(() => {
                            onScan(decodedText);
                        }).catch(err => console.error("Failed to stop scanner", err));
                    }
                },
                (error) => {
                    // console.warn(error);
                }
            );
            setIsStarted(true);
            
            // Save preference if it's a specific device ID
            if (typeof cameraId === 'string') {
                localStorage.setItem('preferredCameraId', cameraId);
            }
        } catch (err) {
            console.error("Failed to start scanner", err);
        }
    };

    const switchCamera = () => {
        if (devices.length < 2) return;
        const nextIndex = (currentIndex + 1) % devices.length;
        setCurrentIndex(nextIndex);
        startScanning(devices[nextIndex].id);
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-2 rounded-lg w-full max-w-sm relative">
                <div id="reader"></div>
                
                {devices.length > 1 && (
                    <button
                        onClick={switchCamera}
                        className="absolute top-4 right-4 bg-indigo-600/80 hover:bg-indigo-500 p-2 rounded-full text-white shadow-lg transition-all z-10"
                        title="Switch Camera"
                    >
                        <RefreshCw size={20} />
                    </button>
                )}
            </div>
            
            <button
                onClick={onClose}
                className="mt-6 px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
                <X size={20} />
                Cancel
            </button>
        </div>
    );
}
