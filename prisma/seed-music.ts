import { PrismaClient } from "@prisma/client"

const p = new PrismaClient()

const ARTISTS: { name: string; slug: string; genre: string }[] = [
  { name: "Peso Pluma", slug: "peso-pluma", genre: "Corridos Tumbados" },
  { name: "Fuerza Regida", slug: "fuerza-regida", genre: "Regional Mexicano" },
  { name: "King Von", slug: "king-von", genre: "Hip-Hop/Rap" },
  { name: "Junior H", slug: "junior-h", genre: "Corridos Tumbados" },
  { name: "Arctic Monkeys", slug: "arctic-monkeys", genre: "Rock Alternativo" },
  { name: "Alex Turner", slug: "alex-turner", genre: "Indie Rock" },
  { name: "The Neighbourhood", slug: "the-neighbourhood", genre: "Indie Rock" },
  { name: "Beach Weather", slug: "beach-weather", genre: "Indie Pop" },
  { name: "Calle 24", slug: "calle-24", genre: "Regional Mexicano" },
  { name: "Chuy Montana", slug: "chuy-montana", genre: "Regional Mexicano" },
  { name: "Esdeekid", slug: "esdeekid", genre: "Trap Latino" },
  { name: "Hades66", slug: "hades66", genre: "Trap Latino" },
]

