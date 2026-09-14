// Reliable primary and backup API endpoints
const API_ENDPOINTS = [
  "https://jiosaavn-api-codyandersan.vercel.app",
  "https://saavn.dev"
];

// DOM References
const audio = document.getElementById("audioElement");
const playPauseBtn = document.getElementById("playPauseBtn");
const playPauseIcon = document.getElementById("playPauseIcon");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progressBar = document.getElementById("progressBar");
const currentTimeEl = document.getElementById("currentTime");
const durationTimeEl = document.getElementById("durationTime");
const volumeBar = document.getElementById("volumeBar");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchSuggestions = document.getElementById("searchSuggestions");
const dynamicContainer = document.getElementById("dynamicContainer");
const sectionTitle = document.getElementById("sectionTitle");
const chipsContainer = document.getElementById("chipsContainer");

const playerTitle = document.getElementById("playerTitle");
const playerArtist = document.getElementById("playerArtist");
const playerThumb = document.getElementById("playerThumb");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const repeatIcon = document.getElementById("repeatIcon");
const likeBtn = document.getElementById("likeBtn");
const miniProgressFill = document.getElementById("miniProgressFill");
const soundWave = document.getElementById("soundWave");
const dynamicBg = document.getElementById("dynamicBg");

const fullscreenPlayer = document.getElementById("fullscreenPlayer");
const openFullPlayerTrigger = document.getElementById("openFullPlayerTrigger");
const closeFsPlayer = document.getElementById("closeFsPlayer");
const expandDesktopBtn = document.getElementById("expandDesktopBtn");
const fsThumb = document.getElementById("fsThumb");
const fsTitle = document.getElementById("fsTitle");
const fsArtist = document.getElementById("fsArtist");
const fsProgressBar = document.getElementById("fsProgressBar");
const fsCurrentTime = document.getElementById("fsCurrentTime");
const fsDurationTime = document.getElementById("fsDurationTime");
const fsPlayPauseBtn = document.getElementById("fsPlayPauseBtn");
const fsPlayPauseIcon = document.getElementById("fsPlayPauseIcon");
const fsPrevBtn = document.getElementById("fsPrevBtn");
const fsNextBtn = document.getElementById("fsNextBtn");
const fsShuffleBtn = document.getElementById("fsShuffleBtn");
const fsRepeatBtn = document.getElementById("fsRepeatBtn");
const fsRepeatIcon = document.getElementById("fsRepeatIcon");
const fsLikeBtn = document.getElementById("fsLikeBtn");
const fsBgGlow = document.getElementById("fsBgGlow");
const fsArtGlow = document.getElementById("fsArtGlow");
const fsSwipeZone = document.getElementById("fsSwipeZone");
const fsArtworkCard = document.getElementById("fsArtworkCard");

// Global Queue & State
let queue = [];
let originalQueue = [];
let currentIndex = -1;
let isShuffle = false;
let repeatState = 0; // 0 = off, 1 = all, 2 = one
let userTasteHistory = JSON.parse(localStorage.getItem("yt_taste_history") || "[]");

// In-Memory Artist Image Cache
const artistImageCache = new Map();

