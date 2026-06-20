'use client'

import { useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { useMusicStore } from "@/store/music"

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}

export default function MusicPlayerBar() {
  const { currentTrack, isPlaying, currentTime, duration, volume, playTrack, togglePlay, setCurrentTime, setDuration, setVolume } = useMusicStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio()
    return () => { audioRef.current?.pause(); audioRef.current = null }
  }, [])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    if (!currentTrack?.filePath || !audioRef.current) return
    const audio = audioRef.current
    audio.src = `/api/music/${currentTrack.id}/stream`
    audio.play().catch(() => {})
  }, [currentTrack?.id])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.play().catch(() => {})
    else audio.pause()
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onLoaded = () => setDuration(audio.duration)
    const onEnd = () => {
      // Try next in queue
      const store = useMusicStore.getState()
      const idx = store.queue.findIndex(t => t.id === store.currentTrack?.id)
      if (idx >= 0 && idx < store.queue.length - 1) {
        const next = store.queue[idx + 1]
        store.playTrack(next)
      } else {
        useMusicStore.setState({ isPlaying: false })
      }
    }
    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("loadedmetadata", onLoaded)
    audio.addEventListener("ended", onEnd)
    return () => {
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("loadedmetadata", onLoaded)
      audio.removeEventListener("ended", onEnd)
    }
  }, [setCurrentTime, setDuration])

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * duration
  }, [duration])

  if (!currentTrack) return null

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 px-4 flex items-center gap-4"
    >
      <div className="flex items-center gap-3 w-60 min-w-0">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg shrink-0 overflow-hidden">
          {currentTrack.album.coverImage ? (
            <img src={currentTrack.album.coverImage} alt="" className="w-12 h-12 object-cover rounded-lg" />
          ) : (
            <span>💿</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-white font-medium truncate">{currentTrack.title}</p>
          <p className="text-[11px] text-zinc-400 truncate">{currentTrack.artist.name}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center gap-1 max-w-xl mx-auto">
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full hover:bg-zinc-800 flex items-center justify-center transition-colors"
        >
          {isPlaying ? (
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19"/></svg>
          )}
        </button>
        <div className="flex items-center gap-2 w-full">
          <span className="text-[10px] text-zinc-500 w-10 text-right">{formatTime(currentTime)}</span>
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full cursor-pointer group" onClick={seek}>
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
          </div>
          <span className="text-[10px] text-zinc-500 w-10">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 w-40 justify-end">
        <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-20 accent-primary" />
        {currentTrack.filePath && (
          <a href={`/api/music/${currentTrack.id}/download`} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors" title="Descargar">
            <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </a>
        )}
      </div>
    </motion.div>
  )
}
