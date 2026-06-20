import { create } from "zustand"

interface TrackInfo {
  id: string; title: string; trackNumber: number; filePath: string | null
  artist: { id: string; name: string; slug: string }
  album: { id: string; title: string; slug: string; coverImage: string | null; year: number }
}

interface MusicStore {
  currentTrack: TrackInfo | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  queue: TrackInfo[]
  setVolume: (v: number) => void
  playTrack: (track: TrackInfo) => void
  togglePlay: () => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setQueue: (tracks: TrackInfo[]) => void
}

export const useMusicStore = create<MusicStore>()((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  queue: [],
  setVolume: (v) => set({ volume: v }),
  playTrack: (track) => {
    const current = get().currentTrack
    if (current?.id === track.id) {
      set((s) => ({ isPlaying: !s.isPlaying }))
      return
    }
    set({ currentTrack: track, isPlaying: true, currentTime: 0, duration: 0 })
  },
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setQueue: (tracks) => set({ queue: tracks }),
}))