// Robust category queries
const DYNAMIC_QUERY_POOLS = {
  "Trending": ["Trending Hindi", "Arijit Singh Hits", "Latest Bollywood", "Top Hindi"],
  "Bollywood": ["Top Bollywood", "Bollywood Hits", "New Hindi Songs"],
  "English Pop": ["English Pop", "Pop Hits", "Global Top"],
  "Classic Oldies": ["Kishore Kumar", "Lata Mangeshkar", "Retro Bollywood", "RD Burman"],
  "Indian Classic": ["Indian Classical", "Ravi Shankar", "Bhimsen Joshi", "Classical Instrumental"],
  "90s Indian Song": ["90s Bollywood", "Kumar Sanu", "Alka Yagnik", "Udit Narayan"],
  "English POP": ["English Pop", "Pop Hits", "Global Hits"],
  "Sad": ["Arijit Singh Sad", "Sad Songs Hindi", "Heartbreak Hindi"],
  "Romance": ["Romantic Hindi", "Love Songs", "Bollywood Romance"],
  "Workout": ["Gym Motivation Hindi", "Workout Beats", "Punjabi Workout"],
  "Travel": ["Travel Songs Hindi", "Road Trip Hindi", "Bollywood Travel"],
  "Lo-Fi & Chill": ["Lo-Fi Hindi", "Chill Lo-Fi", "Bollywood Lo-Fi"],
  "Hindi": ["Hindi Top Hits", "Hindi Chartbusters", "Best of Hindi"],
  "English": ["English Pop Hits", "Top English Songs", "Billboard Hits"],
  "Bengali": ["Bengali Hits", "Arijit Singh Bengali", "Rabindra Sangeet"],
  "Tamil": ["Tamil Top Hits", "Anirudh Ravichander", "AR Rahman Tamil"],
  "Telugu": ["Telugu Top Hits", "Best of Telugu", "Tollywood Hits"],
  "Punjabi": ["Punjabi Hits", "Sidhu Moosewala", "Diljit Dosanjh"],
  "Bhojpuri": ["Bhojpuri Top Hits", "Pawan Singh", "Khesari Lal"]
};

function getFreshQuery(label, fallback) {
  const pool = DYNAMIC_QUERY_POOLS[label];
  if (pool && pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return fallback;
}

// Categorized Chips Definition
const CATEGORY_CHIPS = {
  home: [
    { label: "Trending", q: "Trending Hindi" },
    { label: "Bollywood", q: "Top Bollywood" },
    { label: "English Pop", q: "English Pop" },
    { label: "Classic Oldies", q: "Kishore Kumar" }
  ],
  explore: [
    { label: "Indian Classic", q: "Indian Classical" },
    { label: "90s Indian Song", q: "90s Bollywood" },
    { label: "English POP", q: "English Pop" }
  ],
  moodmix: [
    { label: "Sad", q: "Arijit Singh Sad" },
    { label: "Romance", q: "Romantic Hindi" },
    { label: "Workout", q: "Gym Motivation Hindi" },
    { label: "Travel", q: "Travel Songs Hindi" },
    { label: "Lo-Fi & Chill", q: "Lo-Fi Hindi" }
  ],
  languages: [
    { label: "Hindi", q: "Hindi Top Hits" },
    { label: "English", q: "English Pop Hits" },
    { label: "Bengali", q: "Bengali Hits" },
    { label: "Tamil", q: "Tamil Top Hits" },
    { label: "Telugu", q: "Telugu Top Hits" },
    { label: "Punjabi", q: "Punjabi Hits" },
    { label: "Bhojpuri", q: "Bhojpuri Top Hits" }
  ]
};

// 1. Bitrate & Image Helpers
function get320kbpsMediaUrl(song) {
  if (Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
    const highest = song.downloadUrl[song.downloadUrl.length - 1];
    return highest?.link || highest?.url || song.downloadUrl[0]?.link || song.downloadUrl[0]?.url;
  }
  return song.media_url || "";
}

function getHighResCover(item) {
  if (Array.isArray(item.image)) {
    return item.image[2]?.link || item.image[2]?.url || 
           item.image[1]?.link || item.image[1]?.url || 
           item.image[0]?.link || item.image[0]?.url || "icon.png";
  }
  if (typeof item.image === "string" && item.image.length > 0) return item.image;
  return "icon.png";
}

function getArtistName(song) {
  if (song.artists?.primary && Array.isArray(song.artists.primary)) {
    return song.artists.primary.map(a => a.name).join(", ");
  }
  return song.primaryArtists || song.artist || "Unknown Artist";
}

// 2. Dedicated Artist Profile Photo Fetcher
async function fetchArtistProfileImage(artistName) {
  const clean = artistName.trim();
  if (artistImageCache.has(clean)) {
    return artistImageCache.get(clean);
  }

  for (const base of API_ENDPOINTS) {
    const urls = [
      `${base}/api/search/artists?query=${encodeURIComponent(clean)}`,
      `${base}/search/artists?query=${encodeURIComponent(clean)}`
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          let list = [];
          if (data?.data?.results) list = data.data.results;
          else if (Array.isArray(data?.data)) list = data.data;
          else if (Array.isArray(data?.results)) list = data.results;

          if (list.length > 0) {
            const match = list.find(a => (a.name || a.title || "").toLowerCase() === clean.toLowerCase()) || list[0];
            const img = getHighResCover(match);
            if (img && img !== "icon.png") {
              artistImageCache.set(clean, img);
              return img;
            }
          }
        }
      } catch (_) {}
    }
  }

  artistImageCache.set(clean, "icon.png");
  return "icon.png";
}

