'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const steps = [
    'LETS',
    'START',
    'YOUR',
    'JOURNEY',
  ];

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
    window?.require?.('electron')?.ipcRenderer?.send('close-window');
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: 'transparent',
        margin: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        WebkitAppRegion: 'drag',
      } as any}
    >
      <div
        style={{
          width: 300,
          height: 300,
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 20,
          padding: 20,
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          WebkitAppRegion: 'no-drag', // Prevents dragging the card itself
        } as any}
      >
        {/* Logo top-left */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            width: 32,
            height: 32,
            borderRadius: '50%',
            overflow: 'hidden',
            WebkitAppRegion: 'no-drag',
          } as any}
        >
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              WebkitAppRegion: 'no-drag',
            } as any}
          />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'black',
            color: 'white',
            fontSize: 16,
            border: 'none',
            cursor: 'pointer',
            WebkitAppRegion: 'no-drag',
          } as any}
        >
          ✕
        </button>

        {/* Content */}
        <div style={{ display: 'flex', marginTop: 40 }}>
          {/* Left Image */}
          <div
            style={{
              flex: 1,
              borderRadius: 12,
              overflow: 'hidden',
              marginRight: 12,
              WebkitAppRegion: 'no-drag',
            } as any}
          >
            <img
              src="/girl.jpg"
              alt="Profile"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                WebkitAppRegion: 'no-drag',
              } as any}
            />
          </div>

          {/* Right Typing Text */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              WebkitAppRegion: 'no-drag',
            } as any}
          >
            <p
              style={{
                fontWeight: 'bold',
                fontSize: 14,
                lineHeight: '1.5',
                color: '#000',
                margin: 0,
                whiteSpace: 'pre-line',
              }}
            >
              {displayedText}
            </p>
          </div>
        </div>

        {/* Start Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            style={{
              backgroundColor: 'black',
              color: 'white',
              borderRadius: 9999,
              padding: '6px 16px',
              fontSize: 12,
              border: 'none',
              cursor: 'pointer',
              WebkitAppRegion: 'no-drag',
            } as any}
          >
            START
          </button>
        </div>
      </div>
    </div>
  );
}
