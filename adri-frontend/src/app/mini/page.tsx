'use client';

import { useEffect, useRef, useState } from 'react';
import girl from '../assets/girl.jpg'; // Make sure this path is correct

export default function MiniWindow() {
  const [isListening, setIsListening] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const toggleListen = async () => {
    if (isListening) {
      if (sourceRef.current) sourceRef.current.disconnect();
      if (analyserRef.current) analyserRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      setIsListening(false);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      visualize();
      setIsListening(true);
    }
  };

  const visualize = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !analyserRef.current) return;

    analyserRef.current.fftSize = 64;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestAnimationFrame(draw);
      analyserRef.current?.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / bufferLength;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        ctx.fillStyle = '#3b82f6'; // Tailwind blue-500
        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
      }
    };

    draw();
  };

  const handleClose = () => {
    window?.electronAPI?.closeWindow();
  };

  return (
    <div className="w-[250px] h-[190px] bg-[#cae9f5]/90 rounded-2xl shadow-xl p-3 flex flex-col items-center relative select-none backdrop-blur-md border border-white/30">
      
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white text-sm rounded-full flex justify-center items-center hover:scale-110 transition"
      >
        ✕
      </button>

      {/* Profile Image */}
      <div className="w-[90%] h-[115px] rounded-xl overflow-hidden">
        <img src={girl.src} alt="User" className="w-full h-full object-cover" />
      </div>

      {/* Mic Button + Visualizer */}
      <div className="w-full mt-2 flex items-center justify-between px-2">
        {/* Mic Button */}
        <button
          onClick={toggleListen}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xl transition duration-300 ${
            isListening ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'
          }`}
        >
          🎤
        </button>

        {/* Visualizer */}
        <canvas
          ref={canvasRef}
          width={170}
          height={20}
          className="rounded-md bg-white/20 backdrop-blur-sm"
        />
      </div>
    </div>
  );
}