// 3. Dynamic Ambient Gradient Extractor
function applyDynamicColorGradient(imgUrl) {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = imgUrl;
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 1;
      canvas.height = 1;
      ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

      const c1 = `rgb(${r}, ${g}, ${b})`;
      const c2 = `rgb(${Math.max(0, r - 70)}, ${Math.max(0, g - 50)}, ${Math.max(0, b + 40)})`;
      const c3 = `rgb(${Math.max(0, r + 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;

      dynamicBg.style.background = `radial-gradient(circle at 15% 25%, ${c1} 0%, transparent 50%),
                                   radial-gradient(circle at 85% 75%, ${c2} 0%, transparent 50%),
                                   radial-gradient(circle at 50% 50%, ${c3} 0%, transparent 55%)`;

      fsBgGlow.style.background = `radial-gradient(circle at center, ${c1}, #050505 80%)`;
      fsArtGlow.style.background = c1;
    } catch (_) {}
  };
}

// 4. Bidirectional (Ping-Pong) Marquee Animation
function checkAndApplyMarquee(element, text) {
  element.textContent = text;
  element.classList.remove("marquee-active");
  void element.offsetWidth;
  const parent = element.parentElement;

  if (element.scrollWidth > parent.clientWidth + 4) {
    const diff = element.scrollWidth - parent.clientWidth;
    element.style.setProperty("--marquee-distance", `-${diff + 16}px`);
    const duration = Math.max(8, diff / 22);
    element.style.setProperty("--marquee-duration", `${duration}s`);
    element.classList.add("marquee-active");
  }
}

// 5. Multi-Artist Renderer
function renderInteractiveArtists(container, artistString) {
  container.innerHTML = "";
  container.classList.remove("marquee-active");

  const artists = artistString.split(",").map(a => a.trim()).filter(Boolean);

  artists.forEach((artist, index) => {
    const span = document.createElement("span");
    span.className = "single-artist";
    span.textContent = artist;
    span.addEventListener("click", (e) => {
      e.stopPropagation();
      loadArtistPage(artist);
      fullscreenPlayer.classList.remove("open");
    });
    container.appendChild(span);

    if (index < artists.length - 1) {
      const sep = document.createElement("span");
      sep.className = "artist-separator";
      sep.textContent = ", ";
      container.appendChild(sep);
    }
  });

  void container.offsetWidth;
  const parent = container.parentElement;

  if (container.scrollWidth > parent.clientWidth + 4) {
    const diff = container.scrollWidth - parent.clientWidth;
    container.style.setProperty("--marquee-distance", `-${diff + 16}px`);
    const duration = Math.max(9, diff / 20);
    container.style.setProperty("--marquee-duration", `${duration}s`);
    container.classList.add("marquee-active");
  }
}

// 6. Safe & Resilient Song Fetch Engine
async function fetchSafeSongs(query) {
  const cleanQ = query.trim();

  for (const base of API_ENDPOINTS) {
    const urls = [
      `${base}/api/search/songs?query=${encodeURIComponent(cleanQ)}`,
      `${base}/search/songs?query=${encodeURIComponent(cleanQ)}`
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          let list = [];
          if (data?.data?.results) list = data.data.results;
          else if (Array.isArray(data?.data)) list = data.data;
          else if (Array.isArray(data?.results)) list = data.results;

          if (list && list.length > 0) return list;
        }
      } catch (_) {}
    }
  }

  // Simplified query fallback
  if (cleanQ.includes(" ")) {
    const simplified = cleanQ.split(" ")[0];
    for (const base of API_ENDPOINTS) {
      try {
        const res = await fetch(`${base}/api/search/songs?query=${encodeURIComponent(simplified)}`);
        if (res.ok) {
          const data = await res.json();
          const list = data?.data?.results || data?.results || [];
          if (list && list.length > 0) return list;
        }
      } catch (_) {}
    }
  }

  return [];
}

