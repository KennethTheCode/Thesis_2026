
import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'resq_sos_request';

function SOS() {
    const [showModal, setShowModal] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [request, setRequest] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
        } catch {
            return null;
        }
    });

    const timerRef = useRef(null);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(request));
    }, [request]);

    useEffect(() => {
        return () => clearInterval(timerRef.current);
    }, []);

    const openSOS = () => {
        if (request) {
            setShowModal(true);
            return;
        }

        setCountdown(10);
        setShowModal(true);

        let remaining = 10;

        timerRef.current = setInterval(() => {
            remaining--;
            setCountdown(remaining);

            if (remaining <= 0) {
                clearInterval(timerRef.current);
                timerRef.current = null;

                setRequest({
                    id: `SOS-${Date.now()}`,
                    destination: 'C3 Biñan City Hall',
                    status: 'Pending',
                    createdAt: new Date().toISOString(),
                });
            }
        }, 1000);
    };

    const closeSOS = () => {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setShowModal(false);
    };

    const statusColor = {
        Pending: 'text-yellow-400',
        Approved: 'text-blue-400',
        Rejected: 'text-red-400',
        'Help is on the way': 'text-green-400',
    };

    return (
        <div className="bg-zinc-900 border-t border-x border-zinc-700 w-full p-5 flex items-center justify-center rounded-t-4xl">

            <div className="p-3 bg-red-500/20 rounded-full hover:bg-red-500/90 transition-colors duration-200 hover:animate-pulse">
                <button
                    onClick={openSOS}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full p-10 w-36 font-bold cursor-pointer text-sm"
                >
                    {request ? 'View SOS Request' : 'Click to send SOS'}
                </button>
            </div>

            {showModal && (
                <div className="bg-black/60 fixed inset-0 z-50 flex justify-center items-center p-4">
                    <div className="bg-zinc-900 p-5 rounded-4xl w-full max-w-md min-h-[60vh] border border-zinc-700 flex flex-col items-center justify-between gap-6">

                        <div className="w-full flex justify-between items-center">
                            <span
                                onClick={closeSOS}
                                className="material-symbols-outlined text-zinc-400 cursor-pointer"
                            >
                                close
                            </span>
                            <p className="font-thin text-zinc-300">SOS</p>
                            <span className="material-symbols-outlined text-zinc-400">
                                emergency
                            </span>
                        </div>

                        {!request ? (
                            <div className="flex flex-col items-center gap-6 text-center">
                                <div className="bg-red-500/20 p-5 rounded-full animate-pulse">
                                    <div className="bg-red-500 rounded-full w-36 h-36 flex flex-col items-center justify-center">
                                        <p className="text-white font-bold text-5xl">
                                            {countdown}
                                        </p>
                                        <p className="text-white text-sm">seconds</p>
                                    </div>
                                </div>

                                <p className="text-white font-semibold text-lg">
                                    Preparing SOS Request
                                </p>

                                <p className="text-sm text-zinc-400">
                                    Your SOS request will be submitted when
                                    the countdown finishes.
                                </p>

                                <button
                                    onClick={closeSOS}
                                    className="border border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-6 py-3 rounded-xl"
                                >
                                    Cancel SOS
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-5 text-center w-full">
                                <span className="material-symbols-outlined text-green-500 text-6xl">
                                    check_circle
                                </span>

                                <div>
                                    <h2 className="text-white font-semibold text-xl">
                                        {request.status === 'Pending'
                                            ? 'Incident Sent!'
                                            : `SOS Request ${request.status}`}
                                    </h2>
                                    <p className="text-sm text-zinc-400 mt-2">
                                        Incident sent to C3 Biñan City Hall
                                    </p>
                                </div>

                                <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 w-full text-left space-y-3">
                                    <p className="text-sm text-zinc-400">
                                        Request ID: <span className="text-white">{request.id}</span>
                                    </p>
                                    <p className="text-sm text-zinc-400">
                                        Date: <span className="text-white">{new Date(request.createdAt).toLocaleString()}</span>
                                    </p>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-300 text-sm">
                                            Incident Status
                                        </span>
                                        <span className={`font-semibold text-sm ${statusColor[request.status] || 'text-zinc-300'}`}>
                                            {request.status}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-zinc-500">
                                    Your request is saved on this device.
                                </p>

                                <button
                                    onClick={closeSOS}
                                    className="bg-red-500 hover:bg-red-600 duration-300 cursor-pointer transition-colors text-white px-8 py-3 rounded-xl w-full"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SOS;