const ALBUMS: { artistSlug: string; title: string; year: number }[] = [
  // Peso Pluma
  { artistSlug: "peso-pluma", title: "Disco en Vivo", year: 2020 },
  { artistSlug: "peso-pluma", title: "Disco en Vivo, Vol. 2", year: 2020 },
  { artistSlug: "peso-pluma", title: "Ah y Qué?", year: 2020 },
  { artistSlug: "peso-pluma", title: "Efectos Secundarios", year: 2021 },
  { artistSlug: "peso-pluma", title: "Sembrando", year: 2022 },
  { artistSlug: "peso-pluma", title: "Génesis", year: 2023 },
  { artistSlug: "peso-pluma", title: "Éxodo", year: 2024 },

  // Fuerza Regida
  { artistSlug: "fuerza-regida", title: "En Vivo Desde Culiacán", year: 2019 },
  { artistSlug: "fuerza-regida", title: "Del Barrio Hasta Aquí", year: 2019 },
  { artistSlug: "fuerza-regida", title: "Adicto", year: 2020 },
  { artistSlug: "fuerza-regida", title: "Otro Pedo, Otro Mundo", year: 2020 },
  { artistSlug: "fuerza-regida", title: "Pisteando Con La Regida", year: 2020 },
  { artistSlug: "fuerza-regida", title: "Pisteando Con La Regida Vol. 2", year: 2021 },
  { artistSlug: "fuerza-regida", title: "Del Barrio Hasta Aquí Vol. 2", year: 2021 },
  { artistSlug: "fuerza-regida", title: "Las Romanticas Favoritas", year: 2021 },
  { artistSlug: "fuerza-regida", title: "Sigan Chambeando", year: 2022 },
  { artistSlug: "fuerza-regida", title: "Pa Que Hablen", year: 2023 },
  { artistSlug: "fuerza-regida", title: "Dolido Pero No Arrepentido", year: 2024 },
  { artistSlug: "fuerza-regida", title: "Pero No Te Enamores", year: 2024 },
  { artistSlug: "fuerza-regida", title: "Mala Mía", year: 2024 },

  // King Von
  { artistSlug: "king-von", title: "Grandson, Vol. 1", year: 2019 },
  { artistSlug: "king-von", title: "Levon James", year: 2020 },
  { artistSlug: "king-von", title: "Welcome to O'Block", year: 2020 },
  { artistSlug: "king-von", title: "What It Means to Be King", year: 2022 },
  { artistSlug: "king-von", title: "Grandson", year: 2023 },

  // Junior H
  { artistSlug: "junior-h", title: "Mi Vida En Un Cigarro", year: 2019 },
  { artistSlug: "junior-h", title: "Mi Vida En Un Cigarro 2", year: 2019 },
  { artistSlug: "junior-h", title: "Atrapado en un Sueño", year: 2020 },
  { artistSlug: "junior-h", title: "Cruisin' with Junior H", year: 2020 },
  { artistSlug: "junior-h", title: "$ad Boyz 4 Life", year: 2021 },
  { artistSlug: "junior-h", title: "Contingente", year: 2022 },
  { artistSlug: "junior-h", title: "$ad Boyz 4 Life II", year: 2023 },

  // Arctic Monkeys
  { artistSlug: "arctic-monkeys", title: "Whatever People Say I Am, That's What I'm Not", year: 2006 },
  { artistSlug: "arctic-monkeys", title: "Favourite Worst Nightmare", year: 2007 },
  { artistSlug: "arctic-monkeys", title: "Humbug", year: 2009 },
  { artistSlug: "arctic-monkeys", title: "Suck It and See", year: 2011 },
  { artistSlug: "arctic-monkeys", title: "AM", year: 2013 },
  { artistSlug: "arctic-monkeys", title: "Tranquility Base Hotel & Casino", year: 2018 },
  { artistSlug: "arctic-monkeys", title: "The Car", year: 2022 },

  // Alex Turner
  { artistSlug: "alex-turner", title: "Submarine OST", year: 2011 },
  { artistSlug: "alex-turner", title: "TLSP - The Age of the Understatement", year: 2008 },
  { artistSlug: "alex-turner", title: "TLSP - Everything You've Come to Expect", year: 2016 },

  // The Neighbourhood
  { artistSlug: "the-neighbourhood", title: "I'm Sorry...", year: 2012 },
  { artistSlug: "the-neighbourhood", title: "Thank You", year: 2012 },
  { artistSlug: "the-neighbourhood", title: "I Love You.", year: 2013 },
  { artistSlug: "the-neighbourhood", title: "Wiped Out!", year: 2015 },
  { artistSlug: "the-neighbourhood", title: "Hard", year: 2017 },
  { artistSlug: "the-neighbourhood", title: "The Neighbourhood", year: 2018 },
  { artistSlug: "the-neighbourhood", title: "Chip Chrome & The Mono-Tones", year: 2020 },

  // Beach Weather
  { artistSlug: "beach-weather", title: "Chit Chat", year: 2016 },
  { artistSlug: "beach-weather", title: "Pineapple Sunrise", year: 2023 },

  // Calle 24
  { artistSlug: "calle-24", title: "Qué Onda (Single)", year: 2023 },
  { artistSlug: "calle-24", title: "Moda (Single)", year: 2023 },
  { artistSlug: "calle-24", title: "Grandes Éxitos", year: 2024 },

  // Chuy Montana
  { artistSlug: "chuy-montana", title: "Corridos Belicos", year: 2023 },
  { artistSlug: "chuy-montana", title: "Porte Fino", year: 2024 },

  // Esdeekid
  { artistSlug: "esdeekid", title: "Trap Latino, Vol. 1", year: 2023 },
  { artistSlug: "esdeekid", title: "Flow Pesado", year: 2024 },

  // Hades66
  { artistSlug: "hades66", title: "666", year: 2023 },
  { artistSlug: "hades66", title: "Inferno", year: 2024 },
]

async function main() {
  const existingArtists = await p.artist.count()
  if (existingArtists > 0) {
    console.log(`Ya hay ${existingArtists} artistas. Saltando seed.`)
    return
  }

  for (const a of ARTISTS) {
    await p.artist.create({ data: a })
  }

  for (const alb of ALBUMS) {
    const artist = await p.artist.findUnique({ where: { slug: alb.artistSlug } })
    if (!artist) { console.log(`Artista no encontrado: ${alb.artistSlug}`); continue }
    const slug = alb.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    const existing = await p.album.findFirst({ where: { artistId: artist.id, slug } })
    if (existing) continue
    await p.album.create({
      data: { title: alb.title, slug, artistId: artist.id, year: alb.year },
    })
  }

  console.log(`Seed completado: ${ARTISTS.length} artistas, ${ALBUMS.length} álbumes.`)
}

main()
  .catch((e) => {
    console.error("Error seeding music:", e)
    process.exit(1)
  })
  .finally(() => p.$disconnect())
