"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

export default function AISpeechCoachCard() {
  const messages = [
    "> Loading voice engine...",
    "> Microphone access: granted",
    "> Environment: clear",
    "> Starting session shortly...",
    "> Ready when you are",
    "> Lock in your progress, one step at a time"
  ]

  const [displayed, setDisplayed] = useState<string[]>([])
  const [cursorVisible, setCursorVisible] = useState(true)

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index < messages.length) {
        setDisplayed((prev) => [...prev, messages[index]])
        index++
      } else {
        clearInterval(interval)
      }
    }, 1200)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const blink = setInterval(() => {
      setCursorVisible((prev) => !prev)
    }, 500)

    return () => clearInterval(blink)
  }, [])

  const handleStart = () => {
    // Navigate to mini-window
    window.location.href = "/mini-window"
  }

  return (
    <div className="w-full max-w-md bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
          <Image
            src="/placeholder.svg?height=64&width=64&text=AI"
            alt="AI Assistant"
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">AI Speech Coach</h2>
          <p className="text-gray-600">Ready to help you improve</p>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-xl p-4 mb-6 h-48 overflow-auto">
        <div className="text-cyan-400 text-sm font-mono space-y-1">
        {displayed.map((line, i) => (
  <div key={i} className="pl-1">{line}</div>
))}

<div className="pl-1">
  <span className="text-cyan-400">{"> "}</span>
  <span className={`inline-block ${cursorVisible ? "opacity-100" : "opacity-0"}`}>|</span>
</div>

        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={handleStart}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
      >
        <div className="flex items-center justify-center gap-3">
          <Zap className="w-5 h-5" />
          <span>Start AI Session</span>
          <div className="text-lg">→</div>
        </div>
      </Button>
    </div>
  )
}
