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

// Album data with track listings
interface AlbumSeed {
  artistSlug: string
  title: string
  year: number
  tracks: string[]
}

const ALBUMS: AlbumSeed[] = [
  // ========== PESO PLUMA ==========
  { artistSlug: "peso-pluma", title: "Génesis", year: 2023, tracks: [
    "Rosa Pastel", "Luna", "77", "Nueva Vida", "Lagunas", "Lady Gaga", "Rubicon","Carnal","Gavilán II","VVS","Su Casa",
    "Las Morras","El Belicón","Siempre Pendientes","Tulum","Bye"
  ]},
  { artistSlug: "peso-pluma", title: "Éxodo", year: 2024, tracks: [
    "La Durango","La People II","Rompe la Dompe","Peso Completo","Bellakeo","Vino Tinto","Ella Baila Sola",
    "Tommy & Pamela","La Patrulla","Mala","Hollywood","Teka","Sin Yolanda","Gimme a Second","Lo Que Me Das"
  ]},
  { artistSlug: "peso-pluma", title: "Sembrando", year: 2022, tracks: [
    "Sembrando","Spiral","El Belicón","30 Tiros","Sentosa","Ando Enfocado","Mil Historias","Con Dinero Baila el Perro"
  ]},
  { artistSlug: "peso-pluma", title: "Efectos Secundarios", year: 2021, tracks: [
    "Efectos Secundarios","Todo Es Playa","Lo Que Me Das","Por Las Noches","Relajado Voy","Mil Historias","Con Dinero Baila el Perro"
  ]},
  { artistSlug: "peso-pluma", title: "Ah y Qué?", year: 2020, tracks: [
    "Ah y Qué?","Relajado Voy","Comencé","El Drip","No Hay Pedo","Pa Que Sepan","Trokiando"
  ]},
  { artistSlug: "peso-pluma", title: "Disco en Vivo", year: 2020, tracks: [
    "Intro (En Vivo)","El Belicón (En Vivo)","AMG (En Vivo)","Siempre Pendientes (En Vivo)","PRC (En Vivo)"
  ]},
  { artistSlug: "peso-pluma", title: "Disco en Vivo, Vol. 2", year: 2020, tracks: [
    "El Azul (En Vivo)","Igualito a Mi Apá (En Vivo)","Lady Gaga (En Vivo)","Tulum (En Vivo)","Lagunas (En Vivo)"
  ]},

  // ========== FUERZA REGIDA ==========
  { artistSlug: "fuerza-regida", title: "Pero No Te Enamores", year: 2024, tracks: [
    "Pero No Te Enamores","Fresita","Exceso","Modo Capone","Tu Boda","Ferrari","Por Esos Ojos","Nel",
    "Harley Quinn","Tu Name","Tiki Taka Toco","Otra Noche","Besos","Loco Enamorado"
  ]},
  { artistSlug: "fuerza-regida", title: "Dolido Pero No Arrepentido", year: 2024, tracks: [
    "Dolido Pero No Arrepentido","Me Jalo","Tu Sancho","Marlboro Rojo","Sabor Fresa","TQM","Bebe Dame"
  ]},
  { artistSlug: "fuerza-regida", title: "Pa Que Hablen", year: 2023, tracks: [
    "Sabor Fresa","TQM","Igualito a Mi Apá","Bebe Dame","Ch y la Pizza","Te Quiero Besar",
    "Sigan Hablando","El Jefe","Se Acabo","El Doctor"
  ]},
  { artistSlug: "fuerza-regida", title: "Sigan Chambeando", year: 2022, tracks: [
    "Sigan Chambeando","Ch y la Pizza","Señor Miedo","En La Movida","El Capi","Modo Guerra","La Palabra"
  ]},
  { artistSlug: "fuerza-regida", title: "Del Barrio Hasta Aquí", year: 2019, tracks: [
    "Del Barrio Hasta Aquí","Radicamos en South Central","El Dinero Los Cambio","Bandido",
    "Corrido de Feliciano","El Chavo","Los Mire Con Talento"
  ]},
  { artistSlug: "fuerza-regida", title: "Adicto", year: 2020, tracks: [
    "Adicto","Descansando","El Flash","La Niña","Por La Noche","Palabras del 7","El Michoacano"
  ]},
  { artistSlug: "fuerza-regida", title: "Otro Pedo, Otro Mundo", year: 2020, tracks: [
    "Otro Pedo, Otro Mundo","La Familia","Vida Peligrosa","El Morro","Seguimos Laborando","Clave 7"
  ]},
  { artistSlug: "fuerza-regida", title: "Pisteando Con La Regida", year: 2020, tracks: [
    "Pisteando","La Cita","El Circo","El Mayo","Soy El Raton","El De La Codeina"
  ]},
  { artistSlug: "fuerza-regida", title: "Pisteando Con La Regida Vol. 2", year: 2021, tracks: [
    "Pisteando Vol.2","El Cuate","La Escuela No Me Gusto","El 50","Soy Montero","El Guero"
  ]},
  { artistSlug: "fuerza-regida", title: "Del Barrio Hasta Aquí Vol. 2", year: 2021, tracks: [
    "Se Amerita","El Muchacho Alegre","El Tatuado","El Jefe de la Plaza","Los Botones Azules","El Ruso"
  ]},
  { artistSlug: "fuerza-regida", title: "Las Romanticas Favoritas", year: 2021, tracks: [
    "Te Quiero","Sabor A Mi","Contigo","Sueño","Mi Amor Por Ti","Eres Tu"
  ]},
  { artistSlug: "fuerza-regida", title: "En Vivo Desde Culiacán", year: 2019, tracks: [
    "Intro En Vivo Culiacán","Radicamos (En Vivo)","Los Mire (En Vivo)","El Dinero (En Vivo)"
  ]},
  { artistSlug: "fuerza-regida", title: "Mala Mía", year: 2024, tracks: [
    "Mala Mía","Bien Pilas","El Compa","La Plebe","Sigo Siendo El Mismo"
  ]},

  // ========== KING VON ==========
  { artistSlug: "king-von", title: "Welcome to O'Block", year: 2020, tracks: [
    "Armed & Dangerous","GTA","Demon","Mine Too","The Code","Why He Told","Back Again",
    "Gleesh Place","All These Niggas","How It Go","I Am What I Am","Ride","Mad At You"
  ]},
  { artistSlug: "king-von", title: "What It Means to Be King", year: 2022, tracks: [
    "Where I'm From","War","Facetime","Don't Play That","Straight to It","Trust Nothing",
    "Evil Twins","Too Real","Rich Gangsta","My Fault","Hard to Trust","Get It Done","Chase the Bag"
  ]},
  { artistSlug: "king-von", title: "Grandson", year: 2023, tracks: [
    "Robberies","Heartless","Don't Miss","Phil Jackson","From the Hood","Pressure","Jealous",
    "Real Oppy","When I Die","Family Dedication","Out the Mud"
  ]},
  { artistSlug: "king-von", title: "Grandson, Vol. 1", year: 2019, tracks: [
    "Crazy Story","Crazy Story 2.0","Crazy Story Pt. 3","Twin Nem","Jet","Mama's Boy",
    "No Flaws","War with Us","Hoes Ain't Shit","Fuck Yo Man"
  ]},
  { artistSlug: "king-von", title: "Levon James", year: 2020, tracks: [
    "Took Her to the O","2 A.M.","Rollin","Broke Opps","Trust Issues","Down Me",
    "On Yo Ass","Block","Grandson for President","3 A.M."
  ]},

  // ========== ARCTIC MONKEYS ==========
  { artistSlug: "arctic-monkeys", title: "AM", year: 2013, tracks: [
    "Do I Wanna Know?","R U Mine?","One for the Road","Arabella","I Want It All",
    "No. 1 Party Anthem","Mad Sounds","Fireside","Why'd You Only Call Me When You're High?","Snap Out of It","Knee Socks","I Wanna Be Yours"
  ]},
  { artistSlug: "arctic-monkeys", title: "Whatever People Say I Am, That's What I'm Not", year: 2006, tracks: [
    "The View from the Afternoon","I Bet You Look Good on the Dancefloor","Fake Tales of San Francisco",
    "Dancing Shoes","You Probably Couldn't See for the Lights...","Still Take You Home",
    "Riot Van","Red Light Indicates Doors Are Secured","Mardy Bum","Perhaps Vampires Is a Bit Strong But...",
    "When the Sun Goes Down","From the Ritz to the Rubble","A Certain Romance"
  ]},
  { artistSlug: "arctic-monkeys", title: "Favourite Worst Nightmare", year: 2007, tracks: [
    "Brianstorm","Teddy Picker","D Is for Dangerous","Balaclava","Fluorescent Adolescent",
    "Only Ones Who Know","Do Me a Favour","This House Is a Circus","If You Were There, Beware",
    "The Bad Thing","Old Yellow Bricks","505"
  ]},
  { artistSlug: "arctic-monkeys", title: "Humbug", year: 2009, tracks: [
    "My Propeller","Crying Lightning","Dangerous Animals","Secret Door","Potion Approaching",
    "Fire and the Thud","Cornerstone","Dance Little Liar","Pretty Visitors","The Jeweller's Hands"
  ]},
  { artistSlug: "arctic-monkeys", title: "Suck It and See", year: 2011, tracks: [
    "She's Thunderstorms","Black Treacle","Brick by Brick","The Hellcat Spangled Shalalala",
    "Don't Sit Down 'Cause I've Moved Your Chair","Library Pictures","All My Own Stunts",
    "Reckless Serenade","Piledriver Waltz","Love Is a Laserquest","Suck It and See","That's Where You're Wrong"
  ]},
  { artistSlug: "arctic-monkeys", title: "Tranquility Base Hotel & Casino", year: 2018, tracks: [
    "Star Treatment","One Point Perspective","American Sports","Tranquility Base Hotel & Casino",
    "Golden Trunks","Four Out of Five","The World's First Ever Monster Truck Front Flip",
    "Science Fiction","She Looks Like Fun","Batphone","The Ultracheese"
  ]},
  { artistSlug: "arctic-monkeys", title: "The Car", year: 2022, tracks: [
    "There'd Better Be a Mirrorball","I Ain't Quite Where I Think I Am","Sculptures of Anything Goes",
    "Jet Skis on the Moat","Body Paint","The Car","Big Ideas","Hello You","Mr Schwartz","Perfect Sense"
  ]},

  // ========== JUNIOR H ==========
  { artistSlug: "junior-h", title: "$ad Boyz 4 Life", year: 2021, tracks: [
    "Intro","Como Jordan","Ella","El Hijo Mayor","Mente Positiva","Disfruto Lo Malo",
    "Se Amerita","Psicodelica","El Chamaquito","En La Ciudad","Extssy Model","El R8"
  ]},
  { artistSlug: "junior-h", title: "Contingente", year: 2022, tracks: [
    "El Azul","La People","Se Quedan Viendo","Los Botones Azules","El Vago","El Plumas","El Patrocinador"
  ]},
  { artistSlug: "junior-h", title: "$ad Boyz 4 Life II", year: 2023, tracks: [
    "Cuerno Azulado","La Capi","El Sera y El Chavo","El Gallero","Siempre Al Tiro","Fresas de la Capital",
    "El Rescate","Tres Botellas"
  ]},
  { artistSlug: "junior-h", title: "Mi Vida En Un Cigarro", year: 2019, tracks: [
    "Mi Vida En Un Cigarro","El De Los Lentes Gucci","El Chamaquito","No He Cambiado","El Pocho"
  ]},
  { artistSlug: "junior-h", title: "Mi Vida En Un Cigarro 2", year: 2019, tracks: [
    "El JB","El Vago","El P1","El De La 5.7","El Tiburon","Siempre High"
  ]},
  { artistSlug: "junior-h", title: "Atrapado en un Sueño", year: 2020, tracks: [
    "Atrapado en un Sueño","Mente Positiva","Psicodelica","El Chamaquito (En Vivo)","Extssy Model"
  ]},
  { artistSlug: "junior-h", title: "Cruisin' with Junior H", year: 2020, tracks: [
    "Cruisin","El Hijo Mayor","El Azul","La People","Los Botones Azules","Como Jordan"
  ]},

  // ========== ALEX TURNER ==========
  { artistSlug: "alex-turner", title: "Submarine OST", year: 2011, tracks: [
    "Stuck on the Puzzle","Stuck on the Puzzle (Intro)","Hiding Tonight","Glass in the Park",
    "It's Hard to Get Around the Wind","Piledriver Waltz"
  ]},
  { artistSlug: "alex-turner", title: "TLSP - The Age of the Understatement", year: 2008, tracks: [
    "The Age of the Understatement","Standing Next to Me","Calm Like You","Separate and Ever Deadly",
    "The Chamber","Only the Truth","My Mistakes Were Made for You","Black Plant",
    "I Don't Like You Anymore","In My Room","Meeting Place","Time Has Come Again"
  ]},
  { artistSlug: "alex-turner", title: "TLSP - Everything You've Come to Expect", year: 2016, tracks: [
    "Aviation","Miracle Aligner","Dracula Teeth","Everything You've Come to Expect",
    "The Element of Surprise","Bad Habits","Sweet Dreams, TN","Used to Be My Girl",
    "She Does the Woods","Pattern","The Dream Synopsis"
  ]},

  // ========== THE NEIGHBOURHOOD ==========
  { artistSlug: "the-neighbourhood", title: "I Love You.", year: 2013, tracks: [
    "How","Afraid","Everybody's Watching Me (Uh Oh)","Sweater Weather","Let It Go",
    "Alleyways","W.D.Y.W.F.M.?","Flawless","Female Robbery","Staying Up","Float"
  ]},
  { artistSlug: "the-neighbourhood", title: "Wiped Out!", year: 2015, tracks: [
    "A Moment of Silence","Prey","Cry Baby","Wiped Out!","The Beach","Daddy Issues",
    "Baby Came Home 2","Greetings from Califournia","Ferrari","Single","R.I.P. 2 My Youth"
  ]},
  { artistSlug: "the-neighbourhood", title: "The Neighbourhood", year: 2018, tracks: [
    "Flowers","Scary Love","Nervous","Void","Softcore","Blue","Sadderdaze","Revenge",
    "You Get Me So High","Reflections","Roll Call","Stuck with Me"
  ]},
  { artistSlug: "the-neighbourhood", title: "Chip Chrome & The Mono-Tones", year: 2020, tracks: [
    "Chip Chrome","Pretty Boy","Lost in Translation","The Mono-Tones","BooHoo",
    "Silver Lining","Tobacco Sunburst","Hell or High Water","Devil's Advocate","Cherry Flavoured","Middle of Somewhere"
  ]},
  { artistSlug: "the-neighbourhood", title: "I'm Sorry...", year: 2012, tracks: [
    "I'm Sorry...","How","Sweater Weather","Female Robbery","Wires"
  ]},
  { artistSlug: "the-neighbourhood", title: "Thank You", year: 2012, tracks: [
    "Thank You","A Little Death","Everybody's Watching Me (Uh Oh)","Let It Go"
  ]},
  { artistSlug: "the-neighbourhood", title: "Hard", year: 2017, tracks: [
    "Hard to Imagine","Void","Scary Love","Nervous","Blue","Sadderdaze"
  ]},

  // ========== BEACH WEATHER ==========
  { artistSlug: "beach-weather", title: "Chit Chat", year: 2016, tracks: [
    "Sex, Drugs, Etc.","Chit Chat","Swoon","Wolf","Goddess","Rebel Sun","Home Movies","New Skin"
  ]},
  { artistSlug: "beach-weather", title: "Pineapple Sunrise", year: 2023, tracks: [
    "Pineapple Sunrise","Unlovable","Trouble With This Bed","Hard Feelings","High In Low Places",
    "Hottest Summer On Record","Fake Nice","Silent Type","Desert Oasis"
  ]},

  // ========== CALLE 24 ==========
  { artistSlug: "calle-24", title: "Qué Onda (Single)", year: 2023, tracks: ["Qué Onda"] },
  { artistSlug: "calle-24", title: "Moda (Single)", year: 2023, tracks: ["Moda"] },
  { artistSlug: "calle-24", title: "Grandes Éxitos", year: 2024, tracks: [
    "Qué Onda","Moda","Malo Es No Hacer Billete","El De La G","La Bolsa","El Niño","El Pitufo"
  ]},

  // ========== CHUY MONTANA ==========
  { artistSlug: "chuy-montana", title: "Corridos Belicos", year: 2023, tracks: [
    "Corrido Belico","El Chuy","La Loquera","Sangre Nueva","Mi Compa","Falsas Amistades","La Plebada"
  ]},
  { artistSlug: "chuy-montana", title: "Porte Fino", year: 2024, tracks: [
    "Porte Fino","El Corrido del JR","Gente del General","La Captura","Sigo Vigente","Los Pasajes"
  ]},

  // ========== ESDEKID ==========
  { artistSlug: "esdeekid", title: "Trap Latino, Vol. 1", year: 2023, tracks: [
    "Intro","Dinero Sucio","Calles Calientes","Mafia Latina","Flow Pesado","No Confio",
    "Blanco y Negro","Traicion","La Calle Me Llama","Subiendo de Nivel"
  ]},
  { artistSlug: "esdeekid", title: "Flow Pesado", year: 2024, tracks: [
    "Flow Pesado","Callejero","Sur 13","Plata O Plomo","Sangre x Dinero","El Patron",
    "Trap Star","Zona de Guerra","Barrio Pesado","Despertar"
  ]},

  // ========== HADES66 ==========
  { artistSlug: "hades66", title: "666", year: 2023, tracks: [
    "666 Intro","Bendiciones","Diablita","Infierno","La Familia","Saturno","Oro y Plata",
    "Calles de Fuego","Demonios Internos","Salvacion","666 Outro"
  ]},
  { artistSlug: "hades66", title: "Inferno", year: 2024, tracks: [
    "Inferno Intro","Inframundo","Mente Fría","Pecado Capital","Diamantes Negros","Sombras",
    "Sicario","La Ultima Vez","Cenizas","Renacer","Inferno Outro"
  ]},
]

