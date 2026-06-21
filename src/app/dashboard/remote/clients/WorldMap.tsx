"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface MarkerData {
  id: string
  clientId: string
  lat: number
  lng: number
  label: string
  status: string
  country: string
  city: string
  lastSeen: string
}

interface WorldMapProps {
  markers: MarkerData[]
}

export default function WorldMap({ markers }: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersLayer = useRef<L.LayerGroup>(L.layerGroup())

  useEffect(() => {
    if (!containerRef.current || mapInstance.current) return
    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: true,
      worldCopyJump: true,
    })
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
    }).addTo(map)
    markersLayer.current.addTo(map)
    mapInstance.current = map
    return () => { map.remove(); mapInstance.current = null }
  }, [])

  useEffect(() => {
    const layer = markersLayer.current
    if (!layer || !mapInstance.current) return
    layer.clearLayers()

    if (!document.getElementById("blink-style")) {
      const style = document.createElement("style")
      style.id = "blink-style"
      style.textContent = `
        @keyframes blink { 0%,100%{opacity:1;box-shadow:0 0 12px currentColor;} 50%{opacity:0.4;box-shadow:0 0 24px currentColor;} }
        .leaflet-marker-icon { transition: transform 0.2s; }
        .leaflet-marker-icon:hover { transform: scale(1.4) !important; z-index: 999 !important; }
        .custom-popup .leaflet-popup-content-wrapper {
          background: #111116 !important; color: #E0E0E0 !important; border: 1px solid #A855F7 !important;
          border-radius: 12px !important; font-family: monospace !important;
        }
        .custom-popup .leaflet-popup-tip { background: #111116 !important; }
      `
      document.head.appendChild(style)
    }

    markers.forEach(m => {
      if (!m.lat || !m.lng || m.lat === 0) return
      const isOnline = m.status === "online"
      const color = isOnline ? "#22c55e" : m.status === "idle" ? "#eab308" : "#ef4444"
      const size = isOnline ? 18 : 14

      // Marker HTML with label above
      const icon = L.divIcon({
        className: isOnline ? "pulse-dot" : "",
        html: `<div style="position:relative;text-align:center;">
          <div style="
            background:rgba(0,0,0,0.85);color:#E0E0E0;font-size:10px;font-family:monospace;
            padding:2px 6px;border-radius:4px;white-space:nowrap;margin-bottom:4px;
            border:1px solid ${color};text-shadow:0 0 6px ${color};
          ">${m.label}</div>
          <div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;
            border:2px solid white;box-shadow:0 0 ${size}px ${color};margin:0 auto;
            ${isOnline ? "animation:blink 1.2s ease-in-out infinite;" : ""}"></div>
        </div>`,
        iconSize: [Math.max(m.label.length * 7 + 12, 40), size + 22],
        iconAnchor: [Math.max(m.label.length * 7 + 12, 40) / 2, size + 22],
      })

      const marker = L.marker([m.lat, m.lng], { icon })
        .addTo(layer)
        .on("click", () => {
          window.location.href = `/dashboard/remote/clients/${m.id}`
        })

      marker.bindPopup(`
        <div style="font-family:monospace;font-size:12px;color:#E0E0E0;padding:4px;">
          <div style="font-size:14px;font-weight:bold;color:#A855F7;margin-bottom:4px;">${m.label}</div>
          <div>ID: <span style="color:#9CA3AF;">${m.clientId?.substring(0, 12)}</span></div>
          <div>Country: <span style="color:#9CA3AF;">${m.country || "?"}</span></div>
          <div>City: <span style="color:#9CA3AF;">${m.city || "?"}</span></div>
          <div>Status: <span style="color:${color};font-weight:bold;">${m.status.toUpperCase()}</span></div>
          <div>Last: <span style="color:#9CA3AF;">${m.lastSeen}</span></div>
          <div style="margin-top:6px;color:#5EEAD4;cursor:pointer;text-decoration:underline;" 
               onclick="window.location.href='/dashboard/remote/clients/${m.id}'">Open Detail →</div>
        </div>
      `, { className: "custom-popup", maxWidth: 250 })
    })
  }, [markers])

  return <div ref={containerRef} className="w-full h-full" />
}
