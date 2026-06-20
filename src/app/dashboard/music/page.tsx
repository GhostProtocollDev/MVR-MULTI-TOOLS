'use client'

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button, Input, Spinner } from "@/components/ui"

interface Artist {
  id: string; name: string; slug: string; genre: string | null; image: string | null
  _count: { albums: number; tracks: number }
}

interface Album {
  id: string; title: string; slug: string; year: number; coverImage: string | null
  artist: { id: string; name: string; slug: string }
  _count: { tracks: number }
}

interface Track {
  id: string; title: string; trackNumber: number; filePath: string | null
  duration: number | null; plays: number
  artist: { id: string; name: string; slug: string }
  album: { id: string; title: string; slug: string; coverImage: string | null }
}

const GENRE_COLORS: Record<string, string> = {
  "Corridos Tumbados": "from-amber-600 to-yellow-400",
  "Regional Mexicano": "from-red-600 to-orange-400",
  "Hip-Hop/Rap": "from-purple-600 to-pink-400",
  "Rock Alternativo": "from-slate-600 to-gray-400",
  "Indie Rock": "from-teal-600 to-emerald-400",
  "Indie Pop": "from-cyan-600 to-blue-400",
  "Trap Latino": "from-violet-600 to-fuchsia-400",
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}

export default function MusicPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({ title: "", artistId: "", albumId: "", trackNumber: "1" })
  const [selectedArtist, setSelectedArtist] = useState("")
  const [artistAlbums, setArtistAlbums] = useState<Album[]>([])

  // Audio player state
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

  function togglePlay() {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    if (isPlaying) { audio.pause(); setIsPlaying(false) }
    else { audio.play().catch(() => {}); setIsPlaying(true) }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * duration
  }

  useEffect(() => {
    fetch("/api/music").then(r => r.json()).then(d => {
      setArtists(d.artists || [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    const t = setTimeout(() => {
      fetch(`/api/music?search=${encodeURIComponent(search)}`).then(r => r.json()).then(d => {
        setSearchResults(d.searchResults || [])
      })
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  async function handleArtistChange(aid: string) {
    setSelectedArtist(aid)
    setUploadForm(f => ({ ...f, artistId: aid, albumId: "" }))
    if (!aid) { setArtistAlbums([]); return }
    const res = await fetch(`/api/music?artistId=${aid}`)
    const data = await res.json()
    setArtistAlbums(data.albums || [])
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const input = document.getElementById("file-input") as HTMLInputElement
    const file = input?.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) { alert("Max 50MB"); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("title", uploadForm.title)
      fd.append("artistId", uploadForm.artistId)
      fd.append("albumId", uploadForm.albumId)
      fd.append("trackNumber", uploadForm.trackNumber)
      const res = await fetch("/api/music", { method: "POST", body: fd })
      if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.error || "Error"); return }
      alert("Canción subida correctamente")
      setShowUpload(false)
      setUploadForm({ title: "", artistId: "", albumId: "", trackNumber: "1" })
    } catch { alert("Error al subir") }
    finally { setUploading(false) }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-28">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Música</h1>
          <p className="text-zinc-400 mt-1">Biblioteca musical</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          Subir música
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          placeholder="Buscar artista, álbum o canción..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Upload Form */}
      {showUpload && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-4">
          <h3 className="text-lg font-semibold text-white">Subir Canción</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <input id="file-input" type="file" accept="audio/mp3,audio/mp4,audio/mpeg,audio/mp4a,audio/ogg,audio/wav" required className="text-sm text-zinc-400 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80" />
            <input value={uploadForm.title} onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))} placeholder="Título de la canción" required className="w-full input-premium text-sm" />
            <select value={uploadForm.artistId} onChange={e => handleArtistChange(e.target.value)} required className="w-full input-premium text-sm">
              <option value="">Seleccionar artista</option>
              {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select value={uploadForm.albumId} onChange={e => setUploadForm(f => ({ ...f, albumId: e.target.value }))} required className="w-full input-premium text-sm">
              <option value="">Seleccionar álbum</option>
              {artistAlbums.map(a => <option key={a.id} value={a.id}>{a.title} ({a.year})</option>)}
            </select>
            <input type="number" value={uploadForm.trackNumber} onChange={e => setUploadForm(f => ({ ...f, trackNumber: e.target.value }))} placeholder="# de pista" min="1" className="w-full input-premium text-sm" />
            <Button type="submit" loading={uploading}>Subir canción</Button>
          </form>
        </motion.div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Resultados: {searchResults.length} canciones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {searchResults.map(track => (
              <div key={track.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <button onClick={() => playTrack(track)} className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 hover:bg-primary/30 transition-colors">
                  <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19"/></svg>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{track.title}</p>
                  <p className="text-xs text-zinc-400 truncate">{track.artist.name} — {track.album.title}</p>
                </div>
                <a href={`/api/music/${track.id}/download`} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                  <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Artistas Grid */}
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 mb-4">Artistas</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {artists.map(artist => (
              <Link key={artist.id} href={`/dashboard/music/artista/${artist.slug}`}>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden group cursor-pointer hover:border-zinc-700 transition-all duration-200">
                  <div className={`aspect-square bg-gradient-to-br ${GENRE_COLORS[artist.genre || ""] || "from-zinc-700 to-zinc-500"} flex items-center justify-center text-5xl`}>
                    🎤
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-white truncate">{artist.name}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{artist.genre || "—"}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">{artist._count.albums} álbumes · {artist._count.tracks} pistas</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Player Bar */}
      {currentTrack && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 px-4 flex items-center gap-4"
        >
          {/* Track Info */}
          <div className="flex items-center gap-3 w-60 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-lg shrink-0">🎵</div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate">{currentTrack.title}</p>
              <p className="text-[11px] text-zinc-400 truncate">{currentTrack.artist.name}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-1 max-w-xl mx-auto">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="w-8 h-8 rounded-full hover:bg-zinc-800 flex items-center justify-center transition-colors">
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

          {/* Volume + Download */}
          <div className="flex items-center gap-2 w-40 justify-end">
            <input
              type="range" min="0" max="1" step="0.05"
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-primary"
            />
            <a href={`/api/music/${currentTrack.id}/download`} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors" title="Descargar">
              <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </a>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
