'use client';

import { useEffect, useState } from 'react';
import girl from './assets/girl.jpg';

export default function Home() {
  const finalText = `Welcome to Speech Tutor

> Your AI learning companion
> Preparing session for you...
> Loading voice engine...
> Microphone access: granted
> Environment: clear
> Starting session shortly...
> Ready when you are`;

  const [typedText, setTypedText] = useState('');
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (charIndex < finalText.length) {
      const timeout = setTimeout(() => {
        setTypedText((prev) => prev + finalText[charIndex]);
        setCharIndex((prev) => prev + 1);
      }, 20);
      return () => clearTimeout(timeout);
    }
  }, [charIndex]);

  const handleStart = () => {
    window?.electronAPI?.openMiniWindow?.();
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="w-[700px] h-[420px] bg-[#555] rounded-sm flex p-6 gap-6 shadow-lg">
        {/* Left - Image */}
        <div className="w-[200px] h-[300px] rounded-lg overflow-hidden">
          <img src={girl.src} alt="Profile" className="w-full h-full object-cover" />
        </div>

        {/* Right - Terminal area with button */}
        <div className="flex flex-col justify-start flex-1">
          <div
            className="bg-black text-white p-4 rounded-lg h-[250px] overflow-hidden text-xs font-semibold leading-relaxed shadow-inner whitespace-pre-line"
            style={{ fontFamily: 'Arial, Calibri, sans-serif' }}
          >
            {typedText}
          </div>

          {/* Start Button directly below */}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleStart}
              className="bg-white text-black font-bold text-xs px-6 py-2 rounded-full tracking-wide hover:bg-black hover:text-white border hover:border-white transition-all duration-200"
            >
              START →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
