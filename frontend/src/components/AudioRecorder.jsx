import React, { useState, useRef } from 'react';

function AudioRecorder({ onTranscription }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const API_BASE = import.meta.env.VITE_API_URL || 'https://webai-production-b975.up.railway.app';

  const startRecording = async () => {
    setTranscript('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
          const response = await fetch(`${API_BASE}/transcribe`, {
            method: 'POST',
            body: formData
          });
          const data = await response.json();
          setTranscript(data.transcript);
          onTranscription(data.transcript);
        } catch (err) {
          console.error('Transcription failed:', err);
          alert('Gagal mentranskripsi audio.');
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
      alert('Microphone access ditolak atau tidak tersedia.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="audio-recorder">
      <p><strong>Rekam Jawaban:</strong></p>
      <div className="button-group">
        {!isRecording ? (
          <button onClick={startRecording} className="btn btn-outline-danger me-2">
            🎙️ Mulai Rekam
          </button>
        ) : (
          <button onClick={stopRecording} className="btn btn-outline-dark">
            ⏹️ Stop & Kirim
          </button>
        )}
      </div>
      {transcript && (
        <div className="transcript-box mt-3 fade-in-text">
          <p><strong>Hasil Transkripsi:</strong> {transcript}</p>
        </div>
      )}
    </div>
  );
}

export default AudioRecorder;
