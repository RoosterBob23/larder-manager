"use client";

import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
    useEffect(() => {
        const scanner = new Html5Qrcode("reader");
        let isStarted = false;

        const startScanner = async () => {
            try {
                const devices = await Html5Qrcode.getCameras();
                
                let cameraConfig: any = { facingMode: "environment" };
                if (devices && devices.length >= 2) {
                    cameraConfig = devices[1].id;
                }

                await scanner.start(
                    cameraConfig,
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                    },
                    (decodedText) => {
                        scanner.stop().then(() => {
                            onScan(decodedText);
                        }).catch(err => console.error("Failed to stop scanner", err));
                    },
                    (error) => {
                        // console.warn(error);
                    }
                );
                isStarted = true;
            } catch (err) {
                console.error("Failed to start scanner", err);
            }
        };

        startScanner();

        return () => {
            if (isStarted) {
                scanner.stop().catch(err => console.error('Failed to clear scanner', err));
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-2 rounded-lg w-full max-w-sm">
                <div id="reader"></div>
            </div>
            <button
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-red-600 text-white rounded-full font-medium"
            >
                Cancel
            </button>
        </div>
    );
}