async function main() {
  const existingArtists = await p.artist.count()
  if (existingArtists > 0) {
    console.log(`Ya hay ${existingArtists} artistas. Saltando seed.`)
    return
  }

  for (const a of ARTISTS) {
    await p.artist.create({
      data: {
        ...a,
        image: `https://api.dicebear.com/9.x/open-peeps/svg?seed=${a.slug}`,
      },
    })
  }
  console.log(`${ARTISTS.length} artistas creados.`)

  let totalTracks = 0
  for (const alb of ALBUMS) {
    const artist = await p.artist.findUnique({ where: { slug: alb.artistSlug } })
    if (!artist) { console.log(`Artista no encontrado: ${alb.artistSlug}`); continue }
    const slug = alb.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "")
    const album = await p.album.create({
      data: {
        title: alb.title, slug, artistId: artist.id, year: alb.year,
        coverImage: `https://picsum.photos/seed/${slug}/300/300`,
      },
    })
    for (let i = 0; i < alb.tracks.length; i++) {
      await p.track.create({
        data: {
          title: alb.tracks[i], artistId: artist.id, albumId: album.id,
          trackNumber: i + 1, duration: 180 + Math.floor(Math.random() * 120),
        },
      })
      totalTracks++
    }
  }

  console.log(`Seed completado: ${ARTISTS.length} artistas, ${ALBUMS.length} álbumes, ${totalTracks} canciones.`)
}

main()
  .catch((e) => {
    console.error("Error seeding music:", e)
    process.exit(1)
  })
  .finally(() => p.$disconnect())
