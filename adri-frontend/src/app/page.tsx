'use client';
import { useEffect, useState } from 'react';
import girl from './assets/girl.jpg'; // ✅ fixed import
import logo from './assets/logo.png';

export default function Home() {
  const steps = ['LETS', 'START', 'YOUR', 'JOURNEY'];
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

  const handleClose = () => {
    window?.electronAPI?.closeWindow(); // ✅ this is correct
  };
  
  const handleStart = () => {
    window?.electronAPI?.openMiniWindow(); // ✅ also correct
  };
  

  return (
    <div className="h-screen w-screen m-0 flex justify-center items-center overflow-hidden bg-transparent select-none">
      <div className="w-[300px] h-[300px] rounded-2xl p-5 relative backdrop-blur-md bg-white/10 border border-white/20 shadow-lg">
        {/* Logo */}
        <img
  src={logo.src}
  alt="Logo"
  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
/>


        {/* Close Button */}
        <button
  onClick={handleClose}
  className="absolute top-3 right-3 w-8 h-8 bg-black text-white rounded-full text-lg flex justify-center items-center transition-all duration-200 hover:scale-110 hover:bg-red-600"
>
  ✕
</button>


        {/* Content */}
        <div className="flex mt-10">
          {/* Image */}
          <div className="flex-1 mr-3 rounded-xl overflow-hidden">
            <img src={girl.src} alt="Profile" className="w-full h-full object-cover" />
          </div>

          {/* Typing Text */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-sm font-bold text-black leading-snug whitespace-pre-line m-0">
              {displayedText}
            </p>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex justify-end mt-4">
        <button
  onClick={handleStart}
  className="bg-black text-white rounded-full px-4 py-1 text-xs transition-all duration-300 hover:bg-white hover:text-black hover:shadow-[0_0_10px_rgba(255,255,255,0.6)]"
>
  START
</button>
        </div>
      </div>
    </div>
  );
}
