'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { motion } from "framer-motion"
import { Spinner } from "@/components/ui"
import { useMusicStore } from "@/store/music"

interface Track {
  id: string; title: string; trackNumber: number; filePath: string | null
  duration: number | null; plays: number
  artist: { id: string; name: string; slug: string }
  album: { id: string; title: string; slug: string; coverImage: string | null; year: number }
}

export default function AlbumPage({ params }: { params: { slug: string } }) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [albumInfo, setAlbumInfo] = useState<{ title: string; year: number; coverImage: string | null; artistName: string; artistSlug: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const { currentTrack, isPlaying, playTrack } = useMusicStore()

  useEffect(() => {
    fetch("/api/music").then(r => r.json()).then(async d => {
      for (const artist of d.artists || []) {
        const res = await fetch(`/api/music?artistId=${artist.id}`)
        const ad = await res.json()
        const album = ad.albums?.find((a: any) => a.slug === params.slug)
        if (album) {
          setAlbumInfo({
            title: album.title,
            year: album.year,
            coverImage: album.coverImage,
            artistName: artist.name,
            artistSlug: artist.slug,
          })
          const tres = await fetch(`/api/music?albumId=${album.id}`)
          const td = await tres.json()
          const allTracks = td.tracks || []
          setTracks(allTracks)
          break
        }
      }
    }).finally(() => setLoading(false))
  }, [params.slug])

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!albumInfo && !loading) return notFound()

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-28">
      <Link href="/dashboard/music" className="text-sm text-zinc-400 hover:text-white transition-colors">← Volver a Música</Link>

      {albumInfo && (
        <div className="flex items-end gap-6">
          <div className="w-44 h-44 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
            {albumInfo.coverImage ? (
              <img src={albumInfo.coverImage} alt={albumInfo.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-7xl">💿</span>
            )}
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
              <Link href={`/dashboard/music/artista/${albumInfo.artistSlug}`} className="hover:text-white transition-colors">
                {albumInfo.artistName}
              </Link>
            </p>
            <h1 className="text-3xl font-bold text-white">{albumInfo.title}</h1>
            <p className="text-zinc-400 mt-1">{albumInfo.year} · {tracks.length} canciones</p>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {tracks.length === 0 ? (
          <p className="text-zinc-500 text-sm py-8 text-center">No hay canciones aún. ¡Sube la primera!</p>
        ) : (
          tracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${isCurrent ? 'bg-primary/10 border border-primary/20' : 'hover:bg-zinc-800/50 border border-transparent'}`}
              >
                <span className="w-6 text-right text-xs text-zinc-500 font-mono">{track.trackNumber}</span>
                <button
                  onClick={() => playTrack(track)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${isCurrent ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}
                >
                  {isCurrent && isPlaying ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19"/></svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isCurrent && isPlaying ? 'text-primary' : 'text-white'}`}>{track.title}</p>
                  <p className="text-[11px] text-zinc-400">{track.plays} plays</p>
                </div>
                <a
                  href={`/api/music/${track.id}/download`}
                  className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors shrink-0"
                  title="Descargar"
                >
                  <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </a>
              </motion.div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}
