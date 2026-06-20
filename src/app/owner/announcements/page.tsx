'use client'

export default function OwnerAnnouncementsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4 text-2xl">📢</div>
      <h1 className="text-xl font-bold text-white mb-2">Announcements</h1>
      <p className="text-sm text-zinc-500 max-w-md">Create and manage system-wide announcements to all users.</p>
    </div>
  )
}