// 7. Intelligent Multi-Section Display
async function executeMasterSearch(query, displayLabel = null) {
  if (!query) return;
  sectionTitle.textContent = displayLabel ? displayLabel : `Results for "${query}"`;
  dynamicContainer.innerHTML = `<p class="status-msg">Loading songs and artists...</p>`;

  const songs = await fetchSafeSongs(query);

  if (!songs || songs.length === 0) {
    dynamicContainer.innerHTML = `<p class="status-msg">No music found. Try clicking another category or search above.</p>`;
    return;
  }

  dynamicContainer.innerHTML = "";

  // 1. Artists Section
  const distinctArtists = new Set();
  songs.forEach(song => {
    const rawArtists = getArtistName(song).split(",").map(a => a.trim());
    rawArtists.forEach(artist => {
      if (artist && !distinctArtists.has(artist)) {
        distinctArtists.add(artist);
      }
    });
  });

  const artistList = Array.from(distinctArtists).slice(0, 6);

  if (artistList.length > 0) {
    const artHeader = document.createElement("h3");
    artHeader.className = "sub-header";
    artHeader.textContent = "🎤 Artists";
    dynamicContainer.appendChild(artHeader);

    const artGrid = document.createElement("div");
    artGrid.className = "card-grid";

    artistList.forEach(name => {
      const card = document.createElement("div");
      card.className = "song-card";
      card.innerHTML = `
        <div class="card-thumb circle-thumb">
          <img src="icon.png" alt="${name}" loading="lazy">
        </div>
        <div class="card-title" style="text-align: center;">${name}</div>
        <div class="card-meta-row" style="justify-content: center;">
          <span class="sugg-badge">Artist</span>
        </div>
      `;
      card.addEventListener("click", () => loadArtistPage(name));
      artGrid.appendChild(card);

      fetchArtistProfileImage(name).then(imgUrl => {
        const targetImg = card.querySelector("img");
        if (targetImg && imgUrl) {
          targetImg.src = imgUrl;
        }
      });
    });
    dynamicContainer.appendChild(artGrid);
  }

  // 2. Songs Section
  const songHeader = document.createElement("h3");
  songHeader.className = "sub-header";
  songHeader.textContent = "🎵 Songs";
  dynamicContainer.appendChild(songHeader);

  const sGrid = document.createElement("div");
  sGrid.className = "card-grid";
  renderSongGrid(songs, sGrid);
  dynamicContainer.appendChild(sGrid);

  // 3. Albums Section
  const albumMap = new Map();
  songs.forEach(song => {
    const albName = song.album?.name || song.album;
    if (albName && !albumMap.has(albName)) {
      albumMap.set(albName, { img: getHighResCover(song), year: song.year || "" });
    }
  });

  if (albumMap.size > 1) {
    const albHeader = document.createElement("h3");
    albHeader.className = "sub-header";
    albHeader.textContent = "💿 Albums";
    dynamicContainer.appendChild(albHeader);

    const albGrid = document.createElement("div");
    albGrid.className = "card-grid";
    Array.from(albumMap.entries()).slice(0, 6).forEach(([albName, data]) => {
      const card = document.createElement("div");
      card.className = "song-card";
      card.innerHTML = `
        <div class="card-thumb">
          <img src="${data.img}" alt="${albName}" loading="lazy">
          <div class="card-play-hover"><div class="hover-play-icon">▶</div></div>
        </div>
        <div class="card-title">${albName}</div>
        <div class="card-meta-row"><span class="card-year">${data.year || "Album"}</span></div>
      `;
      card.addEventListener("click", () => loadAlbumPage(albName));
      albGrid.appendChild(card);
    });
    dynamicContainer.appendChild(albGrid);
  }
}

