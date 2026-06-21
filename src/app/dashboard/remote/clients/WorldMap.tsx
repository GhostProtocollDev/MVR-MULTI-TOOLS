"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface MarkerData {
  id: string; clientId: string; lat: number; lng: number; label: string
  status: string; country: string; city: string; os?: string; ip?: string; lastSeen: string
}

interface WorldMapProps { markers: MarkerData[] }

export default function WorldMap({ markers }: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup>(L.layerGroup())

  useEffect(() => {
    if (!containerRef.current || map.current) return
    const m = L.map(containerRef.current, {
      center: [25, 0], zoom: 2.3, zoomControl: true,
      attributionControl: true, worldCopyJump: true, minZoom: 2,
    })
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(m)
    layer.current.addTo(m)
    map.current = m

    const s = document.createElement("style")
    s.textContent = `
      .cyber-popup .leaflet-popup-content-wrapper {
        background: rgba(10,10,20,0.95) !important; color: #00ff88 !important;
        border: 1px solid rgba(0,255,136,0.3) !important; border-radius: 12px !important;
        backdrop-filter: blur(12px) !important; font-family: monospace !important; box-shadow: 0 0 30px rgba(0,255,136,0.15) !important;
      }
      .cyber-popup .leaflet-popup-tip { background: rgba(10,10,20,0.95) !important; border: 1px solid rgba(0,255,136,0.3) !important; }
      @keyframes glowPulse { 0%,100%{box-shadow:0 0 8px 2px currentColor;} 50%{box-shadow:0 0 20px 6px currentColor;} }
      @keyframes scanLine { 0%{transform:translateY(-100%);opacity:0} 10%{opacity:0.4} 90%{opacity:0.4} 100%{transform:translateY(100%);opacity:0} }
    `
    document.head.appendChild(s)
    return () => { m.remove(); map.current = null }
  }, [])

  useEffect(() => {
    if (!layer.current) return
    layer.current.clearLayers()

    markers.forEach(m => {
      if (!m.lat || !m.lng || m.lat === 0) return
      const online = m.status === "online"
      const color = online ? "#00ff88" : m.status === "idle" ? "#facc15" : "#ef4444"
      const glow = online ? "0 0 12px 3px #00ff88, 0 0 24px 6px rgba(0,255,136,0.3)" : "0 0 6px 1px #ef4444"

      const icon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;text-align:center;">
            <div style="
              background:rgba(0,0,0,0.85);color:${color};font-size:9px;font-family:monospace;
              padding:1px 5px;border-radius:3px;white-space:nowrap;margin-bottom:3px;
              border:1px solid ${color};text-shadow:0 0 6px ${color};letter-spacing:0.5px;
            ">${m.label}</div>
            <div style="width:14px;height:14px;background:${color};border-radius:50%;
              border:2px solid rgba(255,255,255,0.8);box-shadow:${glow};margin:0 auto;
              ${online ? "animation:glowPulse 1.5s ease-in-out infinite;" : ""}"></div>
          </div>`,
        iconSize: [Math.max(m.label.length * 6 + 14, 34), 28],
        iconAnchor: [Math.max(m.label.length * 6 + 14, 34) / 2, 28],
      })

      const marker = L.marker([m.lat, m.lng], { icon }).addTo(layer.current)
      marker.bindPopup(`
        <div style="font-family:monospace;font-size:11px;min-width:180px;">
          <div style="font-size:13px;font-weight:bold;color:#00ff88;margin-bottom:6px;border-bottom:1px solid rgba(0,255,136,0.2);padding-bottom:4px;">
            🖥 ${m.label}
          </div>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:3px 8px;">
            <span style="color:#888;">ID:</span><span style="color:#ccc;">${m.clientId?.substring(0,10)}</span>
            <span style="color:#888;">IP:</span><span style="color:#ccc;">${m.ip || "—"}</span>
            <span style="color:#888;">OS:</span><span style="color:#ccc;">${m.os || "—"}</span>
            <span style="color:#888;">Country:</span><span style="color:#ccc;">${m.country || "?"} (${m.city || "?"})</span>
            <span style="color:#888;">Status:</span><span style="color:${color};font-weight:bold;">● ${m.status.toUpperCase()}</span>
            <span style="color:#888;">Last:</span><span style="color:#ccc;">${m.lastSeen}</span>
          </div>
          <div onclick="window.location.href='/dashboard/remote/clients/${m.id}'" style="margin-top:6px;color:#00ff88;cursor:pointer;text-align:center;border-top:1px solid rgba(0,255,136,0.1);padding-top:4px;font-size:10px;">
            [ Open Detail → ]
          </div>
        </div>
      `, { className: "cyber-popup", maxWidth: 260, offset: [0, -14] })
    })
  }, [markers])

  return <div ref={containerRef} className="w-full h-full" />
}
