export type Service = {
  title: string;
  description: string;
  useCase: string;
  startingPoint: string;
};

export type PortfolioItem = {
  slug: string;
  title: string;
  category: "Music" | "Photography";
  description: string;
  longDescription: string;
  mediaType: "audio" | "image";
  client: string;
  featured: boolean;
  sortOrder: number;
  format: "portrait" | "landscape" | "square" | "wide";
  palette: "cognac" | "noir" | "sand" | "sage" | "clay" | "ink";
};

export const publicSite = {
  brand: "Tyrone Perez",
  descriptor: "Music Production & Photography",
  line: "Sound. Image. Story.",
  domain: "tyroneperez.com",
  email: "hello@tyroneperez.com",
  contactNote: "Replace this email and response-time note before launch.",
  nav: [
    { href: "/", label: "Home" },
    { href: "/music", label: "Music Production" },
    { href: "/photography", label: "Photography" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  socials: [
    { label: "Instagram", href: "#instagram-placeholder" },
    { label: "YouTube", href: "#youtube-placeholder" },
    { label: "SoundCloud", href: "#soundcloud-placeholder" },
  ],
};

export const homeContent = {
  heroKicker: "Independent creative practice",
  heroSupport: "Sound. Image. Story.",
  selectorHeading: "What are we creating?",
  paths: [
    {
      href: "/music",
      label: "Music Production",
      line: "Sound, shaped with intention.",
      detail: "Recording, mixing, mastering, and full-song production.",
      mood: "music",
    },
    {
      href: "/photography",
      label: "Photography",
      line: "Images that hold a feeling.",
      detail: "Portraits, milestones, brands, and gatherings.",
      mood: "photo",
    },
  ],
  selectedHeading: "Selected work",
  selectedIntro: "Sound and image.",
  introKicker: "About",
  introHeading: "An artist working in sound and image.",
  introBody: "Music and photography, shaped with attention.",
  introNote: "Personalize this introduction with Tyrone’s own background and creative philosophy before launch.",
  servicesHeading: "Ways to work together",
  ctaHeading: "Start a project.",
  ctaBody: "Bring the idea.",
};

export const musicContent = {
  kicker: "Music Production",
  heading: "Make the record feel like you.",
  intro: "A focused, artist-first space for recording, shaping, and finishing music with intention.",
  biography: "Tyrone’s music-production biography belongs here: his musical perspective, the kind of sessions he values, and how he helps artists move from an early idea to a finished record.",
  biographyNote: "Replace this biography with Tyrone’s personal story before launch.",
  servicesHeading: "Studio services",
  servicesIntro: "Flexible starting points for artists, vocalists, writers, churches, and creative teams.",
  services: [
    {
      title: "Recording Session",
      description: "A comfortable, detail-minded session for capturing vocals or instruments with clarity and character.",
      useCase: "For artists ready to record a new vocal, instrument, demo, or final performance.",
      startingPoint: "Scope begins with session length, recording needs, and preparation.",
    },
    {
      title: "Mixing",
      description: "Balance, depth, movement, and polish while protecting the emotion at the center of the song.",
      useCase: "For finished recordings that need a cohesive, release-minded mix.",
      startingPoint: "Scope begins with track count, edit needs, and delivery goals.",
    },
    {
      title: "Mastering",
      description: "The final listening pass for translation, consistency, and a confident release-ready finish.",
      useCase: "For approved mixes preparing for digital distribution or a larger project.",
      startingPoint: "Scope begins with the number of songs and intended release format.",
    },
    {
      title: "Full Song Production",
      description: "Collaborative support from arrangement and sound selection through recording, mixing, and final delivery.",
      useCase: "For an artist with a song, voice memo, or vision that needs full creative development.",
      startingPoint: "Scope begins with the song’s current stage and the support it needs.",
    },
    {
      title: "Worship Playback Editing",
      description: "Thoughtful arrangement and playback edits shaped around the needs of a live worship team.",
      useCase: "For teams adapting tracks, transitions, keys, or song structures for service.",
      startingPoint: "Scope begins with set needs, source files, and requested arrangement changes.",
    },
  ] satisfies Service[],
  featuredHeading: "Featured sound",
  featuredIntro: "These interface studies reserve space for final audio examples. No audio plays automatically.",
  process: [
    { step: "01", title: "Listen", body: "Talk through the song, references, goals, and where the project stands." },
    { step: "02", title: "Shape", body: "Choose the right session plan, creative direction, and technical approach." },
    { step: "03", title: "Create", body: "Record, edit, produce, or mix with focused feedback at each milestone." },
    { step: "04", title: "Finish", body: "Review final details and prepare organized, intentional deliverables." },
  ],
  faqs: [
    { question: "What should I bring to a first conversation?", answer: "Bring the song, demo, voice memo, references, and any timeline you already have. The process can begin before every detail is decided." },
    { question: "Can I book one service or a full production?", answer: "Yes. Projects can begin with a focused session or with support across the full production process." },
    { question: "Will pricing be listed online?", answer: "Every project has different needs. The future guided inquiry will gather enough context to recommend the right starting point." },
    { question: "Where can I hear finished work?", answer: "Final audio examples will replace the clearly labeled portfolio placeholders before launch." },
  ],
  ctaHeading: "Your next song deserves a clear next step.",
};

export const photographyContent = {
  kicker: "Photography",
  heading: "Images that hold the feeling.",
  intro: "Relaxed, intentional photography for people, milestones, communities, and creative work.",
  biography: "Tyrone’s photography biography belongs here: what he notices, how he helps people feel comfortable, and what he hopes an image continues to say years later.",
  biographyNote: "Replace this biography with Tyrone’s personal perspective before launch.",
  categoriesHeading: "Photography services",
  categories: [
    {
      title: "Graduation Photography",
      description: "A personal, celebratory session shaped around the place, details, and people that made the milestone meaningful.",
      useCase: "For graduates who want polished portraits with room for personality.",
      startingPoint: "Scope begins with location, timing, outfit changes, and group needs.",
    },
    {
      title: "Portrait Session",
      description: "Purposeful portraits with simple direction and space to settle into the camera.",
      useCase: "For individuals, creatives, announcements, or simply marking a season.",
      startingPoint: "Scope begins with intended use, location, and desired visual tone.",
    },
    {
      title: "Branding and Headshots",
      description: "A cohesive library of portraits and details that feels aligned with the person behind the work.",
      useCase: "For professionals, founders, artists, and small creative teams.",
      startingPoint: "Scope begins with brand needs, usage, locations, and image variety.",
    },
    {
      title: "Church Event Photography",
      description: "Observant coverage of worship, community, and the moments happening around the room.",
      useCase: "For services, conferences, celebrations, and ministry gatherings.",
      startingPoint: "Scope begins with schedule, coverage length, and key moments.",
    },
    {
      title: "Couples or Family Session",
      description: "Warm, lightly directed photographs centered on connection rather than perfect posing.",
      useCase: "For couples, growing families, anniversaries, and meaningful seasons.",
      startingPoint: "Scope begins with group size, location, timing, and the story you want remembered.",
    },
  ] satisfies Service[],
  portfolioHeading: "Featured photographs",
  portfolioIntro: "Editorial placeholders demonstrate the final portrait, landscape, and square image rhythm.",
  process: [
    { step: "01", title: "Plan", body: "Clarify the purpose, mood, location, timing, and must-have images." },
    { step: "02", title: "Prepare", body: "Receive practical guidance for clothing, logistics, and feeling camera-ready." },
    { step: "03", title: "Photograph", body: "Move through the session with calm direction and room for natural moments." },
    { step: "04", title: "Deliver", body: "Receive a considered gallery prepared for the ways you plan to use it." },
  ],
  faqs: [
    { question: "How do we choose a location?", answer: "The right location follows the story, visual mood, and practical needs of the session. Final recommendations can be made during planning." },
    { question: "What if I feel awkward in front of the camera?", answer: "That is normal. The session is designed around simple direction, movement, and enough time to feel settled." },
    { question: "Can a session include more than one person?", answer: "Yes. Couples, families, teams, and group needs can all be discussed when shaping the session." },
    { question: "When will real galleries appear here?", answer: "Final client-approved media will replace every clearly labeled placeholder before launch." },
  ],
  ctaHeading: "Let’s make photographs you’ll want to return to.",
};

export const portfolioItems: PortfolioItem[] = [
  {
    slug: "graduation-in-motion",
    title: "Graduation in Motion",
    category: "Photography",
    description: "A bright, celebratory portrait story.",
    longDescription: "A placeholder case study for a graduation session built around movement, place, and the details that make the milestone personal. Replace this copy and media with a client-approved project.",
    mediaType: "image",
    client: "Client name to be added",
    featured: true,
    sortOrder: 1,
    format: "portrait",
    palette: "clay",
  },
  {
    slug: "after-the-last-take",
    title: "After the Last Take",
    category: "Music",
    description: "A rich, intimate mix and production study.",
    longDescription: "A placeholder case study for a song shaped through recording, arrangement, mixing, and final delivery. Replace this story with approved artist credits and audio.",
    mediaType: "audio",
    client: "Artist name to be added",
    featured: true,
    sortOrder: 2,
    format: "landscape",
    palette: "noir",
  },
  {
    slug: "quiet-confidence",
    title: "Quiet Confidence",
    category: "Photography",
    description: "Editorial portraits for a personal brand.",
    longDescription: "A placeholder story for a branding session balancing polished portraits, working details, and relaxed environmental images. Replace all content with approved project information.",
    mediaType: "image",
    client: "Client name to be added",
    featured: true,
    sortOrder: 3,
    format: "square",
    palette: "sand",
  },
  {
    slug: "room-for-the-vocal",
    title: "Room for the Vocal",
    category: "Music",
    description: "A vocal-led mixing study.",
    longDescription: "A placeholder project about creating depth and space around a lead vocal while keeping the performance close. Replace this description and audio with a real release.",
    mediaType: "audio",
    client: "Artist name to be added",
    featured: false,
    sortOrder: 4,
    format: "square",
    palette: "ink",
  },
  {
    slug: "gathered-together",
    title: "Gathered Together",
    category: "Photography",
    description: "A documentary approach to community.",
    longDescription: "A placeholder case study for church-event coverage attentive to worship, connection, and the moments around the main program. Replace with client-approved photography.",
    mediaType: "image",
    client: "Organization name to be added",
    featured: false,
    sortOrder: 5,
    format: "wide",
    palette: "sage",
  },
  {
    slug: "built-from-a-voice-note",
    title: "Built from a Voice Note",
    category: "Music",
    description: "A full-song production journey.",
    longDescription: "A placeholder project following a song from an early voice memo through arrangement, recording, and a finished master. Replace with the real artist story and approved audio.",
    mediaType: "audio",
    client: "Artist name to be added",
    featured: false,
    sortOrder: 6,
    format: "landscape",
    palette: "cognac",
  },
];

export const aboutContent = {
  kicker: "About",
  heading: "One practice, two ways of paying attention.",
  introduction: "Tyrone’s personal introduction belongs here—a warm, first-person welcome that shares who he is beyond a list of services and why music and photography belong together in his creative practice.",
  introductionNote: "Replace this introduction with Tyrone’s own voice before launch.",
  backgroundHeading: "Creative background",
  background: "Add Tyrone’s real creative background here without turning it into a résumé: formative experiences, communities, influences, and the path that brought him to this work.",
  backgroundNote: "Personalize with verified details only. Do not add dates, locations, clients, awards, or credentials unless Tyrone provides them.",
  disciplines: [
    { title: "Music Production", body: "A collaborative process built around listening, clarity, and protecting the emotion that made the song worth starting." },
    { title: "Photography", body: "A visual practice grounded in presence—offering enough direction to feel confident without losing what is honest." },
  ],
  values: [
    { title: "Listen first", body: "Understand the person, purpose, and feeling before choosing the tools." },
    { title: "Make it personal", body: "The work should feel specific to the person who trusted Tyrone to make it." },
    { title: "Keep it clear", body: "A calm process and honest communication create room for better creative decisions." },
    { title: "Finish with care", body: "The final details matter because they shape how the work lives beyond the session." },
  ],
  ctaHeading: "If the approach feels right, let’s talk about the idea.",
};

export const contactContent = {
  kicker: "Contact",
  heading: "Start with a conversation.",
  intro: "For general questions, collaborations, or anything that does not fit neatly into a category, reach out directly.",
  responseTime: "Response-time expectation to be confirmed before launch.",
  responseNote: "Replace this placeholder with Tyrone’s actual availability and response expectation.",
  routes: [
    { label: "Music Production", body: "Recording, mixing, mastering, production, and playback editing.", href: "/start?type=music" },
    { label: "Photography", body: "Portraits, graduations, branding, church events, couples, and families.", href: "/start?type=photography" },
  ],
};

export const startContent = {
  kicker: "Start Your Project",
  heading: "A more thoughtful way to begin is coming next.",
  body: "The guided inquiry experience is being prepared to ask the right questions without making the process feel complicated. Soon, you’ll be able to share your goals, timing, and project details here.",
  expectation: "For now, choose a direction to preview what the future inquiry will cover, or send a direct note.",
  options: [
    { type: "music", title: "Music Production", body: "Tell us about the song, service, current stage, references, and ideal timing." },
    { type: "photography", title: "Photography", body: "Tell us about the session, people, purpose, location, and preferred date." },
  ],
};
