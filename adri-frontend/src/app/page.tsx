'use client'; // Enables client-side rendering in Next.js

import { useEffect, useState } from 'react';
import girl from './assets/girl.jpg';     // Import profile image
import logo from './assets/logo.png';     // Import logo image

export default function Home() {
  // === Animated Text Logic ===
  const steps = ['LETS', 'START', 'YOUR', 'JOURNEY']; // Words to animate
  const [displayedText, setDisplayedText] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentStep = steps[stepIndex];
      if (charIndex < currentStep.length) {
        setDisplayedText(currentStep.slice(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
      } else {
        setTimeout(() => {
          setCharIndex(0);
          setStepIndex((prev) => (prev + 1) % steps.length);
          setDisplayedText('');
        }, 1000);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [charIndex, stepIndex]);

  // === Electron API handlers ===
  const handleClose = () => {
    window?.electronAPI?.closeWindow();
  };

  const handleStart = () => {
    window?.electronAPI?.openMiniWindow();
  };

  // === UI Rendering ===
  return (
    <div className="h-screen w-screen flex justify-center items-center bg-transparent select-none">
      {/* Main card container */}
      <div className="w-[300px] h-[300px] rounded-2xl p-5 relative backdrop-blur-md bg-[#cfe8ff]/20 border border-white/30 shadow-lg overflow-hidden">


        {/* Logo in top-left */}
        {/* Logo in top-left */}
<div className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/30 backdrop-blur flex items-center justify-center shadow-md overflow-hidden transition-transform duration-300 hover:scale-110">
  <img src={logo.src} alt="Logo" className="w-10 h-10 object-contain rounded-full" />
</div>


        {/* Close Button - top-right corner */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 bg-black text-white rounded-full text-lg flex justify-center items-center transition-all duration-200 hover:scale-110 hover:bg-red-600"
        >
          ✕
        </button>

        {/* Content: Image + Right side (text + button) */}
        <div className="flex mt-10">
          {/* Profile Image */}
          {/* Profile Image */}
<div className="w-[175px] h-[228px] -ml-2 rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-102">
  <img
    src={girl.src}
    alt="Profile"
    className="w-full h-full object-cover"
  />
</div>


          {/* Text + Start Button beside image */}
          <div className="flex flex-col gap-2 pl-4 py-1 flex-1 justify-end">

            {/* Typing text */}
            <p className="text-sm font-bold text-black leading-snug whitespace-pre-line m-0">
              {displayedText}
            </p>

            {/* Start Button (fixed beside image) */}
            <button
  onClick={handleStart}
  className="m-0 bg-black text-white border border-transparent rounded-lg px-5 py-[6px] text-sm font-bold tracking-wide
             transition-all duration-300 ease-in-out
             hover:bg-white hover:text-black hover:border-black hover:scale-105"
>
  START
</button>



          </div>
        </div>
      </div>
    </div>
  );
}