// 8. Song Grid Renderer
function renderSongGrid(songs, targetContainer) {
  queue = [...songs];
  originalQueue = [...songs];

  songs.forEach((song, index) => {
    const card = document.createElement("div");
    card.className = "song-card";
    const cover = getHighResCover(song);
    const title = song.name || song.title || "Track";
    const artist = getArtistName(song);
    const year = song.year || "";

    card.innerHTML = `
      <div class="card-thumb">
        <img src="${cover}" alt="${title}" loading="lazy" onerror="this.src='icon.png'">
        <div class="card-play-hover"><div class="hover-play-icon">▶</div></div>
      </div>
      <div class="card-title">${title}</div>
      <div class="card-meta-row">
        <span class="card-artist">${artist}</span>
        <span class="card-year">${year}</span>
      </div>
    `;

    card.addEventListener("click", () => playTrack(index));
    targetContainer.appendChild(card);
  });
}

// 9. Dedicated Artist Page
async function loadArtistPage(artistName) {
  sectionTitle.textContent = `Artist: ${artistName}`;
  dynamicContainer.innerHTML = `<p class="status-msg">Loading artist profile & catalog...</p>`;

  const songs = await fetchSafeSongs(artistName);

  if (!songs || songs.length === 0) {
    dynamicContainer.innerHTML = `<p class="status-msg">No tracks found for this artist.</p>`;
    return;
  }

  dynamicContainer.innerHTML = "";

  // 15 Top Songs
  const sHeader = document.createElement("h3");
  sHeader.className = "sub-header";
  sHeader.textContent = "🔥 Top Songs";
  dynamicContainer.appendChild(sHeader);

  const sGrid = document.createElement("div");
  sGrid.className = "card-grid";
  renderSongGrid(songs.slice(0, 15), sGrid);
  dynamicContainer.appendChild(sGrid);

  // 10 Albums
  const albumMap = new Map();
  songs.forEach(song => {
    const albName = song.album?.name || song.album;
    if (albName && !albumMap.has(albName)) {
      albumMap.set(albName, { img: getHighResCover(song), year: song.year || "" });
    }
  });

  if (albumMap.size > 0) {
    const albHeader = document.createElement("h3");
    albHeader.className = "sub-header";
    albHeader.textContent = "💿 Albums";
    dynamicContainer.appendChild(albHeader);

    const albGrid = document.createElement("div");
    albGrid.className = "card-grid";
    Array.from(albumMap.entries()).slice(0, 10).forEach(([albName, data]) => {
      const card = document.createElement("div");
      card.className = "song-card";
      card.innerHTML = `
        <div class="card-thumb">
          <img src="${data.img}" alt="${albName}" loading="lazy">
          <div class="card-play-hover"><div class="hover-play-icon">▶</div></div>
        </div>
        <div class="card-title">${albName}</div>
        <div class="card-meta-row"><span class="card-year">${data.year || "Album"}</span></div>
      `;
      card.addEventListener("click", () => loadAlbumPage(albName));
      albGrid.appendChild(card);
    });
    dynamicContainer.appendChild(albGrid);
  }

  // 5 Playlists
  const presets = [
    { title: `Best of ${artistName}`, sub: "Essentials" },
    { title: `${artistName} Romantic Hits`, sub: "Love & Romance" },
    { title: `${artistName} Lo-Fi Mix`, sub: "Chill & Relax" },
    { title: `${artistName} Soulful Melodies`, sub: "Acoustic" },
    { title: `${artistName} Live in Concert`, sub: "Live Hits" }
  ];

  const plHeader = document.createElement("h3");
  plHeader.className = "sub-header";
  plHeader.textContent = "📑 Popular Playlists";
  dynamicContainer.appendChild(plHeader);

  const plGrid = document.createElement("div");
  plGrid.className = "card-grid";
  presets.forEach((item, idx) => {
    const cover = getHighResCover(songs[idx % songs.length] || {});
    const card = document.createElement("div");
    card.className = "song-card";
    card.innerHTML = `
      <div class="card-thumb">
        <img src="${cover}" alt="${item.title}" loading="lazy">
        <div class="card-play-hover"><div class="hover-play-icon">▶</div></div>
      </div>
      <div class="card-title">${item.title}</div>
      <div class="card-meta-row">
        <span class="card-artist">${item.sub}</span>
      </div>
    `;
    card.addEventListener("click", () => executeMasterSearch(item.title));
    plGrid.appendChild(card);
  });
  dynamicContainer.appendChild(plGrid);

  // 10 Similar Artists
  const simArtistsSet = new Set();
  const currentClean = artistName.toLowerCase().trim();

  songs.forEach(song => {
    const rawList = getArtistName(song).split(",").map(a => a.trim());
    rawList.forEach(a => {
      if (a && a.toLowerCase() !== currentClean && !simArtistsSet.has(a)) {
        simArtistsSet.add(a);
      }
    });
  });

  const fallbackArtists = [
    "Arijit Singh", "Sonu Nigam", "Shreya Ghoshal", "Atif Aslam", 
    "Armaan Malik", "Jubin Nautiyal", "Mohit Chauhan", "KK", 
    "Papon", "Sunidhi Chauhan", "Anupam Roy", "Sachin-Jigar"
  ];

  fallbackArtists.forEach(name => {
    if (name.toLowerCase() !== currentClean && !simArtistsSet.has(name)) {
      simArtistsSet.add(name);
    }
  });

  const simHeader = document.createElement("h3");
  simHeader.className = "sub-header";
  simHeader.textContent = "👥 Similar Artists";
  dynamicContainer.appendChild(simHeader);

  const simGrid = document.createElement("div");
  simGrid.className = "card-grid";
  const finalSimList = Array.from(simArtistsSet).slice(0, 10);

  finalSimList.forEach(name => {
    const card = document.createElement("div");
    card.className = "song-card";
    card.innerHTML = `
      <div class="card-thumb circle-thumb">
        <img src="icon.png" alt="${name}" loading="lazy">
      </div>
      <div class="card-title" style="text-align: center;">${name}</div>
      <div class="card-meta-row" style="justify-content: center;">
        <span class="sugg-badge">Artist</span>
      </div>
    `;
    card.addEventListener("click", () => loadArtistPage(name));
    simGrid.appendChild(card);

    fetchArtistProfileImage(name).then(imgUrl => {
      const targetImg = card.querySelector("img");
      if (targetImg && imgUrl) {
        targetImg.src = imgUrl;
      }
    });
  });
  dynamicContainer.appendChild(simGrid);
}

