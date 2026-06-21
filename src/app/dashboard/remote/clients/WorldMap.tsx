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
  const mapRef = useRef<L.Map | null>(null)
  const markersLayer = useRef<L.LayerGroup>(L.layerGroup())
  const countryLayer = useRef<L.LayerGroup>(L.layerGroup())
  const pulseTimer = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [25, 0], zoom: 2.4, zoomControl: false,
      attributionControl: false, worldCopyJump: true, minZoom: 2, maxZoom: 18,
      maxBoundsViscosity: 1.0,
    })

    L.control.zoom({ position: "bottomright" }).addTo(map)

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "",
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map)

    markersLayer.current.addTo(map)
    countryLayer.current.addTo(map)
    mapRef.current = map

    // Inject CSS for glow animations
    if (!document.getElementById("soc-map-style")) {
      const s = document.createElement("style")
      s.id = "soc-map-style"
      s.textContent = `
        @keyframes socPulse {
          0% { box-shadow: 0 0 4px 0px #3b82f6; }
          50% { box-shadow: 0 0 18px 4px #3b82f6, 0 0 36px 8px rgba(59,130,246,0.3); }
          100% { box-shadow: 0 0 4px 0px #3b82f6; }
        }
        @keyframes socRing {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes socPulseGreen {
          0% { box-shadow: 0 0 4px 0px #22c55e; }
          50% { box-shadow: 0 0 18px 4px #22c55e, 0 0 36px 8px rgba(34,197,94,0.3); }
          100% { box-shadow: 0 0 4px 0px #22c55e; }
        }
        .soc-tooltip {
          background: rgba(10,16,32,0.95) !important;
          border: 1px solid rgba(59,130,246,0.4) !important;
          border-radius: 16px !important;
          backdrop-filter: blur(20px) !important;
          box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(59,130,246,0.08) !important;
          padding: 4px 0 !important;
        }
        .soc-tooltip .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          padding: 0 !important;
        }
        .soc-tooltip .leaflet-popup-tip {
          background: rgba(10,16,32,0.95) !important;
          border: 1px solid rgba(59,130,246,0.4) !important;
        }
        .soc-tooltip .leaflet-popup-close-button {
          color: rgba(255,255,255,0.4) !important;
          font-size: 18px !important;
          padding: 6px 10px !important;
        }
      `
      document.head.appendChild(s)
    }

    return () => { map.remove(); mapRef.current = null; if (pulseTimer.current) clearInterval(pulseTimer.current) }
  }, [])

  // Update markers
  useEffect(() => {
    const mGroup = markersLayer.current
    const cGroup = countryLayer.current
    if (!mGroup) return
    mGroup.clearLayers()
    cGroup.clearLayers()

    // Country aggregation for heatmap circles
    const countryCounts: Record<string, { count: number; lat: number; lng: number; online: number; name: string }> = {}
    markers.forEach(m => {
      if (!m.country || !m.lat || !m.lng || m.lat === 0) return
      const key = m.country
      if (!countryCounts[key]) {
        countryCounts[key] = { count: 0, lat: m.lat, lng: m.lng, online: 0, name: m.country }
      }
      countryCounts[key].count++
      if (m.status === "online") countryCounts[key].online++
    })

    // Country heatmap circles
    Object.values(countryCounts).forEach(c => {
      const radius = Math.min(c.count * 120000, 800000)
      const opacity = Math.min(c.count * 0.04, 0.25)
      const circle = L.circle([c.lat, c.lng], {
        radius,
        color: c.online > 0 ? "#3b82f6" : "#374151",
        fillColor: c.online > 0 ? "#3b82f6" : "#374151",
        fillOpacity: opacity,
        weight: 0.5,
        interactive: false,
      }).addTo(cGroup)
    })

    // Client markers
    markers.forEach(m => {
      if (!m.lat || !m.lng || m.lat === 0) return
      const online = m.status === "online"
      const color = online ? "#3b82f6" : "#4b5563"
      const glowColor = online ? "rgba(59,130,246,0.6)" : "rgba(75,85,99,0.3)"
      const size = 12
      const anim = online ? "animation: socPulse 2s ease-in-out infinite;" : ""

      const icon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;">
            <div style="
              position:absolute;top:${-(size/2+8)}px;left:50%;transform:translateX(-50%);
              background:rgba(10,16,32,0.92);color:${color};font-size:9px;font-family:'JetBrains Mono',monospace;
              padding:2px 7px;border-radius:4px;white-space:nowrap;
              border:1px solid ${color}40;letter-spacing:0.3px;
              backdrop-filter:blur(8px);pointer-events:none;
            ">${m.label}</div>
            <div style="
              width:${size}px;height:${size}px;background:${color};border-radius:50%;
              border:2px solid rgba(255,255,255,0.15);
              box-shadow:0 0 ${size*1.5}px ${glowColor};${anim}
            "></div>
            ${online ? `<div style="
              position:absolute;top:${-(size/2)}px;left:${-(size/2)}px;
              width:${size*3}px;height:${size*3}px;border:1px solid ${color}40;
              border-radius:50%;animation:socRing 3s ease-out infinite;
              pointer-events:none;
            "></div>` : ""}
          </div>`,
        iconSize: [size * 3, size * 3 + 16],
        iconAnchor: [size * 1.5, size * 1.5 + 8],
      })

      const marker = L.marker([m.lat, m.lng], { icon }).addTo(mGroup)
      
      const popupContent = `
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;padding:4px 8px;color:#cbd5e1;min-width:200px;">
          <div style="font-size:13px;font-weight:700;color:#60a5fa;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${color};${online ? 'animation:socPulse 2s ease-in-out infinite' : ''};display:inline-block;"></span>
            ${m.label}
          </div>
          <div style="display:grid;grid-template-columns:70px 1fr;gap:3px 6px;">
            <span style="color:#64748b;">IP</span><span style="color:#94a3b8;">${m.ip || "—"}</span>
            <span style="color:#64748b;">Country</span><span style="color:#94a3b8;">${m.country || "?"}</span>
            <span style="color:#64748b;">City</span><span style="color:#94a3b8;">${m.city || "?"}</span>
            <span style="color:#64748b;">OS</span><span style="color:#94a3b8;">${m.os || "—"}</span>
            <span style="color:#64748b;">Status</span><span style="color:${color};font-weight:600;">● ${m.status.toUpperCase()}</span>
            <span style="color:#64748b;">Last</span><span style="color:#94a3b8;">${m.lastSeen}</span>
          </div>
        </div>`

      marker.bindPopup(popupContent, {
        className: "soc-tooltip",
        maxWidth: 260,
        offset: [0, -10],
        closeButton: true,
      })
    })
  }, [markers])

  return (
    <div style={{
      background: "linear-gradient(180deg, #0A1020 0%, #111827 100%)",
      width: "100%", height: "100%", position: "relative", overflow: "hidden",
    }}>
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 1,
      }} />
      {/* Scan line effect */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.02) 50%, transparent 100%)",
        animation: "socScan 4s ease-in-out infinite", pointerEvents: "none", zIndex: 1,
      }} />
      <div ref={containerRef} className="w-full h-full" style={{ position: "relative", zIndex: 2 }} />
      <style jsx>{`@keyframes socScan{0%,100%{opacity:0}50%{opacity:1}}`}</style>
    </div>
  )
}
