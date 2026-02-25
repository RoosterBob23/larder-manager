"use client";

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Props {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            },
      /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                scanner.clear();
                onScan(decodedText);
            },
            (error) => {
                // console.warn(error);
            }
        );

        return () => {
            scanner.clear().catch(err => console.log('Failed to clear scanner', err));
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
