import React, { useState, useEffect, useRef } from 'react';

const MAX_DURATION = 12; // 12 seconds limit

function VoiceRecord({ incidentRef, onSendSuccess }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Clean up Object URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError('');
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // Stop audio track to release microphone access
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // 12-Second countdown timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      setError('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl('');
    setRecordingTime(0);
    setError('');
  };

  const sendVoicemail = async () => {
    if (!audioBlob || !incidentRef || hasSent) return;

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('audio_file', audioBlob, `sos_${incidentRef}.webm`);

    try {
      const response = await fetch(`http://localhost:8000/incidents/${incidentRef}/voicemail`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to send voicemail');
      }

      setHasSent(true);
      if (onSendSuccess) onSendSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // IF ALREADY SENT: Render static confirmation and block any further interaction
  if (hasSent) {
    return (
      <div className="flex items-center justify-center gap-2 w-full bg-green-500/10 border border-green-500/30 p-3 rounded-2xl text-green-400 text-xs font-semibold">
        <span className="material-symbols-outlined text-lg">check_circle</span>
        <span>Voicemail successfully sent to C3 Dispatchers.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full bg-zinc-800/60 p-4 rounded-2xl border border-zinc-700">
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}

      {!audioBlob ? (
        <div className="flex flex-col items-center gap-2">
          {isRecording ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Recording: {recordingTime}s / {MAX_DURATION}s
              </div>

              {/* Stop / Cut Recording Button */}
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white p-6 rounded-full cursor-pointer transition-transform active:scale-95 shadow-lg"
              >
                <span className="material-symbols-outlined text-2xl">square</span>
              </button>
              <p className="text-[11px] text-zinc-400">Click to stop early</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {/* Start Recording Button */}
              <button
                type="button"
                onClick={startRecording}
                className="flex items-center justify-center bg-green-500/20 border border-green-700 hover:bg-green-500 text-green-500 hover:text-white cursor-pointer p-6 rounded-full transition-colors duration-300"
              >
                <span className="material-symbols-outlined text-2xl">mic</span>
              </button>
              <p className="text-xs text-zinc-300 font-medium">Record 12s Voicemail</p>
            </div>
          )}
        </div>
      ) : (
        /* Preview & Actions Before Upload */
        <div className="flex flex-col items-center gap-3 w-full">
          <audio src={audioUrl} controls className="w-full h-9 rounded-lg" />

          <div className="flex items-center gap-2 w-full">
            {/* Re-record Button */}
            <button
              type="button"
              onClick={resetRecording}
              disabled={isUploading}
              className="flex-1 border border-zinc-600 text-zinc-300 hover:bg-zinc-700 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              Re-record
            </button>

            {/* Send Voicemail Button */}
            <button
              type="button"
              onClick={sendVoicemail}
              disabled={isUploading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Sending...' : 'Send Voicemail'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoiceRecord;