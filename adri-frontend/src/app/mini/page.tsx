"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Mic, X } from "lucide-react"

export default function MiniWindow() {
  const [isListening, setIsListening] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContextClass()
      analyserRef.current = audioContextRef.current.createAnalyser()
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream)

      sourceRef.current.connect(analyserRef.current)
      visualize()
      setIsListening(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopListening = () => {
    if (sourceRef.current) sourceRef.current.disconnect()
    if (analyserRef.current) analyserRef.current.disconnect()
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    setIsListening(false)
  }

  const visualize = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !analyserRef.current) return

    analyserRef.current.fftSize = 128
    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!isListening) return

      animationRef.current = requestAnimationFrame(draw)
      analyserRef.current?.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const barWidth = canvas.width / bufferLength
      const barSpacing = 2

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8
        const x = i * (barWidth + barSpacing)

        // Create bars with rounded tops
        ctx.fillStyle = "#9CA3AF" // Gray color for bars
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
      }
    }

    draw()
  }

  const handleMouseDown = () => {
    startListening()
  }

  const handleMouseUp = () => {
    stopListening()
  }

  const handleClose = () => {
    stopListening()
    window.location.href = "/"
  }

  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 flex items-center justify-center p-6">
      {/* Main Interface */}
      <div className="relative w-[400px] bg-white/80 backdrop-blur-sm border border-white/30 rounded-3xl shadow-2xl overflow-hidden">
        {/* Close Button */}
        <Button
          onClick={handleClose}
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 z-10 w-10 h-10 p-0 bg-red-500/90 text-white rounded-full hover:bg-red-600 hover:scale-110 transition-all shadow-lg"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Video/Image Area */}
        <div className="relative w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/placeholder.svg?height=256&width=400&text=AI+Coach"
              alt="AI Coach"
              width={400}
              height={256}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Listening Indicator Overlay */}
          {isListening && (
            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
              <div className="bg-blue-600/90 text-white px-4 py-2 rounded-full text-sm font-medium animate-pulse">
                🎤 Listening...
              </div>
            </div>
          )}
        </div>

        {/* Controls Area */}
        <div className="p-6">
          <div className="flex items-center gap-4">
            {/* Hold to Talk Button */}
            <Button
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp} // Stop if mouse leaves button
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 select-none ${
                isListening
                  ? "bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/25 scale-110"
                  : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25"
              }`}
            >
              <Mic className="w-6 h-6 text-white" />
            </Button>

            {/* Audio Visualizer */}
            <div className="flex-1">
              <canvas ref={canvasRef} width={280} height={40} className="w-full h-10 rounded-lg bg-gray-50" />
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {isListening ? (
                <span className="flex items-center justify-center gap-2 text-blue-600 font-medium">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Hold to keep talking
                </span>
              ) : (
                "Hold microphone button to speak"
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
