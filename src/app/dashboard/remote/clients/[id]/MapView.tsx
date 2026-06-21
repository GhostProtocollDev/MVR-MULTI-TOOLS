'use client'

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface MapViewProps {
  lat: number
  lng: number
  label: string
}

export default function MapView({ lat, lng, label }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current).setView(
      lat && lng && lat !== 0 ? [lat, lng] : [20, 0],
      lat !== 0 ? 10 : 2
    )

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map)

    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !lat || !lng || lat === 0) return

    map.setView([lat, lng], 10, { animate: true })

    // Blinking marker
    const blinkIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:20px;height:20px;background:#ef4444;border-radius:50%;border:3px solid white;
        box-shadow:0 0 20px rgba(239,68,68,0.8);animation:blink 1s ease-in-out infinite;
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })

    const marker = L.marker([lat, lng], { icon: blinkIcon }).addTo(map)
    marker.bindPopup(`<b>${label}</b><br/>${lat.toFixed(4)}, ${lng.toFixed(4)}`)

    // Pulse circle
    const circle = L.circle([lat, lng], {
      radius: 50000,
      color: "#ef4444",
      fillColor: "#ef4444",
      fillOpacity: 0.1,
      weight: 1,
    }).addTo(map)

    // Add CSS animation
    if (!document.getElementById("blink-animation")) {
      const style = document.createElement("style")
      style.id = "blink-animation"
      style.textContent = `
        @keyframes blink {
          0%, 100% { opacity: 1; box-shadow: 0 0 20px rgba(239,68,68,0.8); }
          50% { opacity: 0.3; box-shadow: 0 0 40px rgba(239,68,68,1); }
        }
      `
      document.head.appendChild(style)
    }

    return () => {
      map.removeLayer(marker)
      map.removeLayer(circle)
    }
  }, [lat, lng, label])

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ minHeight: "450px" }}
    />
  )
}
