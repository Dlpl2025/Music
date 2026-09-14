const API_BASE = "https://jiosaavn-api-codyandersan.vercel.app";

// DOM References
const audio = document.getElementById("audioElement");
const playPauseBtn = document.getElementById("playPauseBtn");
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

const playerTitle = document.getElementById("playerTitle");
const playerArtist = document.getElementById("playerArtist");
const playerThumb = document.getElementById("playerThumb");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
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
const fsPrevBtn = document.getElementById("fsPrevBtn");
const fsNextBtn = document.getElementById("fsNextBtn");
const fsShuffleBtn = document.getElementById("fsShuffleBtn");
const fsRepeatBtn = document.getElementById("fsRepeatBtn");
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
let isRepeat = false;
let userTasteHistory = JSON.parse(localStorage.getItem("yt_taste_history") || "[]");

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

// 2. Dynamic Ambient Gradient Extractor
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

// 3. Horizontal Marquee RTL Animation Check
function checkAndApplyMarquee(element, text) {
  element.textContent = text;
  element.classList.remove("marquee-active");
  void element.offsetWidth;
  if (element.scrollWidth > element.clientWidth + 6) {
    element.classList.add("marquee-active");
  }
}

// 4. Guaranteed Single Reliable API Fetch Engine
async function fetchSafeSongs(query) {
  const cleanQ = query.trim();
  const endpoints = [
    `${API_BASE}/api/search/songs?query=${encodeURIComponent(cleanQ)}`,
    `${API_BASE}/search/songs?query=${encodeURIComponent(cleanQ)}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        let list = [];
        if (data?.data?.results) list = data.data.results;
        else if (Array.isArray(data?.data)) list = data.data;
        else if (Array.isArray(data?.results)) list = data.results;

        if (list.length > 0) return list;
      }
    } catch (_) {}
  }

  // Fallback: Simplify search terms if no results
  if (cleanQ.includes(" ")) {
    const simplified = cleanQ.split(" ").slice(0, 2).join(" ");
    try {
      const res = await fetch(`${API_BASE}/api/search/songs?query=${encodeURIComponent(simplified)}`);
      if (res.ok) {
        const data = await res.json();
        return data?.data?.results || data?.results || [];
      }
    } catch (_) {}
  }

  return [];
}

// 5. Intelligent Multi-Section Display (Songs, Artists, Albums)
async function executeMasterSearch(query) {
  if (!query) return;
  sectionTitle.textContent = `Results for "${query}"`;
  dynamicContainer.innerHTML = `<p class="status-msg">Searching across music catalog...</p>`;

  const songs = await fetchSafeSongs(query);

  if (!songs || songs.length === 0) {
    dynamicContainer.innerHTML = `<p class="status-msg">No music found for "${query}". Try another term.</p>`;
    return;
  }

  dynamicContainer.innerHTML = "";

  // Extract Distinct Artists
  const artistMap = new Map();
  songs.forEach(song => {
    const artist = getArtistName(song).split(",")[0].trim();
    if (artist && !artistMap.has(artist)) {
      artistMap.set(artist, getHighResCover(song));
    }
  });

  if (artistMap.size > 0) {
    const artHeader = document.createElement("h3");
    artHeader.className = "sub-header";
    artHeader.textContent = "🎤 Artists";
    dynamicContainer.appendChild(artHeader);

    const artGrid = document.createElement("div");
    artGrid.className = "card-grid";
    Array.from(artistMap.entries()).slice(0, 6).forEach(([name, img]) => {
      const card = document.createElement("div");
      card.className = "song-card";
      card.innerHTML = `
        <div class="card-thumb circle-thumb">
          <img src="${img}" alt="${name}" loading="lazy">
        </div>
        <div class="card-title" style="text-align: center;">${name}</div>
        <div class="card-meta-row" style="justify-content: center;">
          <span class="sugg-badge">Artist</span>
        </div>
      `;
      card.addEventListener("click", () => loadArtistPage(name));
      artGrid.appendChild(card);
    });
    dynamicContainer.appendChild(artGrid);
  }

  // Render Songs Grid
  const songHeader = document.createElement("h3");
  songHeader.className = "sub-header";
  songHeader.textContent = "🎵 Songs";
  dynamicContainer.appendChild(songHeader);

  const sGrid = document.createElement("div");
  sGrid.className = "card-grid";
  renderSongGrid(songs, sGrid);
  dynamicContainer.appendChild(sGrid);

  // Extract Distinct Albums
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

// 6. Song Grid Renderer
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

// 7. Dedicated Artist Page
async function loadArtistPage(artistName) {
  sectionTitle.textContent = `Artist: ${artistName}`;
  dynamicContainer.innerHTML = `<p class="status-msg">Loading artist profile & catalog...</p>`;

  const songs = await fetchSafeSongs(artistName);

  if (!songs || songs.length === 0) {
    dynamicContainer.innerHTML = `<p class="status-msg">No tracks found for this artist.</p>`;
    return;
  }

  dynamicContainer.innerHTML = "";

  // Top 15 Songs
  const sHeader = document.createElement("h3");
  sHeader.className = "sub-header";
  sHeader.textContent = "🔥 Top Songs";
  dynamicContainer.appendChild(sHeader);

  const sGrid = document.createElement("div");
  sGrid.className = "card-grid";
  renderSongGrid(songs.slice(0, 15), sGrid);
  dynamicContainer.appendChild(sGrid);

  // Top Albums
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
}

// 8. Dedicated Album Page
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

// 9. Adaptive Taste Tracker
function recordUserTaste(song) {
  const artist = getArtistName(song);
  const lang = song.language || "";
  userTasteHistory.unshift({ artist, lang });
  if (userTasteHistory.length > 25) userTasteHistory.pop();
  localStorage.setItem("yt_taste_history", JSON.stringify(userTasteHistory));
}

function getDominantTasteQuery() {
  if (userTasteHistory.length === 0) return "Arijit Singh";
  const counts = {};
  userTasteHistory.forEach(item => {
    const key = item.lang ? `${item.lang} Hits` : item.artist.split(",")[0];
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
}

// 10. Playback & 320kbps Stream
function playTrack(index) {
  if (index < 0 || index >= queue.length) return;
  currentIndex = index;
  const song = queue[currentIndex];
  const streamUrl = get320kbpsMediaUrl(song);

  if (!streamUrl) return;

  audio.src = streamUrl;
  audio.play().catch(e => console.log("Stream interrupted:", e));

  const title = song.name || song.title || "Track";
  const artist = getArtistName(song);
  const cover = getHighResCover(song);

  recordUserTaste(song);
  applyDynamicColorGradient(cover);

  // Marquee RTL update
  checkAndApplyMarquee(playerTitle, title);
  checkAndApplyMarquee(playerArtist, artist);
  playerThumb.src = cover;
  playPauseBtn.textContent = "⏸";
  soundWave.classList.add("active");

  checkAndApplyMarquee(fsTitle, title);
  checkAndApplyMarquee(fsArtist, artist);
  fsThumb.src = cover;
  fsPlayPauseBtn.textContent = "⏸";

  // Lockscreen Player Notification
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

// 11. Fullscreen Swipe Gesture
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

// Playback Logic
function togglePlayback() {
  if (!audio.src) return;
  if (audio.paused) {
    audio.play();
    playPauseBtn.textContent = "⏸";
    fsPlayPauseBtn.textContent = "⏸";
    soundWave.classList.add("active");
  } else {
    audio.pause();
    playPauseBtn.textContent = "▶";
    fsPlayPauseBtn.textContent = "▶";
    soundWave.classList.remove("active");
  }
}

function playPrevious() {
  if (currentIndex > 0) playTrack(currentIndex - 1);
}

function playNext() {
  if (currentIndex < queue.length - 1) {
    playTrack(currentIndex + 1);
  } else if (isRepeat) {
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
  isRepeat = !isRepeat;
  repeatBtn.classList.toggle("active", isRepeat);
  fsRepeatBtn.classList.toggle("active", isRepeat);
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

// Progress Timeline
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
  if (isRepeat) {
    audio.currentTime = 0;
    audio.play();
  } else {
    playNext();
  }
});

// Fullscreen Triggers
openFullPlayerTrigger.addEventListener("click", (e) => {
  if (e.target.classList.contains("clickable-artist")) return;
  if (audio.src) fullscreenPlayer.classList.add("open");
});
expandDesktopBtn.addEventListener("click", () => {
  if (audio.src) fullscreenPlayer.classList.add("open");
});
closeFsPlayer.addEventListener("click", () => {
  fullscreenPlayer.classList.remove("open");
});

// Artist Clickable Redirect
function handleArtistClick(e) {
  e.stopPropagation();
  const rawArtist = e.target.textContent;
  if (rawArtist && rawArtist !== "-") {
    const primary = rawArtist.split(",")[0].trim();
    loadArtistPage(primary);
    fullscreenPlayer.classList.remove("open");
  }
}
playerArtist.addEventListener("click", handleArtistClick);
fsArtist.addEventListener("click", handleArtistClick);

// 12. Instant Typeahead Search Suggestions
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

// Search Actions
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

// Category Chips
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", (e) => {
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    e.target.classList.add("active");
    executeMasterSearch(e.target.dataset.q);
  });
});

// Sidebar Quick Links
document.querySelectorAll(".ql-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    executeMasterSearch(e.target.dataset.filter);
  });
});

// Navigation Bar
const navCategories = {
  home: "Arijit Singh",
  explore: "Top Bollywood Hits",
  moodmix: "Chill Lo-Fi",
  languages: "Bengali Hits"
};

document.querySelectorAll(".nav-btn, .b-nav-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const navKey = btn.dataset.nav;
    document.querySelectorAll(".nav-btn, .b-nav-btn").forEach(b => {
      if (b.dataset.nav === navKey) b.classList.add("active");
      else b.classList.remove("active");
    });

    if (navKey === "home") executeMasterSearch("Arijit Singh");
    else if (navKey === "explore") executeMasterSearch("Top Bollywood Hits");
    else if (navKey === "moodmix") executeMasterSearch("Chill Lo-Fi");
    else if (navKey === "languages") executeMasterSearch(getDominantTasteQuery());
  });
});

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Initial Boot
window.addEventListener("DOMContentLoaded", () => {
  executeMasterSearch("Arijit Singh");
});