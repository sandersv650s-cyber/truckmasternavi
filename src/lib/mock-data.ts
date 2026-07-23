export type Ride = {
  id: string;
  date: string; // ISO
  from: string;
  to: string;
  km: number;
  durationMin: number;
  idleMin: number;
  avgSpeed: number;
  maxSpeed: number;
  liters: number;
  l100: number;
  points: { t: number; speed: number; fuel: number }[];
};

export type User = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  truck: string;
  avatar: string;
  followers: number;
  following: number;
  badges: string[];
  photos: string[];
};

export type Post = {
  id: string;
  userId: string;
  createdAt: string;
  text: string;
  image?: string;
  likes: number;
  liked?: boolean;
  comments: { userId: string; text: string; createdAt: string }[];
};

export type ChatMessage = {
  id: string;
  from: string;
  text: string;
  at: string;
};

export type Chat = {
  id: string;
  userId: string;
  messages: ChatMessage[];
};

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/adventurer/svg?backgroundColor=1e3a5f&seed=${seed}`;

const photo = (seed: string, w = 800, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const currentUser: User = {
  id: "u1",
  name: "Jan de Vries",
  handle: "@jandevries",
  bio: "Internationaal chauffeur • 22 jaar op de weg • Volvo FH16 fan",
  truck: "Volvo FH16 750",
  avatar: avatar("jan"),
  followers: 1284,
  following: 342,
  badges: ["🏆 100k km", "🌍 EU Traveler", "⛽ Zuinige rijder", "🤝 Community held"],
  photos: [photo("truck1"), photo("truck2"), photo("truck3"), photo("truck4"), photo("truck5"), photo("truck6")],
};

export const users: User[] = [
  currentUser,
  {
    id: "u2",
    name: "Sanne Bakker",
    handle: "@sannetrucks",
    bio: "Tanktransport • Rotterdam ↔ Hamburg",
    truck: "Scania R500",
    avatar: avatar("sanne"),
    followers: 892,
    following: 210,
    badges: ["🚚 Nieuwe rijder", "🌱 Eco driver"],
    photos: [photo("s1"), photo("s2"), photo("s3")],
  },
  {
    id: "u3",
    name: "Mo El Amrani",
    handle: "@mo_on_road",
    bio: "Koeltransport • Benelux specialist",
    truck: "DAF XG+ 530",
    avatar: avatar("mo"),
    followers: 2103,
    following: 512,
    badges: ["🏆 250k km", "❄️ Koel expert"],
    photos: [photo("m1"), photo("m2"), photo("m3"), photo("m4")],
  },
  {
    id: "u4",
    name: "Piet Jansen",
    handle: "@pietopdeweg",
    bio: "Kiepwagen • bouwvervoer regio Utrecht",
    truck: "MAN TGS 35.480",
    avatar: avatar("piet"),
    followers: 456,
    following: 189,
    badges: ["🏗️ Bouwrijder"],
    photos: [photo("p1"), photo("p2")],
  },
];

function makePoints(count: number, avg: number): { t: number; speed: number; fuel: number }[] {
  return Array.from({ length: count }, (_, i) => ({
    t: i,
    speed: Math.max(0, Math.round(avg + Math.sin(i / 3) * 20 + (Math.random() * 10 - 5))),
    fuel: +(28 + Math.sin(i / 4) * 4 + Math.random() * 2).toFixed(1),
  }));
}

export const rides: Ride[] = [
  {
    id: "r1",
    date: "2026-07-22T06:30:00Z",
    from: "Rotterdam, NL",
    to: "Antwerpen, BE",
    km: 108,
    durationMin: 96,
    idleMin: 12,
    avgSpeed: 68,
    maxSpeed: 89,
    liters: 32,
    l100: 29.6,
    points: makePoints(24, 70),
  },
  {
    id: "r2",
    date: "2026-07-20T04:15:00Z",
    from: "Amsterdam, NL",
    to: "Keulen, DE",
    km: 267,
    durationMin: 218,
    idleMin: 28,
    avgSpeed: 73,
    maxSpeed: 92,
    liters: 79,
    l100: 29.6,
    points: makePoints(36, 75),
  },
  {
    id: "r3",
    date: "2026-07-17T09:00:00Z",
    from: "Utrecht, NL",
    to: "Parijs, FR",
    km: 512,
    durationMin: 402,
    idleMin: 46,
    avgSpeed: 76,
    maxSpeed: 95,
    liters: 152,
    l100: 29.7,
    points: makePoints(48, 78),
  },
];

export const posts: Post[] = [
  {
    id: "p1",
    userId: "u3",
    createdAt: "2026-07-23T08:12:00Z",
    text: "Prachtige zonsopgang boven de Moerdijkbrug vanochtend 🌅",
    image: photo("sunrise"),
    likes: 128,
    comments: [
      { userId: "u1", text: "Fantastisch shot!", createdAt: "2026-07-23T08:20:00Z" },
      { userId: "u2", text: "Waar precies?", createdAt: "2026-07-23T08:33:00Z" },
    ],
  },
  {
    id: "p2",
    userId: "u2",
    createdAt: "2026-07-22T19:44:00Z",
    text: "Tip: parkeerplaats Hasselt-Oost heeft eindelijk weer werkende douches 🚿",
    likes: 54,
    comments: [{ userId: "u4", text: "Top, dank!", createdAt: "2026-07-22T20:10:00Z" }],
  },
  {
    id: "p3",
    userId: "u4",
    createdAt: "2026-07-21T13:05:00Z",
    text: "Nieuwe kiepwagen opgehaald. Wat een beest 💪",
    image: photo("newtruck"),
    likes: 201,
    comments: [],
  },
];

export const chats: Chat[] = [
  {
    id: "c1",
    userId: "u3",
    messages: [
      { id: "m1", from: "u3", text: "Hé Jan, rij jij morgen ook naar Duisburg?", at: "2026-07-23T09:10:00Z" },
      { id: "m2", from: "u1", text: "Ja, vertrek om 5. Konvooi?", at: "2026-07-23T09:12:00Z" },
      { id: "m3", from: "u3", text: "Zeker weten 👍", at: "2026-07-23T09:13:00Z" },
    ],
  },
  {
    id: "c2",
    userId: "u2",
    messages: [
      { id: "m1", from: "u2", text: "Bedankt voor de tip over die parkeerplaats!", at: "2026-07-22T21:00:00Z" },
    ],
  },
  {
    id: "c3",
    userId: "u4",
    messages: [
      { id: "m1", from: "u4", text: "Weet jij een goede diesel-tankplek bij A2?", at: "2026-07-21T15:30:00Z" },
      { id: "m2", from: "u1", text: "Truckpoint Vinkeveen is prima.", at: "2026-07-21T15:45:00Z" },
    ],
  },
];

export function userById(id: string): User {
  return users.find((u) => u.id === id) ?? currentUser;
}

export function rideById(id: string): Ride | undefined {
  return rides.find((r) => r.id === id);
}

export function chatById(id: string): Chat | undefined {
  return chats.find((c) => c.id === id);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" });
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}u ${m}m` : `${m}m`;
}