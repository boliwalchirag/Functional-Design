import { useState, useEffect, useRef, useCallback } from "react";

interface JamendoTrack {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  url: string;
  duration: number;
}

const FALLBACK_TRACKS: JamendoTrack[] = [
  {
    id: "f1",
    title: "Midnight Coffee",
    artist: "Lofi Study",
    albumArt: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=500&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 372,
  },
  {
    id: "f2",
    title: "Rainy Window",
    artist: "Chill Beats",
    albumArt: "https://images.unsplash.com/photo-1514525253344-f814d074358a?q=80&w=500&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 425,
  },
  {
    id: "f3",
    title: "Sunset Drive",
    artist: "Vaporwave",
    albumArt: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=500&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: 345,
  },
];

const FALLBACK_QUOTE = { text: "Focus is not about saying yes, it's about saying no to a thousand things.", author: "Steve Jobs" };

const PRESETS = [
  { label: "25/5", work: 25, rest: 5 },
  { label: "50/10", work: 50, rest: 10 },
  { label: "90/15", work: 90, rest: 15 },
  { label: "45m", work: 45, rest: 10, starred: true },
];

interface Task {
  id: string;
  text: string;
  done: boolean;
}

const INITIAL_TASKS: Task[] = [
  { id: "1", text: "Research Lofi visual aesthetic trends", done: true },
  { id: "2", text: "Develop Pomodoro SVG logic", done: false },
  { id: "3", text: "Review Bento Grid implementation", done: false },
  { id: "4", text: "Write focus session recap", done: false },
  { id: "5", text: "Explore ambient soundscapes", done: true },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export default function VibeCraft() {
  const [activeNav, setActiveNav] = useState("Focus");
  const [themeForest, setThemeForest] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<JamendoTrack[]>(FALLBACK_TRACKS);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrent, setAudioCurrent] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const [timerMode, setTimerMode] = useState<"work" | "break">("work");
  const [timerPreset, setTimerPreset] = useState(PRESETS[0]);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(4);
  const [focusMinutesToday, setFocusMinutesToday] = useState(100);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [newTask, setNewTask] = useState("");

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customPresets, setCustomPresets] = useState<Array<{ label: string; work: number; rest: number; custom: boolean }>>([]);
  const [customWork, setCustomWork] = useState("30");
  const [customBreak, setCustomBreak] = useState("5");

  const [quote, setQuote] = useState(FALLBACK_QUOTE);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const fetchQuote = useCallback(async () => {
    setQuoteLoading(true);
    try {
      const res = await fetch("https://dummyjson.com/quotes/random");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setQuote({ text: data.quote, author: data.author });
    } catch {
      setQuote(FALLBACK_QUOTE);
    } finally {
      setQuoteLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuote(); }, [fetchQuote]);

  const fetchTracks = useCallback(async () => {
    setTracksLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(
        "https://api.jamendo.com/v3.0/tracks/?client_id=56d30c95&format=json&limit=10&tags=lofi&order=popularity_week",
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.results?.length > 0) {
        setTracks(
          data.results.map((t: { id: string; name: string; artist_name: string; image?: string; audio: string; duration: number }) => ({
            id: t.id,
            title: t.name,
            artist: t.artist_name,
            albumArt: t.image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop",
            url: t.audio,
            duration: t.duration,
          }))
        );
        setTrackIdx(0);
        setAudioCurrent(0);
        setAudioDuration(0);
      }
    } catch {
      // fallback already in state
    } finally {
      setTracksLoading(false);
    }
  }, []);

  useEffect(() => { fetchTracks(); }, [fetchTracks]);

  const track = tracks[trackIdx] || FALLBACK_TRACKS[0];
  const progressPct = audioDuration > 0 ? (audioCurrent / audioDuration) * 100 : 0;

  useEffect(() => {
    if (themeForest) {
      document.body.classList.add("theme-forest");
    } else {
      document.body.classList.remove("theme-forest");
    }
  }, [themeForest]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current!);
            setTimerRunning(false);
            if (timerMode === "work") {
              setSessionsToday((n) => n + 1);
              setFocusMinutesToday((m) => m + timerPreset.work);
              setTimerMode("break");
              return timerPreset.rest * 60;
            } else {
              setTimerMode("work");
              return timerPreset.work * 60;
            }
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning, timerMode, timerPreset]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, [isPlaying]);

  const handleNextTrack = useCallback(() => {
    const nextIdx = shuffle
      ? Math.floor(Math.random() * tracks.length)
      : (trackIdx + 1) % tracks.length;
    setTrackIdx(nextIdx);
    setAudioCurrent(0);
    setAudioDuration(0);
    if (isPlaying) setTimeout(() => audioRef.current?.play().catch(() => {}), 100);
  }, [shuffle, trackIdx, tracks.length, isPlaying]);

  const handlePrevTrack = useCallback(() => {
    if (audioCurrent > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      return;
    }
    const prevIdx = (trackIdx - 1 + tracks.length) % tracks.length;
    setTrackIdx(prevIdx);
    setAudioCurrent(0);
    setAudioDuration(0);
    if (isPlaying) setTimeout(() => audioRef.current?.play().catch(() => {}), 100);
  }, [audioCurrent, trackIdx, tracks.length, isPlaying]);

  const handleTimerReset = () => {
    setTimerRunning(false);
    setTimerSeconds(timerPreset.work * 60);
    setTimerMode("work");
  };

  const handlePresetChange = (preset: typeof PRESETS[0]) => {
    setTimerPreset(preset);
    setTimerRunning(false);
    setTimerSeconds(preset.work * 60);
    setTimerMode("work");
  };

  const handleToggleTask = (id: string) => {
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks((ts) => ts.filter((t) => t.id !== id));
  };

  const handleAddCustomPreset = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Math.min(240, Math.max(1, parseInt(customWork) || 1));
    const b = Math.min(60, Math.max(1, parseInt(customBreak) || 1));
    const label = `${w}/${b}`;
    const preset = { label, work: w, rest: b, custom: true };
    setCustomPresets((prev) => [...prev, preset]);
    handlePresetChange(preset);
    setShowCustomForm(false);
    setCustomWork("30");
    setCustomBreak("5");
  };

  const handleDeleteCustomPreset = (label: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.label !== label));
    if (timerPreset.label === label) handlePresetChange(PRESETS[0]);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks((ts) => [...ts, { id: Date.now().toString(), text: newTask.trim(), done: false }]);
    setNewTask("");
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
      if (e.shiftKey && e.key === "R") {
        handleTimerReset();
      }
      if (e.altKey && e.key === "t") {
        setThemeForest((f) => !f);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [togglePlay]);

  const timerTotal = timerMode === "work" ? timerPreset.work * 60 : timerPreset.rest * 60;
  const timerPct = 1 - timerSeconds / timerTotal;
  const circumference = 2 * Math.PI * 100;
  const dashOffset = circumference * (1 - timerPct);

  const completedTasks = tasks.filter((t) => t.done).length;

  const navItems = ["Focus", "Music", "Tasks", "Stats"];

  return (
    <div style={{ backgroundColor: "var(--background)", color: "var(--on-surface)", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{
        position: "fixed", top: 0, width: "100%", zIndex: 50,
        backgroundColor: "rgba(14,14,14,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem", maxWidth: 1440, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="font-headline" style={{ fontSize: 24, fontWeight: 900, color: "#957DAD", letterSpacing: "-0.05em" }}>VibeCraft</span>
          </div>
          <nav style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => setActiveNav(item)}
                className="font-headline"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em",
                  color: activeNav === item ? "#957DAD" : "#6b7280",
                  borderBottom: activeNav === item ? "2px solid #957DAD" : "2px solid transparent",
                  paddingBottom: 4, transition: "color 0.2s"
                }}
              >
                {item}
              </button>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setThemeForest((f) => !f)}
              title="Switch Theme (Alt+T)"
              style={{ padding: 8, background: "none", border: "none", cursor: "pointer", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <Icon name={themeForest ? "forest" : "brightness_6"} className="" style={{ color: "#957DAD", fontSize: 22 } as React.CSSProperties} />
            </button>
            <button
              style={{ padding: 8, background: "none", border: "none", cursor: "pointer", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <Icon name="palette" style={{ color: "#957DAD", fontSize: 22 } as React.CSSProperties} />
            </button>
            <button
              style={{ padding: 8, background: "none", border: "none", cursor: "pointer", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <Icon name="settings" style={{ color: "#957DAD", fontSize: 22 } as React.CSSProperties} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ paddingTop: 96, paddingBottom: 48, paddingLeft: 24, paddingRight: 24, maxWidth: 1440, margin: "0 auto" }}>
        <div className="bento-grid">

          {/* Music Player Module */}
          <section style={{
            gridColumn: "span 12",
            backgroundColor: "var(--surface-container)",
            borderRadius: 24, overflow: "hidden", position: "relative"
          }}
            className="music-player-section"
          >
            <style>{`@media(min-width:1024px){.music-player-section{grid-column:span 8!important}}`}</style>

            {/* Hidden Audio Element */}
            <audio
              ref={audioRef}
              src={track.url}
              onTimeUpdate={() => {
                if (audioRef.current) setAudioCurrent(audioRef.current.currentTime);
              }}
              onDurationChange={() => {
                if (audioRef.current) setAudioDuration(audioRef.current.duration);
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => {
                if (repeat) {
                  audioRef.current?.play().catch(() => {});
                } else {
                  handleNextTrack();
                }
              }}
            />

            {/* Ambient gradient */}
            <div style={{
              position: "absolute", inset: 0, zIndex: 0,
              background: "radial-gradient(ellipse at top left, rgba(83,62,105,0.4) 0%, rgba(216,146,39,0.1) 100%)",
              filter: "blur(40px)", transform: "scale(1.1)", opacity: 0.5
            }} />
            <div style={{ position: "relative", zIndex: 1, padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }} className="music-inner">
              <style>{`@media(min-width:768px){.music-inner{flex-direction:row!important}}`}</style>

              {/* Album Art */}
              <div style={{ width: 240, height: 240, borderRadius: 16, overflow: "hidden", flexShrink: 0, boxShadow: "0 25px 50px rgba(0,0,0,0.5)", position: "relative" }} className="album-art">
                <style>{`@media(min-width:768px){.album-art{width:256px!important;height:256px!important}}`}</style>
                <img
                  key={track.id}
                  src={track.albumArt}
                  alt={track.title}
                  referrerPolicy="no-referrer"
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.3s" }}
                />
                <div
                  onClick={togglePlay}
                  style={{
                    position: "absolute", inset: 0,
                    background: "rgba(0,0,0,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: 0, transition: "opacity 0.2s", cursor: "pointer"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                >
                  <Icon name={isPlaying ? "pause_circle" : "play_circle"} style={{ fontSize: 64, color: "white" } as React.CSSProperties} />
                </div>
              </div>

              {/* Player Controls */}
              <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: 8, paddingBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ maxWidth: "85%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{
                        background: "rgba(226,199,252,0.1)", color: "#e2c7fc",
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.15em",
                        textTransform: "uppercase", padding: "4px 8px", borderRadius: 8
                      }}>Now Playing</span>
                      <span style={{ color: "var(--on-surface-variant)", fontSize: 12, fontWeight: 500 }}>{track.artist}</span>
                    </div>
                    <h2 className="font-headline" style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</h2>
                    <p style={{ color: "var(--on-surface-variant)", fontWeight: 500, fontSize: 13 }}>Jamendo Radio · lofi &amp; focus</p>
                  </div>
                  <button
                    onClick={fetchTracks}
                    disabled={tracksLoading}
                    title="Fetch new tracks from Jamendo"
                    style={{
                      background: "none", border: "none", cursor: tracksLoading ? "default" : "pointer",
                      color: "var(--on-surface-variant)", padding: 8, borderRadius: "50%",
                      display: "flex", alignItems: "center", transition: "color 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--primary)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--on-surface-variant)")}
                  >
                    <Icon
                      name="refresh"
                      style={{ fontSize: 22, animation: tracksLoading ? "spin 1s linear infinite" : "none" } as React.CSSProperties}
                    />
                  </button>
                </div>
                <div style={{ marginTop: 32 }}>
                  {/* Progress Bar */}
                  <div
                    style={{ width: "100%", height: 6, backgroundColor: "var(--surface-container-highest)", borderRadius: 999, overflow: "hidden", cursor: "pointer" }}
                    onClick={(e) => {
                      if (!audioRef.current || !audioDuration) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = (e.clientX - rect.left) / rect.width;
                      audioRef.current.currentTime = pct * audioDuration;
                    }}
                  >
                    <div style={{ height: "100%", width: `${progressPct}%`, backgroundColor: "var(--primary)", borderRadius: 999, transition: "width 0.5s linear" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "monospace", color: "var(--on-surface-variant)", marginTop: 4 }}>
                    <span>{formatTime(Math.floor(audioCurrent))}</span>
                    <span>{formatTime(Math.floor(audioDuration || track.duration))}</span>
                  </div>

                  {/* Controls Row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                      <button
                        onClick={() => setShuffle((s) => !s)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: shuffle ? "var(--primary)" : "var(--on-surface-variant)", transition: "color 0.2s" }}
                      >
                        <Icon name="shuffle" style={{ fontSize: 22 } as React.CSSProperties} />
                      </button>
                      <button onClick={handlePrevTrack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--on-surface)", fontSize: 22 }}>
                        <Icon name="skip_previous" style={{ fontSize: 28 } as React.CSSProperties} />
                      </button>
                      <button
                        onClick={togglePlay}
                        style={{
                          width: 56, height: 56, backgroundColor: "var(--primary)", color: "var(--on-primary)",
                          borderRadius: "50%", border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 8px 24px rgba(254,178,70,0.3)", transition: "transform 0.1s"
                        }}
                        onMouseDown={e => (e.currentTarget.style.transform = "scale(0.9)")}
                        onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <Icon name={isPlaying ? "pause" : "play_arrow"} style={{ fontSize: 28, fontVariationSettings: "'FILL' 1, 'wght' 400" } as React.CSSProperties} />
                      </button>
                      <button onClick={handleNextTrack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--on-surface)", fontSize: 22 }}>
                        <Icon name="skip_next" style={{ fontSize: 28 } as React.CSSProperties} />
                      </button>
                      <button
                        onClick={() => setRepeat((r) => !r)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: repeat ? "var(--primary)" : "var(--on-surface-variant)", transition: "color 0.2s" }}
                      >
                        <Icon name="repeat" style={{ fontSize: 22 } as React.CSSProperties} />
                      </button>
                    </div>

                    {/* Volume */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon name="volume_up" style={{ color: "var(--on-surface-variant)", fontSize: 20 } as React.CSSProperties} />
                      <div
                        style={{ width: 96, height: 4, backgroundColor: "var(--surface-container-highest)", borderRadius: 999, cursor: "pointer", position: "relative" }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setVolume(Math.round(((e.clientX - rect.left) / rect.width) * 100));
                        }}
                      >
                        <div style={{ height: "100%", width: `${volume}%`, backgroundColor: "var(--on-surface-variant)", borderRadius: 999 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pomodoro Timer */}
          <section style={{
            gridColumn: "span 12",
            backgroundColor: "var(--surface-container)",
            borderRadius: 24, padding: 32,
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", textAlign: "center", position: "relative", overflow: "hidden"
          }} className="pomodoro-section">
            <style>{`@media(min-width:1024px){.pomodoro-section{grid-column:span 4!important}}`}</style>
            <div style={{ position: "absolute", top: -48, right: -48, width: 128, height: 128, backgroundColor: "rgba(255,148,162,0.1)", borderRadius: "50%", filter: "blur(40px)" }} />

            <div style={{ marginBottom: 16 }}>
              <span style={{
                padding: "6px 16px", borderRadius: 999,
                backgroundColor: timerMode === "work" ? "rgba(253,126,145,0.2)" : "rgba(254,178,70,0.2)",
                color: timerMode === "work" ? "var(--tertiary)" : "var(--primary)",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase"
              }}>
                {timerMode === "work" ? "Focus State" : "Break Time"}
              </span>
            </div>

            {/* SVG Ring */}
            <div style={{ position: "relative", width: 224, height: 224, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="112" cy="112" r="100" fill="transparent" stroke="var(--surface-container-highest)" strokeWidth="8" />
                <circle
                  cx="112" cy="112" r="100" fill="transparent"
                  stroke={timerMode === "work" ? "var(--tertiary)" : "var(--primary)"}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.5s linear" }}
                />
              </svg>
              <span className="font-headline" style={{ fontSize: 56, fontWeight: 900, position: "relative", zIndex: 1 }}>
                {formatTime(timerSeconds)}
              </span>
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 32 }}>
              <button
                onClick={handleTimerReset}
                title="Reset (Shift+R)"
                style={{
                  backgroundColor: "var(--surface-container-highest)", border: "none", cursor: "pointer",
                  padding: "12px 24px", borderRadius: 999, fontWeight: 700,
                  color: "var(--on-surface)", display: "flex", alignItems: "center", gap: 8, transition: "background 0.2s"
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--surface-bright)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--surface-container-highest)")}
              >
                <Icon name="refresh" style={{ fontSize: 20 } as React.CSSProperties} />
              </button>
              <button
                onClick={() => setTimerRunning((r) => !r)}
                style={{
                  backgroundColor: timerMode === "work" ? "var(--tertiary)" : "var(--primary)",
                  color: timerMode === "work" ? "var(--on-tertiary)" : "var(--on-primary)",
                  border: "none", cursor: "pointer",
                  padding: "12px 40px", borderRadius: 999, fontWeight: 900, fontSize: 18,
                  boxShadow: timerMode === "work" ? "0 8px 24px rgba(255,148,162,0.2)" : "0 8px 24px rgba(254,178,70,0.2)",
                  transition: "transform 0.1s"
                }}
              >
                {timerRunning ? "Pause" : "Start"}
              </button>
            </div>

            {/* Presets */}
            <div style={{ width: "100%", marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "0 8px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--on-surface-variant)", opacity: 0.6 }}>Presets</span>
                <button
                  onClick={() => setShowCustomForm((v) => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: showCustomForm ? "var(--on-surface-variant)" : "var(--primary)", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s" }}
                >
                  <Icon name={showCustomForm ? "close" : "add_circle"} style={{ fontSize: 14 } as React.CSSProperties} />
                  {showCustomForm ? "Cancel" : "Add Custom"}
                </button>
              </div>

              {/* Custom preset form */}
              {showCustomForm && (
                <form
                  onSubmit={handleAddCustomPreset}
                  style={{
                    width: "100%", display: "flex", flexDirection: "column", gap: 10,
                    backgroundColor: "var(--surface-container-highest)",
                    borderRadius: 16, padding: "14px 16px",
                    border: "1px solid rgba(254,178,70,0.2)"
                  }}
                >
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--on-surface-variant)" }}>
                        Work (min)
                      </label>
                      <input
                        type="number"
                        min={1} max={240}
                        value={customWork}
                        onChange={(e) => setCustomWork(e.target.value)}
                        style={{
                          width: "100%", backgroundColor: "var(--surface-container)",
                          border: "1px solid var(--outline-variant)", borderRadius: 10,
                          padding: "8px 10px", color: "var(--on-surface)",
                          fontSize: 14, fontWeight: 700, textAlign: "center", outline: "none"
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                        onBlur={e => (e.currentTarget.style.borderColor = "var(--outline-variant)")}
                      />
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--on-surface-variant)" }}>
                        Break (min)
                      </label>
                      <input
                        type="number"
                        min={1} max={60}
                        value={customBreak}
                        onChange={(e) => setCustomBreak(e.target.value)}
                        style={{
                          width: "100%", backgroundColor: "var(--surface-container)",
                          border: "1px solid var(--outline-variant)", borderRadius: 10,
                          padding: "8px 10px", color: "var(--on-surface)",
                          fontSize: 14, fontWeight: 700, textAlign: "center", outline: "none"
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                        onBlur={e => (e.currentTarget.style.borderColor = "var(--outline-variant)")}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: "var(--primary)", color: "var(--on-primary)",
                      border: "none", cursor: "pointer",
                      padding: "8px 0", borderRadius: 10,
                      fontWeight: 800, fontSize: 13, letterSpacing: "0.05em",
                      transition: "opacity 0.2s"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    Save Preset
                  </button>
                </form>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetChange(preset)}
                    style={{
                      padding: "6px 12px", borderRadius: 999,
                      backgroundColor: timerPreset.label === preset.label ? "rgba(254,178,70,0.1)" : "var(--surface-container-highest)",
                      border: timerPreset.label === preset.label ? "1px solid rgba(254,178,70,0.3)" : "1px solid rgba(72,72,71,0.3)",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                      color: timerPreset.label === preset.label ? "var(--primary)" : "var(--on-surface)",
                      display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s"
                    }}
                  >
                    {preset.starred && <Icon name="star" style={{ fontSize: 12 } as React.CSSProperties} />}
                    {preset.label}
                  </button>
                ))}
                {customPresets.map((preset) => (
                  <div key={preset.label} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                    <button
                      onClick={() => handlePresetChange(preset)}
                      style={{
                        padding: "6px 10px 6px 12px", borderRadius: "999px 0 0 999px",
                        backgroundColor: timerPreset.label === preset.label ? "rgba(226,199,252,0.15)" : "var(--surface-container-highest)",
                        border: timerPreset.label === preset.label ? "1px solid rgba(226,199,252,0.3)" : "1px solid rgba(72,72,71,0.3)",
                        borderRight: "none",
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                        color: timerPreset.label === preset.label ? "#e2c7fc" : "var(--on-surface)",
                        transition: "all 0.2s"
                      }}
                    >
                      {preset.label}
                    </button>
                    <button
                      onClick={() => handleDeleteCustomPreset(preset.label)}
                      title="Remove preset"
                      style={{
                        padding: "6px 8px", borderRadius: "0 999px 999px 0",
                        backgroundColor: timerPreset.label === preset.label ? "rgba(226,199,252,0.15)" : "var(--surface-container-highest)",
                        border: timerPreset.label === preset.label ? "1px solid rgba(226,199,252,0.3)" : "1px solid rgba(72,72,71,0.3)",
                        borderLeft: "1px solid rgba(72,72,71,0.15)",
                        fontSize: 12, cursor: "pointer", color: "var(--on-surface-variant)",
                        display: "flex", alignItems: "center", transition: "all 0.2s"
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--destructive)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--on-surface-variant)")}
                    >
                      <Icon name="close" style={{ fontSize: 12 } as React.CSSProperties} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Stats */}
            <div style={{ display: "flex", gap: 24, marginTop: 20, color: "var(--on-surface-variant)", fontSize: 14, fontWeight: 500 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ color: "var(--on-surface)", fontWeight: 700, fontSize: 18 }}>{String(sessionsToday).padStart(2, "0")}</span>
                <span>Sessions</span>
              </div>
              <div style={{ width: 1, height: 32, backgroundColor: "var(--outline-variant)" }} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ color: "var(--on-surface)", fontWeight: 700, fontSize: 18 }}>{Math.floor(focusMinutesToday / 60)}h {focusMinutesToday % 60}m</span>
                <span>Today</span>
              </div>
            </div>
          </section>

          {/* Shortcuts Panel */}
          <section style={{
            gridColumn: "span 12",
            backgroundColor: "var(--surface-container-low)",
            borderRadius: 24, padding: 24,
            border: "1px solid rgba(255,255,255,0.05)"
          }} className="shortcuts-section">
            <style>{`@media(min-width:768px){.shortcuts-section{grid-column:span 4!important}}`}</style>
            <h3 className="font-headline" style={{ fontWeight: 700, fontSize: 18, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="keyboard" style={{ color: "var(--primary)" } as React.CSSProperties} />
              Shortcuts
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { action: "Play / Pause", key: "Space" },
                { action: "Reset Timer", key: "Shift + R" },
                { action: "New Task", key: "Ctrl + N" },
                { action: "Switch Theme", key: "Alt + T" },
              ].map(({ action, key }) => (
                <div key={action} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                  <span style={{ color: "var(--on-surface-variant)" }}>{action}</span>
                  <kbd style={{
                    padding: "4px 8px", backgroundColor: "var(--surface-container-highest)",
                    borderRadius: 8, border: "1px solid var(--outline-variant)",
                    fontSize: 10, fontFamily: "monospace", color: "var(--on-surface)"
                  }}>{key}</kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Task Management */}
          <section style={{
            gridColumn: "span 12",
            backgroundColor: "var(--surface-container)",
            borderRadius: 24, padding: 32
          }} className="tasks-section">
            <style>{`@media(min-width:768px){.tasks-section{grid-column:span 8!important}}`}</style>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
              <div>
                <h3 className="font-headline" style={{ fontWeight: 900, fontSize: 24 }}>Focus Quests</h3>
                <p style={{ color: "var(--on-surface-variant)", fontSize: 14, marginTop: 4 }}>
                  {completedTasks} of {tasks.length} completed today
                </p>
              </div>
              <button style={{ padding: 8, background: "none", border: "none", cursor: "pointer", color: "var(--on-surface-variant)", borderRadius: 12 }}>
                <Icon name="filter_list" style={{ fontSize: 22 } as React.CSSProperties} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    backgroundColor: "var(--surface-container-low)",
                    padding: "16px", borderRadius: 16, transition: "background 0.2s", cursor: "default"
                  }}
                  className="task-row"
                  onMouseEnter={e => {
                    (e.currentTarget.style.backgroundColor = "var(--surface-container-high)");
                    const btn = e.currentTarget.querySelector(".task-delete") as HTMLElement;
                    if (btn) btn.style.opacity = "1";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget.style.backgroundColor = "var(--surface-container-low)");
                    const btn = e.currentTarget.querySelector(".task-delete") as HTMLElement;
                    if (btn) btn.style.opacity = "0";
                  }}
                >
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    style={{
                      width: 24, height: 24, borderRadius: 8,
                      border: task.done ? "2px solid var(--primary)" : "2px solid var(--outline-variant)",
                      backgroundColor: task.done ? "var(--primary)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0, transition: "all 0.2s"
                    }}
                  >
                    {task.done && <Icon name="check" style={{ fontSize: 14, color: "var(--on-primary)", fontWeight: 900 } as React.CSSProperties} />}
                  </button>
                  <span style={{
                    flex: 1, fontWeight: 500,
                    color: task.done ? "var(--on-surface-variant)" : "var(--on-surface)",
                    textDecoration: task.done ? "line-through" : "none"
                  }}>
                    {task.text}
                  </span>
                  <button
                    className="task-delete"
                    onClick={() => handleDeleteTask(task.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--on-surface-variant)", opacity: 0, transition: "opacity 0.2s" }}
                  >
                    <Icon name="delete" style={{ fontSize: 20 } as React.CSSProperties} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddTask} style={{ position: "relative" }}>
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a new focus quest..."
                style={{
                  width: "100%", backgroundColor: "var(--surface-container-highest)",
                  border: "none", borderRadius: 16, padding: "16px 16px 16px 48px",
                  color: "var(--on-surface)", fontSize: 15, outline: "none",
                  transition: "box-shadow 0.2s"
                }}
                onFocus={e => (e.currentTarget.style.boxShadow = "0 0 0 2px rgba(254,178,70,0.5)")}
                onBlur={e => (e.currentTarget.style.boxShadow = "none")}
              />
              <Icon name="add" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--primary)", fontSize: 22 } as React.CSSProperties} />
            </form>
          </section>

          {/* Motivational Quote */}
          <section
            style={{
              gridColumn: "span 12",
              background: "linear-gradient(135deg, var(--secondary-container) 0%, var(--on-secondary-fixed-variant) 100%)",
              borderRadius: 24, padding: 32,
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              color: "#e1c6fa", minHeight: 220
            }}
            className="quote-section"
          >
            <style>{`@media(min-width:768px){.quote-section{grid-column:span 4!important}}`}</style>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <Icon name="format_quote" style={{ fontSize: 40, opacity: 0.4 } as React.CSSProperties} />
              <button
                onClick={fetchQuote}
                disabled={quoteLoading}
                title="Fetch new quote"
                style={{
                  background: "rgba(255,255,255,0.12)", border: "none", cursor: quoteLoading ? "default" : "pointer",
                  width: 36, height: 36, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#e1c6fa", transition: "background 0.2s, transform 0.4s",
                  transform: quoteLoading ? "rotate(360deg)" : "rotate(0deg)",
                  flexShrink: 0
                }}
                onMouseEnter={e => { if (!quoteLoading) (e.currentTarget.style.background = "rgba(255,255,255,0.22)"); }}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
              >
                <Icon name="refresh" style={{ fontSize: 20, animation: quoteLoading ? "spin 0.7s linear infinite" : "none" } as React.CSSProperties} />
              </button>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              {quoteLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ height: 16, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, width: "90%", animation: "pulse 1.2s ease-in-out infinite" }} />
                  <div style={{ height: 16, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, width: "75%", animation: "pulse 1.2s ease-in-out infinite" }} />
                  <div style={{ height: 16, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, width: "60%", animation: "pulse 1.2s ease-in-out infinite" }} />
                  <div style={{ height: 11, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 6, width: "40%", marginTop: 12, animation: "pulse 1.2s ease-in-out infinite" }} />
                </div>
              ) : (
                <>
                  <p className="font-headline" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.4, marginBottom: 16 }}>
                    {quote.text}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.6 }}>
                    — {quote.author}
                  </p>
                </>
              )}
            </div>
            <style>{`
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              @keyframes pulse { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
            `}</style>
          </section>

        </div>
      </main>

      {/* FAB Buttons */}
      <div style={{ position: "fixed", bottom: 32, right: 32, zIndex: 50, display: "flex", flexDirection: "column", gap: 16 }}>
        <button
          onClick={() => setThemeForest((f) => !f)}
          className="glass"
          style={{
            width: 56, height: 56, border: "none", cursor: "pointer",
            color: "#e2c7fc", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)", transition: "all 0.2s"
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--surface-bright)")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}
        >
          <Icon name={themeForest ? "wb_sunny" : "dark_mode"} style={{ fontSize: 24 } as React.CSSProperties} />
        </button>
        <button
          onClick={() => setIsPlaying((p) => !p)}
          style={{
            width: 56, height: 56, backgroundColor: "var(--primary)", color: "var(--on-primary)",
            borderRadius: "50%", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(254,178,70,0.3)", transition: "transform 0.2s"
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Icon name="bolt" style={{ fontSize: 24 } as React.CSSProperties} />
        </button>
      </div>

      {/* Mobile Bottom Nav */}
      <nav style={{
        display: "none", position: "fixed", bottom: 0, left: 0, width: "100%",
        backgroundColor: "#1a1a1a", padding: 16,
        justifyContent: "space-around", alignItems: "center",
        borderTop: "1px solid rgba(255,255,255,0.05)", zIndex: 50
      }} className="mobile-nav">
        <style>{`@media(max-width:768px){.mobile-nav{display:flex!important}}`}</style>
        {[
          { icon: "dashboard", label: "Focus" },
          { icon: "subscriptions", label: "Music" },
          { icon: "waves", label: "Tasks" },
          { icon: "settings", label: "Settings" },
        ].map(({ icon, label }) => (
          <button key={icon} onClick={() => setActiveNav(label)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Icon name={icon} style={{ color: activeNav === label ? "var(--primary)" : "var(--on-surface-variant)", fontSize: 24 } as React.CSSProperties} />
          </button>
        ))}
      </nav>
    </div>
  );
}