// 10. Dedicated Album Page
async function loadAlbumPage(albumName) {
  sectionTitle.textContent = `Album: ${albumName}`;
  dynamicContainer.innerHTML = `<p class="status-msg">Loading album tracks...</p>`;

  const songs = await fetchSafeSongs(albumName);

  dynamicContainer.innerHTML = "";

  if (!songs || songs.length === 0) {
    dynamicContainer.innerHTML = `<p class="status-msg">No tracks found for this album.</p>`;
    return;
  }

  const sHeader = document.createElement("h3");
  sHeader.className = "sub-header";
  sHeader.textContent = "🎵 Album Tracklist";
  dynamicContainer.appendChild(sHeader);

  const sGrid = document.createElement("div");
  sGrid.className = "card-grid";
  renderSongGrid(songs, sGrid);
  dynamicContainer.appendChild(sGrid);
}

// 11. Playback Engine
function updatePlayPauseUI(isPlaying) {
  const iconPath = isPlaying ? "icon/pause.png" : "icon/play.png";
  playPauseIcon.src = iconPath;
  fsPlayPauseIcon.src = iconPath;
  playPauseIcon.alt = isPlaying ? "Pause" : "Play";
  fsPlayPauseIcon.alt = isPlaying ? "Pause" : "Play";

  if (isPlaying) {
    soundWave.classList.add("active");
  } else {
    soundWave.classList.remove("active");
  }
}

