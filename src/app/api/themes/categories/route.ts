import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const CATEGORIES = [
  { id: "anime", name: "Anime", slug: "anime", description: "Anime-inspired themes with vibrant colors and character aesthetics", icon: "🎌" },
  { id: "gaming", name: "Gaming", slug: "gaming", description: "Game-inspired themes with dynamic visuals and neon accents", icon: "🎮" },
  { id: "cyberpunk", name: "Cyberpunk", slug: "cyberpunk", description: "Dark futuristic themes with neon glows and tech vibes", icon: "🤖" },
  { id: "neon", name: "Neon", slug: "neon", description: "Bright neon themes with glowing edges and vibrant contrasts", icon: "💡" },
  { id: "luxury", name: "Luxury", slug: "luxury", description: "Premium elegant themes with gold accents and refined looks", icon: "💎" },
  { id: "technology", name: "Technology", slug: "technology", description: "Tech-inspired themes with circuit patterns and digital feel", icon: "⚡" },
  { id: "space", name: "Space", slug: "space", description: "Cosmic themes with stars, galaxies, and deep space colors", icon: "🌌" },
  { id: "abstract", name: "Abstract", slug: "abstract", description: "Artistic themes with unique patterns and creative designs", icon: "🎨" },
  { id: "dark", name: "Dark", slug: "dark", description: "Minimal dark themes for reduced eye strain and sleek UI", icon: "🌙" },
  { id: "minimalist", name: "Minimalist", slug: "minimalist", description: "Clean and simple themes with focus on content", icon: "✧" },
]

export async function GET() {
  try {
    const categories = await Promise.all(
      CATEGORIES.map(async (cat) => {
        const count = await prisma.theme.count({
          where: { category: cat.id },
        })
        return { ...cat, count }
      })
    )

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("[THEMES_CATEGORIES_GET]", error)
    return NextResponse.json({ categories: CATEGORIES.map((c) => ({ ...c, count: 0 })) })
  }
}
