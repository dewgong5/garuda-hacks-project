"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import girl from '@/app/assets/girl2.jpg'

export default function PushToTalkPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [micPermission, setMicPermission] = useState<"granted" | "denied" | "prompt">("prompt")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Initialize microphone
  const initializeMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      streamRef.current = stream
      setMicPermission("granted")

      // Set up audio analysis
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      analyserRef.current.fftSize = 256

      return stream
    } catch (error) {
      console.error("Microphone access denied:", error)
      setMicPermission("denied")
      return null
    }
  }, [])

  // Audio level monitoring
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const updateLevel = () => {
      if (!isRecording) return

      analyserRef.current!.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      setAudioLevel(average / 255) // Normalize to 0-1

      animationFrameRef.current = requestAnimationFrame(updateLevel)
    }

    updateLevel()
  }, [isRecording])

  // Start recording
  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      const stream = await initializeMicrophone()
      if (!stream) return
    }

    setIsRecording(true)

    // Start MediaRecorder
    mediaRecorderRef.current = new MediaRecorder(streamRef.current!)
    mediaRecorderRef.current.start()

    // Start audio level monitoring
    monitorAudioLevel()

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        // Handle recorded audio data here
        console.log("Audio data available:", event.data)
      }
    }
  }, [initializeMicrophone, monitorAudioLevel])

  // Stop recording
  const stopRecording = useCallback(() => {
    setIsRecording(false)
    setAudioLevel(0)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }, [])

  // Handle mouse/touch events for push-to-talk
  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      startRecording()
    },
    [startRecording],
  )

  const handleMouseUp = useCallback(() => {
    stopRecording()
  }, [stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      {/* Fixed Size Container */}
      <div className="relative overflow-hidden rounded-lg" style={{ width: "175px", height: "275px" }}>
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={girl.src}
            alt="Background"
            width={175}
            height={250}
            className="w-full h-full object-cover"
            priority
          />
        </div>

        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 z-5 bg-black/20" />

        {/* Push-to-Talk Button positioned at bottom left */}
        <div className="absolute bottom-3 left-3 z-10">
          {/* Animated waves */}
          {isRecording && (
            <>
              <div
                className="absolute inset-0 rounded-full border border-blue-400 animate-ping"
                style={{
                  animationDuration: "1s",
                  transform: `scale(${1 + audioLevel * 0.3})`,
                }}
              />
              <div
                className="absolute inset-0 rounded-full border border-purple-400 animate-ping"
                style={{
                  animationDuration: "1.5s",
                  animationDelay: "0.2s",
                  transform: `scale(${1 + audioLevel * 0.5})`,
                }}
              />
              <div
                className="absolute inset-0 rounded-full border border-cyan-400 animate-ping"
                style={{
                  animationDuration: "2s",
                  animationDelay: "0.4s",
                  transform: `scale(${1 + audioLevel * 0.7})`,
                }}
              />
            </>
          )}

          {/* Compact Mic Button */}
          <button
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            className={`
            relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm
            ${
              isRecording
                ? "bg-red-500/90 scale-110 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                : "bg-blue-600/90 shadow-[0_0_10px_rgba(37,99,235,0.6)] hover:bg-blue-500/90"
            }
          `}
            disabled={micPermission === "denied"}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path
                  d="M12 15.5C14.21 15.5 16 13.71 16 11.5V6C16 3.79 14.21 2 12 2C9.79 2 8 3.79 8 6V11.5C8 13.71 9.79 15.5 12 15.5Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.34998 9.6499V11.3499C4.34998 15.5699 7.77998 18.9999 12 18.9999C16.22 18.9999 19.65 15.5699 19.65 11.3499V9.6499"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 19V22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        </div>

        {/* Compact Status Indicator */}
        {isRecording && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-red-500/80 backdrop-blur-sm rounded-full px-2 py-1">
              <p className="text-white text-xs font-medium">REC</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
