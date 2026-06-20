'use client'

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { motion } from "framer-motion"
import { Spinner } from "@/components/ui"

interface Track {
  id: string; title: string; trackNumber: number; filePath: string | null
  duration: number | null; plays: number
  artist: { id: string; name: string; slug: string }
  album: { id: string; title: string; slug: string; coverImage: string | null; year: number }
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}

export default function AlbumPage({ params }: { params: { slug: string } }) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [albumInfo, setAlbumInfo] = useState<{ title: string; year: number; artistName: string; artistSlug: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.volume = volume
    return () => { audioRef.current?.pause(); audioRef.current = null }
  }, [])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onDuration = () => setDuration(audio.duration)
    const onEnd = () => { setIsPlaying(false); setCurrentTime(0) }
    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("loadedmetadata", onDuration)
    audio.addEventListener("ended", onEnd)
    return () => {
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("loadedmetadata", onDuration)
      audio.removeEventListener("ended", onEnd)
    }
  }, [currentTrack])

  function playTrack(track: Track) {
    if (!track.filePath) return
    const audio = audioRef.current
    if (!audio) return
    if (currentTrack?.id === track.id) {
      if (isPlaying) { audio.pause(); setIsPlaying(false) }
      else { audio.play(); setIsPlaying(true) }
      return
    }
    audio.src = `/api/music/${track.id}/stream`
    audio.play().catch(() => {})
    setCurrentTrack(track)
    setIsPlaying(true)
    setCurrentTime(0)
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * duration
  }

  useEffect(() => {
    fetch("/api/music").then(r => r.json()).then(async d => {
      const albums = d.artists?.flatMap((a: any) => a.slug ? [] : []) || []
      // Find album by slug across all artists
      let foundAlbum: any = null
      let foundArtist: any = null
      for (const artist of d.artists || []) {
        const res = await fetch(`/api/music?artistId=${artist.id}`)
        const ad = await res.json()
        const album = ad.albums?.find((a: any) => a.slug === params.slug)
        if (album) { foundAlbum = album; foundArtist = artist; break }
      }
      if (foundAlbum) {
        setAlbumInfo({ title: foundAlbum.title, year: foundAlbum.year, artistName: foundArtist.name, artistSlug: foundArtist.slug })
        const res = await fetch(`/api/music?albumId=${foundAlbum.id}`)
        const td = await res.json()
        setTracks(td.tracks || [])
      }
      setLoading(false)
    })
  }, [params.slug])

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!albumInfo && !loading) return notFound()

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-28">
      <Link href="/dashboard/music" className="text-sm text-zinc-400 hover:text-white transition-colors">← Volver a Música</Link>

      {albumInfo && (
        <div className="flex items-end gap-6">
          <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center text-7xl">💿</div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
              <Link href={`/dashboard/music/artista/${albumInfo.artistSlug}`} className="hover:text-white transition-colors">
                {albumInfo.artistName}
              </Link>
            </p>
            <h1 className="text-3xl font-bold text-white">{albumInfo.title}</h1>
            <p className="text-zinc-400 mt-1">{albumInfo.year} · {tracks.length} pistas</p>
          </div>
        </div>
      )}

      {/* Track List */}
      <div className="space-y-1">
        {tracks.length === 0 ? (
          <p className="text-zinc-500 text-sm py-8 text-center">No hay canciones aún. ¡Sube la primera!</p>
        ) : (
          tracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id && isPlaying
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${isCurrent ? 'bg-primary/10 border border-primary/20' : 'hover:bg-zinc-800/50 border border-transparent'}`}
              >
                <span className="w-6 text-right text-xs text-zinc-500 font-mono">{track.trackNumber}</span>
                <button
                  onClick={() => playTrack(track)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${isCurrent ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
                >
                  {isCurrent ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19"/></svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isCurrent ? 'text-primary' : 'text-white'}`}>{track.title}</p>
                  <p className="text-[11px] text-zinc-400">{track.plays} plays</p>
                </div>
                <a
                  href={`/api/music/${track.id}/download`}
                  className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors shrink-0"
                  title="Descargar MP3/MP4"
                >
                  <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </a>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Player Bar */}
      {currentTrack && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 px-4 flex items-center gap-4"
        >
          <div className="flex items-center gap-3 w-60 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-lg shrink-0">🎵</div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate">{currentTrack.title}</p>
              <p className="text-[11px] text-zinc-400 truncate">{currentTrack.artist.name}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1 max-w-xl mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const audio = audioRef.current
                  if (!audio || !currentTrack) return
                  if (isPlaying) { audio.pause(); setIsPlaying(false) }
                  else { audio.play().catch(() => {}); setIsPlaying(true) }
                }}
                className="w-8 h-8 rounded-full hover:bg-zinc-800 flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                ) : (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19"/></svg>
                )}
              </button>
            </div>
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
            <a href={`/api/music/${currentTrack.id}/download`} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
              <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </a>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