function playTrack(index) {
  if (index < 0 || index >= queue.length) return;
  currentIndex = index;
  const song = queue[currentIndex];
  const streamUrl = get320kbpsMediaUrl(song);

  if (!streamUrl) return;

  audio.src = streamUrl;
  audio.play()
    .then(() => updatePlayPauseUI(true))
    .catch(e => {
      console.log("Stream interrupted:", e);
      updatePlayPauseUI(false);
    });

  const title = song.name || song.title || "Track";
  const artist = getArtistName(song);
  const cover = getHighResCover(song);

  applyDynamicColorGradient(cover);

  checkAndApplyMarquee(playerTitle, title);
  renderInteractiveArtists(playerArtist, artist);
  playerThumb.src = cover;

  checkAndApplyMarquee(fsTitle, title);
  renderInteractiveArtists(fsArtist, artist);
  fsThumb.src = cover;

  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title,
      artist: artist,
      album: song.album?.name || "YouTube Music Pro",
      artwork: [
        { src: cover, sizes: "96x96", type: "image/png" },
        { src: cover, sizes: "256x256", type: "image/png" },
        { src: cover, sizes: "512x512", type: "image/png" }
      ]
    });

    navigator.mediaSession.setActionHandler("play", togglePlayback);
    navigator.mediaSession.setActionHandler("pause", togglePlayback);
    navigator.mediaSession.setActionHandler("previoustrack", playPrevious);
    navigator.mediaSession.setActionHandler("nexttrack", playNext);
  }
}

// 12. Fullscreen Swipe Gesture
let touchStartX = 0;
let touchEndX = 0;

fsSwipeZone.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

fsSwipeZone.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipeGesture();
}, { passive: true });

function handleSwipeGesture() {
  const deltaX = touchEndX - touchStartX;
  if (Math.abs(deltaX) > 45) {
    if (deltaX < 0) {
      fsArtworkCard.style.transform = "translateX(-60px)";
      fsArtworkCard.style.opacity = "0.4";
      setTimeout(() => {
        playNext();
        fsArtworkCard.style.transform = "translateX(0)";
        fsArtworkCard.style.opacity = "1";
      }, 200);
    } else {
      fsArtworkCard.style.transform = "translateX(60px)";
      fsArtworkCard.style.opacity = "0.4";
      setTimeout(() => {
        playPrevious();
        fsArtworkCard.style.transform = "translateX(0)";
        fsArtworkCard.style.opacity = "1";
      }, 200);
    }
  }
}

// Controls
function togglePlayback() {
  if (!audio.src) return;
  if (audio.paused) {
    audio.play();
    updatePlayPauseUI(true);
  } else {
    audio.pause();
    updatePlayPauseUI(false);
  }
}

function playPrevious() {
  if (currentIndex > 0) playTrack(currentIndex - 1);
}

function playNext() {
  if (currentIndex < queue.length - 1) {
    playTrack(currentIndex + 1);
  } else if (repeatState === 1) {
    playTrack(0);
  }
}

playPauseBtn.addEventListener("click", togglePlayback);
fsPlayPauseBtn.addEventListener("click", togglePlayback);
prevBtn.addEventListener("click", playPrevious);
fsPrevBtn.addEventListener("click", playPrevious);
nextBtn.addEventListener("click", playNext);
fsNextBtn.addEventListener("click", playNext);

// Shuffle & Repeat
function toggleShuffle() {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
  fsShuffleBtn.classList.toggle("active", isShuffle);

  if (isShuffle) {
    queue.sort(() => Math.random() - 0.5);
  } else {
    queue = [...originalQueue];
  }
}
shuffleBtn.addEventListener("click", toggleShuffle);
fsShuffleBtn.addEventListener("click", toggleShuffle);

function toggleRepeat() {
  repeatState = (repeatState + 1) % 3;
  let iconSrc = "icon/repeatoff.png";
  let titleText = "Repeat Off";

  if (repeatState === 1) {
    iconSrc = "icon/repeaton.png";
    titleText = "Repeat All";
  } else if (repeatState === 2) {
    iconSrc = "icon/repeat1.png";
    titleText = "Repeat One";
  }

  repeatIcon.src = iconSrc;
  fsRepeatIcon.src = iconSrc;
  repeatBtn.title = titleText;
}
repeatBtn.addEventListener("click", toggleRepeat);
fsRepeatBtn.addEventListener("click", toggleRepeat);

function toggleLike() {
  const active = likeBtn.classList.toggle("active");
  fsLikeBtn.classList.toggle("active", active);
  likeBtn.textContent = active ? "❤️" : "♡";
  fsLikeBtn.textContent = active ? "❤️" : "♡";
}
likeBtn.addEventListener("click", toggleLike);
fsLikeBtn.addEventListener("click", toggleLike);

