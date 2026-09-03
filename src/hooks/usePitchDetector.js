import { useCallback, useEffect, useRef, useState } from 'react'
import { PitchDetector } from 'pitchy'

const FFT_SIZE = 4096
const CLARITY_THRESHOLD = 0.9 // how confident pitchy is that there's a real fundamental
const MIN_RMS = 0.01 // gate out silence/room noise

// Listens to the mic and reports the currently detected pitch, if any.
// Consumers get back { frequency, clarity } or null when nothing clear is playing.
export function usePitchDetector() {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState(null)
  const [pitch, setPitch] = useState(null)

  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const detectorRef = useRef(null)
  const bufferRef = useRef(null)
  const rafRef = useRef(null)
  const streamRef = useRef(null)

  const tick = useCallback(() => {
    const analyser = analyserRef.current
    const detector = detectorRef.current
    const buffer = bufferRef.current
    if (!analyser || !detector || !buffer) return

    analyser.getFloatTimeDomainData(buffer)

    let sumSquares = 0
    for (let i = 0; i < buffer.length; i++) sumSquares += buffer[i] * buffer[i]
    const rms = Math.sqrt(sumSquares / buffer.length)

    if (rms < MIN_RMS) {
      setPitch(null)
    } else {
      const [frequency, clarity] = detector.findPitch(buffer, audioCtxRef.current.sampleRate)
      setPitch(clarity >= CLARITY_THRESHOLD && frequency > 0 ? { frequency, clarity } : null)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  // Lets a VU meter read the live signal without forcing this hook to
  // re-render every animation frame. Returns null until the mic is running.
  const getAnalyser = useCallback(() => analyserRef.current, [])

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    analyserRef.current = null
    detectorRef.current = null
    bufferRef.current = null
    setListening(false)
    setPitch(null)
  }, [])

  const start = useCallback(async () => {
    if (audioCtxRef.current) return
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = FFT_SIZE
      analyser.smoothingTimeConstant = 0.6 // livelier VU meter; doesn't affect pitch (time-domain) data
      source.connect(analyser)

      streamRef.current = stream
      audioCtxRef.current = audioCtx
      analyserRef.current = analyser
      detectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize)
      bufferRef.current = new Float32Array(analyser.fftSize)

      setListening(true)
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      setError(err.message || 'Microphone access was denied.')
      setListening(false)
    }
  }, [tick])

  // Release the mic if the component unmounts while still listening.
  useEffect(() => () => stop(), [stop])

  return { listening, error, pitch, start, stop, getAnalyser }
}
