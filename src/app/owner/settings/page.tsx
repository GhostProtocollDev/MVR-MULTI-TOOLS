'use client'

import { Button } from "@/components/ui"
import toast from "react-hot-toast"

export default function OwnerSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Owner Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">Configure owner account and platform settings</p>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-white font-semibold mb-4">Owner Credentials</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Username</label>
              <input type="text" defaultValue="owner" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" readOnly />
              <p className="text-[10px] text-zinc-600 mt-1">Username cannot be changed via UI. Update via environment variables.</p>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Current Password</label>
              <input type="password" placeholder="Enter current password" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">New Password</label>
                <input type="password" placeholder="New password" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Confirm Password</label>
                <input type="password" placeholder="Confirm new password" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
            </div>
            <Button className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm" onClick={() => toast.success("Password updated")}>
              Update Password
            </Button>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6">
          <h2 className="text-white font-semibold mb-4">Session Configuration</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-300">Maximum Active Sessions</div>
                <div className="text-xs text-zinc-500">Currently set to 5</div>
              </div>
              <input type="number" defaultValue={5} className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white text-center" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-300">Session Duration</div>
                <div className="text-xs text-zinc-500">Currently set to 24 hours</div>
              </div>
              <select className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white">
                <option>12 hours</option>
                <option selected>24 hours</option>
                <option>48 hours</option>
                <option>72 hours</option>
              </select>
            </div>
            <Button className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm" onClick={() => toast.success("Session settings saved")}>
              Save Session Settings
            </Button>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6">
          <h2 className="text-white font-semibold mb-4">Danger Zone</h2>
          <div className="space-y-3">
            <Button className="w-full bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-400 text-sm border border-yellow-500/20">
              Initiate Full Platform Reset
            </Button>
            <Button className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 text-sm border border-red-500/20">
              Lock All User Accounts
            </Button>
            <Button className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 text-sm border border-red-500/20">
              Deactivate Owner Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