// Timeline
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  progressBar.value = percent;
  fsProgressBar.value = percent;
  miniProgressFill.style.width = `${percent}%`;

  const curr = formatTime(audio.currentTime);
  const dur = formatTime(audio.duration);
  currentTimeEl.textContent = curr;
  fsCurrentTime.textContent = curr;
  durationTimeEl.textContent = dur;
  fsDurationTime.textContent = dur;
});

progressBar.addEventListener("input", (e) => {
  if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
});
fsProgressBar.addEventListener("input", (e) => {
  if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
});

volumeBar.addEventListener("input", (e) => {
  audio.volume = e.target.value;
});

audio.addEventListener("ended", () => {
  if (repeatState === 2) {
    audio.currentTime = 0;
    audio.play();
  } else {
    playNext();
  }
});

// Fullscreen
openFullPlayerTrigger.addEventListener("click", (e) => {
  if (e.target.closest(".single-artist")) return;
  if (audio.src) fullscreenPlayer.classList.add("open");
});
expandDesktopBtn.addEventListener("click", () => {
  if (audio.src) fullscreenPlayer.classList.add("open");
});
closeFsPlayer.addEventListener("click", () => {
  fullscreenPlayer.classList.remove("open");
});

// Search Suggestions
let debounceTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const q = searchInput.value.trim();
  if (q.length < 2) {
    searchSuggestions.classList.remove("active");
    searchSuggestions.innerHTML = "";
    return;
  }

  debounceTimer = setTimeout(async () => {
    const songs = await fetchSafeSongs(q);

    if (songs && songs.length > 0) {
      searchSuggestions.innerHTML = "";
      songs.slice(0, 5).forEach(song => {
        const item = document.createElement("div");
        item.className = "sugg-item";
        item.innerHTML = `
          <img src="${getHighResCover(song)}" alt="">
          <div class="sugg-info">
            <div class="sugg-title">${song.name || song.title}</div>
            <div class="sugg-sub">${getArtistName(song)}</div>
          </div>
          <span class="sugg-badge">Song</span>
        `;
        item.addEventListener("click", () => {
          searchInput.value = song.name || song.title;
          searchSuggestions.classList.remove("active");
          executeMasterSearch(searchInput.value);
        });
        searchSuggestions.appendChild(item);
      });
      searchSuggestions.classList.add("active");
    }
  }, 250);
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-container")) {
    searchSuggestions.classList.remove("active");
  }
});

searchBtn.addEventListener("click", () => {
  searchSuggestions.classList.remove("active");
  executeMasterSearch(searchInput.value.trim());
});
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchSuggestions.classList.remove("active");
    executeMasterSearch(searchInput.value.trim());
  }
});

// Dynamic Category Rendering
function loadCategoryView(navKey) {
  chipsContainer.innerHTML = "";
  const list = CATEGORY_CHIPS[navKey] || CATEGORY_CHIPS.home;

  list.forEach((item, index) => {
    const btn = document.createElement("button");
    btn.className = `chip ${index === 0 ? "active" : ""}`;
    btn.dataset.label = item.label;
    btn.textContent = item.label;

    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      e.target.classList.add("active");
      const resolvedQuery = getFreshQuery(item.label, item.q);
      executeMasterSearch(resolvedQuery, item.label);
    });

    chipsContainer.appendChild(btn);
  });

  if (list.length > 0) {
    const resolvedInitial = getFreshQuery(list[0].label, list[0].q);
    executeMasterSearch(resolvedInitial, list[0].label);
  }
}

// Nav Buttons
document.querySelectorAll(".nav-btn, .b-nav-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const navKey = btn.dataset.nav;
    document.querySelectorAll(".nav-btn, .b-nav-btn").forEach(b => {
      if (b.dataset.nav === navKey) b.classList.add("active");
      else b.classList.remove("active");
    });

    loadCategoryView(navKey);
  });
});

// Sidebar Quick Links
document.querySelectorAll(".ql-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    executeMasterSearch(e.target.dataset.filter);
  });
});

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Initial Boot
window.addEventListener("DOMContentLoaded", () => {
  loadCategoryView("home");
});
