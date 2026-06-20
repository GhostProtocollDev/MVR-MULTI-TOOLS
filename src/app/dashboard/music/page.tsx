'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button, Spinner } from "@/components/ui"
import { useMusicStore } from "@/store/music"

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
  album: { id: string; title: string; slug: string; coverImage: string | null; year: number }
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

export default function MusicPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({ title: "", artistId: "", albumId: "", trackNumber: "1" })
  const [artistAlbums, setArtistAlbums] = useState<Album[]>([])

  const { currentTrack, isPlaying, playTrack } = useMusicStore()

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
          <p className="text-zinc-400 mt-1">Biblioteca musical · 12 artistas</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          Subir música
        </Button>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          placeholder="Buscar artista, álbum o canción..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50"
        />
      </div>

      {showUpload && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-4">
          <h3 className="text-lg font-semibold text-white">Subir Canción</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <input id="file-input" type="file" accept="audio/mp3,audio/mp4,audio/mpeg,audio/ogg,audio/wav" required className="text-sm text-zinc-400 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white" />
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

      {searchResults.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Resultados: {searchResults.length} canciones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {searchResults.map(track => (
              <div key={track.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <button onClick={() => playTrack(track)} className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 hover:bg-primary/30 transition-colors">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  ) : (
                    <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19"/></svg>
                  )}
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

      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 mb-4">Artistas</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {artists.map(artist => (
              <Link key={artist.id} href={`/dashboard/music/artista/${artist.slug}`}>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden group cursor-pointer hover:border-zinc-700 transition-all duration-200">
                  <div className={`aspect-square bg-gradient-to-br ${GENRE_COLORS[artist.genre || ""] || "from-zinc-700 to-zinc-500"} flex items-center justify-center overflow-hidden`}>
                    {artist.image ? (
                      <img src={artist.image} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <span className="text-5xl">🎤</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-white truncate">{artist.name}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{artist.genre || "—"}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">{artist._count.albums} álbumes · {artist._count.tracks} canciones</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
