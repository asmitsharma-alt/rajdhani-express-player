import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Loader2, Volume2, Plus, Minus, Github } from 'lucide-react';

interface Song {
  title: string;
  artist: string;
  url: string;
  cover: string;
}

import { SONGS } from './playlist';

function formatTime(seconds: number) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function App() {
  const [songs, setSongs] = useState<Song[]>(SONGS);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem('rajdhani_current_index');
    return saved ? parseInt(saved, 10) : 0;
  });
  const isFirstLoad = useRef(true);

  useEffect(() => {
    localStorage.setItem('rajdhani_current_index', currentIndex.toString());
  }, [currentIndex]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [clock, setClock] = useState(new Date());
  const [volume, setVolume] = useState(0.6);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const busAudioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const song = songs[currentIndex];

  useEffect(() => {
    if (audioRef.current && song) {
      audioRef.current.src = song.url;
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title,
          artist: song.artist,
          album: 'Rajdhani Express',
          artwork: [
            { src: song.cover, sizes: '500x500', type: 'image/jpeg' }
          ]
        });
      }
    }
  }, [currentIndex, song]);

  useEffect(() => {
    if (busAudioRef.current) {
      if (isPlaying) {
        busAudioRef.current.play().catch(console.error);
      } else {
        busAudioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (!audioCtxRef.current) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaElementSource(audioRef.current);
        
        const dryNode = ctx.createGain();
        dryNode.gain.value = 0.85; // 85% original clarity
        
        const wetNode = ctx.createGain();
        wetNode.gain.value = 0.25; // 25% radio effect

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 1200;
        bandpass.Q.value = 0.8;

        const distortion = ctx.createWaveShaper();
        const amount = 12;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
          const x = i * 2 / n_samples - 1;
          curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
        }
        distortion.curve = curve;

        // Clean audio path
        source.connect(dryNode);
        dryNode.connect(ctx.destination);

        // Radio effect path
        source.connect(bandpass);
        bandpass.connect(distortion);
        distortion.connect(wetNode);
        wetNode.connect(ctx.destination);
      } catch (e) {
        console.error("Audio API error:", e);
      }
    }

    if (isPlaying) {
      audioRef.current.pause();
      if (busAudioRef.current) busAudioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
      if (busAudioRef.current) busAudioRef.current.play().catch(console.error);
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const nextSong = useCallback(() => {
    if (songs.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % songs.length);
  }, [songs.length]);

  const prevSong = useCallback(() => {
    if (songs.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
  }, [songs.length]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('previoustrack', prevSong);
      navigator.mediaSession.setActionHandler('nexttrack', nextSong);
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });
    }
  }, [togglePlay, prevSong, nextSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 0;
      setCurrentTime(time);
      setDuration(dur);
      localStorage.setItem('rajdhani_current_time', time.toString());
      
      if ('mediaSession' in navigator && dur > 0 && !isNaN(dur)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: dur,
            playbackRate: audioRef.current.playbackRate,
            position: time
          });
        } catch (e) {
          // ignore position state errors
        }
      }
    }
  };

  const handleEnded = () => {
    nextSong();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  if (loading || !song) {
    return (
      <div className="relative flex min-h-dvh flex-1 flex-col items-center justify-center overflow-hidden bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col items-center justify-between overflow-hidden">
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedData={(e) => { 
          e.currentTarget.volume = volume;
          if (isFirstLoad.current) {
            const savedTime = parseFloat(localStorage.getItem('rajdhani_current_time') || '0');
            if (!isNaN(savedTime) && savedTime > 0 && savedTime < e.currentTarget.duration) {
              e.currentTarget.currentTime = savedTime;
            }
            isFirstLoad.current = false;
          }
        }}
      />
      <audio
        ref={busAudioRef}
        src="/bus-sound.mp3"
        loop
        className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
        onLoadedData={(e) => { e.currentTarget.volume = 0.4; }}
      />
      
      {/* Background layer */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 -z-10 h-full w-full object-cover"
        src="/bg-video-loop.mp4"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
      


      {/* Minimal Clock */}
      <div className="fixed left-6 top-6 z-20 text-2xl font-light tabular-nums tracking-widest text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
        {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* Social Links - Bottom Right */}
      <div className="fixed right-6 bottom-6 z-20 flex items-center gap-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
        <a 
          href="https://open.spotify.com/playlist/3iYHVXAyUepzzNPKaGn3p1?si=vQ7vCmLVQT-9LuiExu4qYQ" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white/50 hover:text-[#1DB954] hover:scale-110 transition-all duration-300"
          aria-label="Spotify Playlist"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" height="24" width="24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </a>
        <a 
          href="https://github.com/asmitsharma-alt/rajdhani-express-player-v2" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white/50 hover:text-white hover:scale-110 transition-all duration-300"
          aria-label="GitHub Repository"
        >
          <Github size={24} />
        </a>
      </div>

      {/* Volume UI - Top Right */}
      <div className="fixed right-5 top-5 z-20 flex items-center gap-2 drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)] bg-black/20 px-3 py-2 rounded-full backdrop-blur-sm border border-white/10">
        <button 
          onClick={() => {
            const newVol = volume > 0 ? 0 : 0.6;
            setVolume(newVol);
            if (audioRef.current) audioRef.current.volume = newVol;
          }}
          className="active:scale-95 transition"
          aria-label="Toggle Mute"
        >
          <Volume2 size={16} className="text-white/70 hover:text-white transition" />
        </button>
        <div className="flex items-end gap-[4px] h-4 cursor-pointer group/vol" aria-label="Volume">
          {[1, 2, 3, 4, 5].map((level) => {
            const barVol = level * 0.2;
            const isActive = volume >= barVol - 0.05;
            return (
              <div 
                key={level}
                className={`w-1.5 rounded-[1px] transition-all duration-200 hover:scale-110 ${isActive ? 'bg-white' : 'bg-white/30'}`}
                style={{ height: `${40 + level * 12}%` }}
                onClick={() => {
                  setVolume(barVol);
                  if (audioRef.current) audioRef.current.volume = barVol;
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Main Logo */}
      <div className="mt-[14vh] flex flex-col items-center px-6 z-10">
        <h1 className="text-center font-['Kalam'] text-6xl md:text-8xl lg:text-9xl text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          राजधानी<br />एक्सप्रेस
        </h1>
      </div>

      {/* Player */}
      <div className="mb-[8vh] flex w-full justify-center px-6 z-10">
        <div className="w-full max-w-xl">
          <div className="flex items-center gap-4">
            {/* Spinning Record */}
            <div className="relative h-20 w-20 shrink-0">
              <img
                src={song.cover}
                alt=""
                draggable={false}
                className={`h-full w-full overflow-hidden rounded-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
                style={{
                  WebkitMaskImage: 'radial-gradient(circle, transparent 6px, black 7px)',
                  maskImage: 'radial-gradient(circle, transparent 6px, black 7px)'
                }}
              />
            </div>

            {/* Song Info & Progress */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="truncate text-[15px] font-semibold text-white drop-shadow-sm">
                  {song.title}
                </div>
              </div>
              <div className="truncate text-[13px] text-white/70">{song.artist}</div>

              {/* Progress Bar */}
              <div className="mt-2">
                <div 
                  ref={progressBarRef}
                  className="group/bar relative h-2 w-full cursor-pointer py-1"
                  onClick={handleSeek}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/20">
                    <div 
                      className="h-full rounded-full bg-white/90" 
                      style={{ width: `${progressPercent}%` }} 
                    />
                  </div>
                  <div 
                    className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover/bar:opacity-100" 
                    style={{ left: `${progressPercent}%` }} 
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-white/60">
                  <span>{formatTime(currentTime)}</span>
                  <span>-{formatTime(duration - currentTime)}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white active:scale-95"
                onClick={prevSong}
                aria-label="Previous track"
              >
                <SkipBack size={18} fill="currentColor" />
              </button>
              <button
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-black shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause size={20} fill="currentColor" stroke="none" />
                ) : (
                  <Play size={20} fill="currentColor" className="translate-x-0.5" stroke="none" />
                )}
              </button>
              <button
                className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white active:scale-95"
                onClick={nextSong}
                aria-label="Next track"
              >
                <SkipForward size={18} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
