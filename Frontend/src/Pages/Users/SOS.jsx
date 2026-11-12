import React, { useState, useEffect, useRef } from 'react';
import { sendSOSIncident, checkActiveUserIncident } from '../Admin/Incidents/IncidentApi.js';
import VoiceRecord from './VoiceRecord.jsx';

const COOLDOWN_TIME = 3000;

function SOS() {
    const [showModal, setShowModal] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [isCoolingDown, setIsCoolingDown] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [request, setRequest] = useState(null);
    const [hasActiveIncident, setHasActiveIncident] = useState(false);

    const timerRef = useRef(null);
    const lastClickRef = useRef(0);

    const currentUser = (() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || null;
        } catch {
            return null;
        }
    })();

    // Check MongoDB on load for existing active incidents
    useEffect(() => {
        const identifier = currentUser?.id || currentUser?.email;
        if (identifier) {
            checkActiveUserIncident(identifier)
                .then((res) => {
                    if (res.has_active && res.incident) {
                        setHasActiveIncident(true);
                        setRequest({
                            id: res.incident.reference_no,
                            status: res.incident.status,
                            createdAt: res.incident.createdAt,
                            voicemail_file_id: res.incident.voicemail_file_id
                        });
                    }
                })
                .catch((err) => console.error('Failed to check active SOS:', err));
        }

        return () => clearInterval(timerRef.current);
    }, []);

    const openSOS = () => {
        // If user already has an unresolved incident in MongoDB
        if (hasActiveIncident) {
            setShowModal(true);
            return;
        }

        const now = Date.now();
        if (now - lastClickRef.current < COOLDOWN_TIME) {
            setIsCoolingDown(true);
            setTimeout(() => setIsCoolingDown(false), COOLDOWN_TIME - (now - lastClickRef.current));
            return;
        }
        lastClickRef.current = now;

        setCountdown(10);
        setShowModal(true);
        setErrorMsg('');

        let remaining = 2;
        timerRef.current = setInterval(() => {
            remaining--;
            setCountdown(remaining);

            if (remaining <= 0) {
                clearInterval(timerRef.current);
                timerRef.current = null;
                submitSOS();
            }
        }, 1000);
    };

    const submitSOS = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    sendIncidentPayload(position.coords.latitude, position.coords.longitude);
                },
                () => {
                    sendIncidentPayload(14.3323, 121.0820);
                }
            );
        } else {
            sendIncidentPayload(14.3323, 121.0820);
        }
    };

    const sendIncidentPayload = async (lat, lng) => {
        try {
            const payload = {
                user_id: currentUser?.id,
                email: currentUser?.email,
                contact_number: currentUser?.contact_number,
                incident_type: 'other',
                severity: 'severe',
                barangay: 'Biñan (Poblacion)',
                latitude: lat,
                longitude: lng
            };

            const data = await sendSOSIncident(payload);

            setRequest({
                id: data.reference_no || data.id,
                status: 'Pending',
                createdAt: data.created_at || new Date().toISOString(),
            });

            setHasActiveIncident(true);
        } catch (err) {
            setErrorMsg(err.message);
        }
    };

    const closeSOS = () => {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setShowModal(false);
    };

    return (
        <div className="bg-zinc-900 border-t border-x border-zinc-700 w-full p-5 flex items-center justify-center rounded-t-4xl">
            <div className="p-3 bg-red-500/20 rounded-full hover:bg-red-500/90 transition-colors duration-200">
                <button
                    onClick={openSOS}
                    disabled={isCoolingDown}
                    className={`text-white rounded-full p-10 w-36 font-bold text-sm transition-all ${
                        hasActiveIncident
                            ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                            : isCoolingDown
                            ? 'bg-red-600 cursor-not-allowed opacity-50'
                            : 'bg-red-500 hover:bg-red-600 cursor-pointer'
                    }`}
                >
                    {isCoolingDown 
                        ? 'Wait 3s...' 
                        : hasActiveIncident 
                        ? 'View Active SOS' 
                        : 'Click to send SOS'}
                </button>
            </div>

            {showModal && (
                <div className="bg-black/60 fixed inset-0 z-50 flex justify-center items-center p-4">
                    <div className="bg-zinc-900 p-5 rounded-4xl w-full max-w-md border border-zinc-700 flex flex-col items-center justify-between gap-6">
                        <div className="w-full flex justify-between items-center">
                            <span onClick={closeSOS} className="material-symbols-outlined text-zinc-400 cursor-pointer">close</span>
                            <p className="font-thin text-zinc-300">SOS Status</p>
                            <span className="material-symbols-outlined text-zinc-400">emergency</span>
                        </div>

                        {errorMsg && (
                            <p className="text-red-400 text-xs text-center border border-red-500/30 bg-red-500/10 p-2 rounded-lg w-full">
                                {errorMsg}
                            </p>
                        )}

                        {!hasActiveIncident && !request ? (
                            <div className="flex flex-col items-center gap-6 text-center">
                                <div className="bg-red-500/20 p-5 rounded-full animate-pulse">
                                    <div className="bg-red-500 rounded-full w-36 h-36 flex flex-col items-center justify-center">
                                        <p className="text-white font-bold text-5xl">{countdown}</p>
                                        <p className="text-white text-sm">seconds</p>
                                    </div>
                                </div>
                                <p className="text-white font-semibold text-lg">Preparing SOS Request</p>
                                <button onClick={closeSOS} className="border border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-6 py-3 rounded-xl duration-300 transition-colors cursor-pointer">Cancel SOS</button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-center w-full">
                                <span className="material-symbols-outlined text-amber-500 text-6xl">warning</span>
                                <h2 className="text-white font-semibold text-xl">Active SOS Request</h2>
                                <p className="text-xs text-zinc-400">Reference: <strong className="text-white">{request?.id}</strong></p>
                                
                                {/* Voice Recording Component */}
                                <VoiceRecord incidentRef={request?.id} />

                                <button onClick={closeSOS} className="bg-red-500 hover:bg-red-600 transition-colors text-white px-8 py-3 rounded-xl w-full cursor-pointer duration-300">Close Window</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SOS;