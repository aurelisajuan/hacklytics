"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Square, Mic, RotateCcw, Check, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type MatchStatus = "none" | "success" | "failure"

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioData, setAudioData] = useState<Float32Array | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBase64, setAudioBase64] = useState<string | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [matchStatus, setMatchStatus] = useState<MatchStatus>("none")

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [])
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioContextRef.current = new AudioContext()

      const chunks: Blob[] = []
      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorderRef.current.onstop = async () => {
        // Create WAV blob
        const blob = new Blob(chunks, { type: "audio/wav" })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)

        // // Create FormData and append WAV file
        // const formData = new FormData()
        // formData.append('audio', blob, 'recording.wav')


        // Process audio for waveform visualization
        const arrayBuffer = await blob.arrayBuffer()
        const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer)
        setAudioData(audioBuffer.getChannelData(0))
        drawWaveform(audioBuffer.getChannelData(0))
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingDuration(0)
      setMatchStatus("none")
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }


  const drawWaveform = (data: Float32Array, progress = 0) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)

    const sliceWidth = canvas.width / data.length
    for (let i = 0; i < data.length; i++) {
      const x = i * sliceWidth
      const y = (data[i] * canvas.height) / 2 + canvas.height / 2

      ctx.lineTo(x, y)
    }

    ctx.strokeStyle = "#4B5563"
    ctx.stroke()

    // Highlight the part of the waveform that has been played
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)
    for (let i = 0; i < data.length * progress; i++) {
      const x = i * sliceWidth
      const y = (data[i] * canvas.height) / 2 + canvas.height / 2

      ctx.lineTo(x, y)
    }
    ctx.strokeStyle = "#60A5FA"
    ctx.stroke()
  }

  const playAudio = () => {
    if (audioRef.current && audioData) {
      audioRef.current.play()
      setIsPlaying(true)

      const updateWaveform = () => {
        if (audioRef.current) {
          const progress = audioRef.current.currentTime / audioRef.current.duration
          drawWaveform(audioData, progress)

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(updateWaveform)
          } else {
            setIsPlaying(false)
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateWaveform)
    }
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioData) {
        drawWaveform(audioData)
      }
    }
  }

  const reRecord = () => {
    setAudioUrl(null)
    setAudioData(null)
    setAudioBase64(null)
    setRecordingDuration(0)
    setMatchStatus("none")
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-start max-w-4xl px-6 mx-auto mt-6 space-x-6 rounded-xl">
      <div className="flex flex-col items-center flex-1 space-y-1">
        <motion.h2
          className="text-2xl font-semibold text-gray-700"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
        </motion.h2>
        <div className="relative w-full px-4 bg-white rounded-lg shadow-inner">
          <canvas ref={canvasRef} width={300} height={100} className="w-full rounded-md" />
          <AnimatePresence>
            {isRecording && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-4xl font-bold text-white"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  {formatDuration(recordingDuration)}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex space-x-4">
          <AnimatePresence mode="wait">
            {!isRecording && !audioUrl && (
              <motion.div
                key="record"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600">
                  <Mic className="w-4 h-4 mr-2" />
                  Record
                </Button>
              </motion.div>
            )}
            {isRecording && (
              <motion.div
                key="stop"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <Button onClick={stopRecording} className="bg-gray-500 hover:bg-gray-600">
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </motion.div>
            )}
            {audioUrl && !isPlaying && (
              <motion.div
                key="playback"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="flex space-x-2"
              >
                <Button onClick={playAudio} className="bg-green-500 hover:bg-green-600">
                  <Play className="w-4 h-4 mr-2" />
                  Play
                </Button>
                <Button onClick={reRecord} className="bg-blue-500 hover:bg-blue-600">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Re-record
                </Button>
              </motion.div>
            )}
            {audioUrl && isPlaying && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <Button onClick={stopAudio} className="bg-yellow-500 hover:bg-yellow-600">
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {audioUrl && <audio ref={audioRef} src={audioUrl} />}
        {audioBase64 && (
          <motion.div
            className="mt-2 text-sm text-gray-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Audio stored as base64 ({audioBase64.length} characters)
          </motion.div>
        )}
      </div>
      <AnimatePresence mode="wait">
        {matchStatus !== "none" && (
          <motion.div
            key={matchStatus}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.5 }}
            className={`w-64 h-64 rounded-2xl shadow-lg flex flex-col items-center justify-center space-y-4 ${matchStatus === "success"
                ? "bg-gradient-to-br from-green-400 to-blue-500"
                : "bg-gradient-to-br from-red-400 to-pink-500"
              }`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
              className="flex items-center justify-center w-20 h-20 bg-white rounded-full"
            >
              {matchStatus === "success" ? (
                <Check className="w-12 h-12 text-green-500" />
              ) : (
                <X className="w-12 h-12 text-red-500" />
              )}
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-2xl font-bold text-white"
            >
              {matchStatus === "success" ? "Match Found" : "No Match"}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="px-4 text-center text-white"
            >
              {matchStatus === "success"
                ? "The recorded audio matches an existing sample."
                : "The recorded audio does not match any existing samples."}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

