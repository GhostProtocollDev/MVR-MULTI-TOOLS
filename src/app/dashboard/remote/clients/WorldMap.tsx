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
      zoomControl: false,
      attributionControl: false,
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

    // Add CSS if not present
    if (!document.getElementById("blink-style")) {
      const style = document.createElement("style")
      style.id = "blink-style"
      style.textContent = `
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .pulse-dot { animation: blink 1.2s ease-in-out infinite; }
      `
      document.head.appendChild(style)
    }

    markers.forEach(m => {
      if (!m.lat || !m.lng || m.lat === 0) return
      const isOnline = m.status === "online"
      const color = isOnline ? "#22c55e" : m.status === "idle" ? "#eab308" : "#ef4444"
      const size = isOnline ? 16 : 12

      const icon = L.divIcon({
        className: isOnline ? "pulse-dot" : "",
        html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 0 ${size}px ${color};"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })

      const marker = L.marker([m.lat, m.lng], { icon }).addTo(layer)
      marker.bindPopup(`
        <div style="font-family:monospace;font-size:12px;color:#e4e4e7;">
          <b>${m.label}</b><br/>
          ID: ${m.clientId?.substring(0, 12)}<br/>
          Country: ${m.country || "?"}<br/>
          City: ${m.city || "?"}<br/>
          Status: <span style="color:${color};font-weight:bold;">${m.status.toUpperCase()}</span><br/>
          Last: ${m.lastSeen}
        </div>
      `, { className: "custom-popup" })
    })
  }, [markers])

  return <div ref={containerRef} className="w-full h-full" />
}
