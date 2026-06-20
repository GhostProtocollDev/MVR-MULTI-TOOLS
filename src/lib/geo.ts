export interface GeoResult {
  country: string
  countryCode: string
  city: string
  isp: string
}

const cache = new Map<string, GeoResult>()

const COUNTRY_FLAGS: Record<string, string> = {
  AR: "🇦🇷", AU: "🇦🇺", AT: "🇦🇹", BE: "🇧🇪", BR: "🇧🇷",
  CA: "🇨🇦", CL: "🇨🇱", CN: "🇨🇳", CO: "🇨🇴", HR: "🇭🇷",
  CZ: "🇨🇿", DK: "🇩🇰", DO: "🇩🇴", EC: "🇪🇨", EG: "🇪🇬",
  FI: "🇫🇮", FR: "🇫🇷", DE: "🇩🇪", GR: "🇬🇷", HK: "🇭🇰",
  HU: "🇭🇺", IN: "🇮🇳", ID: "🇮🇩", IE: "🇮🇪", IL: "🇮🇱",
  IT: "🇮🇹", JP: "🇯🇵", KR: "🇰🇷", LV: "🇱🇻", LT: "🇱🇹",
  MY: "🇲🇾", MX: "🇲🇽", NL: "🇳🇱", NZ: "🇳🇿", NG: "🇳🇬",
  NO: "🇳🇴", PK: "🇵🇰", PY: "🇵🇾", PE: "🇵🇪", PH: "🇵🇭",
  PL: "🇵🇱", PT: "🇵🇹", RO: "🇷🇴", RU: "🇷🇺", SA: "🇸🇦",
  SG: "🇸🇬", SK: "🇸🇰", ZA: "🇿🇦", ES: "🇪🇸", SE: "🇸🇪",
  CH: "🇨🇭", TW: "🇹🇼", TH: "🇹🇭", TR: "🇹🇷", UA: "🇺🇦",
  AE: "🇦🇪", GB: "🇬🇧", US: "🇺🇸", UY: "🇺🇾", VE: "🇻🇪",
  VN: "🇻🇳",
}

export function getFlagEmoji(countryCode: string | null | undefined): string {
  if (!countryCode) return ""
  return COUNTRY_FLAGS[countryCode.toUpperCase()] || ``
}

export async function resolveIp(ip: string): Promise<GeoResult | null> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
    return null
  }

  const cached = cache.get(ip)
  if (cached) return cached

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,isp,query`, {
      signal: AbortSignal.timeout(3000),
    })

    if (!res.ok) return null

    const data = await res.json()
    if (data.status !== "success") return null

    const result: GeoResult = {
      country: data.country || "",
      countryCode: data.countryCode || "",
      city: data.city || "",
      isp: data.isp || "",
    }

    cache.set(ip, result)
    return result
  } catch {
    return null
  }
}
