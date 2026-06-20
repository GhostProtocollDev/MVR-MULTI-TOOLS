'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { motion } from "framer-motion"
import { Spinner } from "@/components/ui"

interface Artist {
  id: string; name: string; slug: string; genre: string | null
  albums: Album[]
  _count: { tracks: number }
}

interface Album {
  id: string; title: string; slug: string; year: number; coverImage: string | null
  _count: { tracks: number }
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

export default function ArtistPage({ params }: { params: { slug: string } }) {
  const [artist, setArtist] = useState<Artist | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/music").then(r => r.json()).then(d => {
      const found = d.artists?.find((a: any) => a.slug === params.slug) || null
      setArtist(found)
    }).finally(() => setLoading(false))
  }, [params.slug])

  useEffect(() => {
    if (!artist?.id) return
    fetch(`/api/music?artistId=${artist.id}`).then(r => r.json()).then(d => {
      setArtist(prev => prev ? { ...prev, albums: d.albums || [] } : null)
    })
  }, [artist?.id])

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!artist) return notFound()

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Link href="/dashboard/music" className="text-sm text-zinc-400 hover:text-white transition-colors">← Volver a Música</Link>

      <div className="flex items-end gap-6">
        <div className={`w-40 h-40 rounded-2xl bg-gradient-to-br ${GENRE_COLORS[artist.genre || ""] || "from-zinc-700 to-zinc-500"} flex items-center justify-center text-7xl`}>
          🎤
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">{artist.genre || "Artista"}</p>
          <h1 className="text-4xl font-bold text-white">{artist.name}</h1>
          <p className="text-zinc-400 mt-2">{artist.albums?.length || 0} álbumes · {artist._count?.tracks || 0} pistas</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 mb-4">Álbumes</h2>
        {!artist.albums?.length ? (
          <p className="text-zinc-500 text-sm">No hay álbumes aún</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {artist.albums.map(album => (
              <Link key={album.id} href={`/dashboard/music/album/${album.slug}`}>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden cursor-pointer hover:border-zinc-700 transition-all duration-200">
                  <div className="aspect-square bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center text-5xl">💿</div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-white truncate">{album.title}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{album.year} · {album._count?.tracks || 0} pistas</p>
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
