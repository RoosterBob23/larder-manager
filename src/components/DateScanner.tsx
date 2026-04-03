"use client";

import { useEffect, useRef, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { Camera, X, Check, RefreshCw } from 'lucide-react';

interface Props {
    onScan: (date: string) => void;
    onClose: () => void;
}

export default function DateScanner({ onScan, onClose }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            let videoConstraints: MediaTrackConstraints = { facingMode: 'environment' };
            if (videoDevices.length >= 2) {
                videoConstraints = { deviceId: { exact: videoDevices[1].deviceId } };
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: false,
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please ensure you are on HTTPS and have given permission.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const captureFrame = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(dataUrl);
                stopCamera();
            }
        }
    };

    const retake = () => {
        setCapturedImage(null);
        startCamera();
    };

    const processImage = async () => {
        if (!capturedImage) return;
        setProcessing(true);
        setError(null);

        try {
            const worker = await createWorker('eng');
            const { data: { text } } = await worker.recognize(capturedImage);
            await worker.terminate();

            console.log("OCR Result:", text);
            const parsedDate = extractDate(text);

            if (parsedDate) {
                onScan(parsedDate);
            } else {
                setError("Could not find a clear date. Please try again or enter manually.");
                setCapturedImage(null);
                startCamera();
            }
        } catch (err) {
            console.error("OCR Error:", err);
            setError("Error processing image.");
        } finally {
            setProcessing(false);
        }
    };

    const extractDate = (text: string): string | null => {
        // Basic date parsing logic
        // Look for YYYY-MM-DD or MM/DD/YYYY or DD/MM/YYYY or MM-DD-YY
        const dateRegexes = [
            /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/, // YYYY-MM-DD
            /\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/, // MM/DD/YYYY or DD/MM/YYYY
            /\b(\d{1,2})[-/](\d{1,2})[-/](\d{2})\b/, // MM/DD/YY
            /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})\b/i, // JAN 2025
            /\b(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{4})\b/i, // 15 JAN 2025
        ];

        for (const regex of dateRegexes) {
            const match = text.match(regex);
            if (match) {
                // This is a very rough extraction. 
                // For simplicity, if we find a match, we'll try to convert it to a valid date string for the input
                try {
                    const d = new Date(match[0]);
                    if (!isNaN(d.getTime())) {
                        return d.toISOString().split('T')[0];
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        return null;
    };

    return (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-sm bg-slate-900 rounded-lg overflow-hidden shadow-2xl border border-slate-700">
                <div className="p-4 flex justify-between items-center border-b border-slate-800">
                    <h2 className="text-white font-semibold">Scan Expiration Date</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="relative aspect-square bg-black">
                    {!capturedImage ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <img
                            src={capturedImage}
                            alt="Captured"
                            className="w-full h-full object-cover"
                        />
                    )}

                    {processing && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-4 text-center">
                            <RefreshCw className="animate-spin mb-2" size={32} />
                            <p>Extracting text...</p>
                        </div>
                    )}

                    {/* Guidelines overlay */}
                    {!capturedImage && !processing && (
                        <div className="absolute inset-0 border-2 border-indigo-500/30 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-20 border-2 border-dashed border-indigo-400 rounded-lg flex items-center justify-center">
                                <span className="text-indigo-200 text-xs bg-black/40 px-2 py-1 rounded">Align date here</span>
                            </div>
                        </div>
                    )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="p-6 flex flex-col gap-4">
                    {error && <div className="text-red-400 text-sm text-center">{error}</div>}

                    <div className="flex justify-center gap-4">
                        {!capturedImage ? (
                            <button
                                onClick={captureFrame}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-lg flex items-center gap-2 transition-all active:scale-95"
                            >
                                <Camera size={24} />
                                <span className="font-semibold pr-2">Capture</span>
                            </button>
                        ) : (
                            !processing && (
                                <>
                                    <button
                                        onClick={retake}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={20} />
                                        Retake
                                    </button>
                                    <button
                                        onClick={processImage}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                                    >
                                        <Check size={20} />
                                        Confirm
                                    </button>
                                </>
                            )
                        )}
                    </div>

                    <p className="text-slate-500 text-[10px] text-center italic">
                        Tip: Hold the camera steady and ensure good lighting.
                        Standard date formats (MM/DD/YYYY) work best.
                    </p>
                </div>
            </div>
        </div>
    );
}
