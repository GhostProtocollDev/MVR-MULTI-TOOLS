import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.remoteClient.findUnique({ where: { id: params.id } })
    if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (!client.ipPublic) {
      return NextResponse.json({ lat: 0, lng: 0, city: null, country: null, error: "No public IP" })
    }

    const res = await fetch(`http://ip-api.com/json/${client.ipPublic}?fields=status,lat,lon,city,country,countryCode,isp,org,timezone`)
    const data = await res.json()

    if (data.status === "success") {
      await prisma.remoteClient.update({
        where: { id: params.id },
        data: {
          country: data.country || client.country,
          countryCode: data.countryCode || client.countryCode,
          city: data.city || client.city,
          isp: data.isp || client.isp,
          lat: data.lat,
          lng: data.lon,
        },
      })

      return NextResponse.json({
        lat: data.lat,
        lng: data.lon,
        city: data.city,
        country: data.country,
        countryCode: data.countryCode,
        isp: data.isp,
        org: data.org,
        timezone: data.timezone,
      })
    }

    return NextResponse.json({ lat: 0, lng: 0, city: null, country: null, error: "Geo lookup failed" })
  } catch {
    return NextResponse.json({ lat: 0, lng: 0, error: "Error" })
  }
}
