import { useRef, useCallback, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { formatTime, getHighResArtwork } from '../utils/helpers';
import './Player.css';

export default function Player() {
    const { state, dispatch, showToast } = useApp();
    const {
        progress, currentTime, duration,
        togglePlay, playNext, playPrevious,
        seek, startSeeking, stopSeeking,
        setVolume, toggleMute, toggleShuffle, toggleRepeat,
    } = useAudioPlayer();

    const progressRef = useRef(null);
    const volumeRef = useRef(null);
    const [mobileExpanded, setMobileExpanded] = useState(false);

    const handleProgressClick = useCallback((e) => {
        if (!progressRef.current) return;
        const rect = progressRef.current.getBoundingClientRect();
        stopSeeking(Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 0), 100));
    }, [stopSeeking]);

    const handleProgressDrag = useCallback((e) => {
        if (!progressRef.current) return;
        startSeeking();
        const rect = progressRef.current.getBoundingClientRect();

        const onMove = (ev) => {
            const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
            seek(Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 0), 100));
        };

        const onUp = (ev) => {
            const clientX = ev.changedTouches ? ev.changedTouches[0].clientX : ev.clientX;
            stopSeeking(Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 0), 100));
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove);
        document.addEventListener('touchend', onUp);
    }, [seek, startSeeking, stopSeeking]);

    const handleVolumeClick = useCallback((e) => {
        if (!volumeRef.current) return;
        const rect = volumeRef.current.getBoundingClientRect();
        setVolume((e.clientX - rect.left) / rect.width);
    }, [setVolume]);

    const handleLike = () => {
        if (!state.currentTrack) return;
        dispatch({ type: 'TOGGLE_LIKE_SONG', payload: state.currentTrack });
        const isLiked = state.library.likedSongs.has(state.currentTrack.trackId);
        showToast(
            isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs',
            isLiked ? 'removed' : 'success'
        );
    };

    const isLiked = state.currentTrack && state.library.likedSongs.has(state.currentTrack.trackId);
    const volumePercent = state.isMuted ? 0 : state.volume * 100;

    const playIcon = state.isPlaying
        ? <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        : <path d="M8 5v14l11-7z" />;

    return (
        <>
            <footer className="player-bar">
                <div className="player-track-info" onClick={() => window.innerWidth <= 768 && setMobileExpanded(true)}>
                    <img
                        className="player-cover"
                        src={state.currentTrack?.artworkUrl100 || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%231C1C1E"/%3E%3C/svg%3E'}
                        alt=""
                    />
                    <div className="player-text">
                        <div className="player-title">{state.currentTrack?.trackName || 'Not Playing'}</div>
                        <div className="player-artist">{state.currentTrack?.artistName || ''}</div>
                    </div>
                    <button className={`player-like-btn ${isLiked ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); handleLike(); }}>
                        <svg viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>
                </div>

                <div className="player-controls-center">
                    <div className="player-controls">
                        <button
                            className={`player-ctrl-btn ${state.shuffleMode ? 'active' : ''}`}
                            onClick={toggleShuffle}
                            aria-label="Shuffle"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" /></svg>
                        </button>
                        <button className="player-ctrl-btn" onClick={playPrevious} aria-label="Previous">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                        </button>
                        <button className="player-play-btn" onClick={togglePlay} aria-label={state.isPlaying ? 'Pause' : 'Play'}>
                            <svg viewBox="0 0 24 24" fill="currentColor">{playIcon}</svg>
                        </button>
                        <button className="player-ctrl-btn" onClick={playNext} aria-label="Next">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                        </button>
                        <button
                            className={`player-ctrl-btn ${state.repeatMode !== 'off' ? 'active' : ''}`}
                            onClick={toggleRepeat}
                            aria-label="Repeat"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>
                            {state.repeatMode === 'one' && <span className="repeat-one-badge">1</span>}
                        </button>
                    </div>

                    <div className="player-progress-row">
                        <span className="player-time">{formatTime(currentTime)}</span>
                        <div
                            className="player-progress-bar"
                            ref={progressRef}
                            onClick={handleProgressClick}
                            onMouseDown={handleProgressDrag}
                            onTouchStart={handleProgressDrag}
                        >
                            <div className="progress-bg" />
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                            <div className="progress-handle" style={{ left: `${progress}%` }} />
                        </div>
                        <span className="player-time">{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="player-volume">
                    <button className="player-ctrl-btn" onClick={toggleMute} aria-label="Volume">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            {state.isMuted || state.volume === 0
                                ? <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                                : <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                            }
                        </svg>
                    </button>
                    <div className="volume-bar" ref={volumeRef} onClick={handleVolumeClick}>
                        <div className="volume-bg" />
                        <div className="volume-fill" style={{ width: `${volumePercent}%` }} />
                        <div className="volume-handle" style={{ left: `${volumePercent}%` }} />
                    </div>
                </div>
            </footer>

            <div className={`mobile-player-expanded ${mobileExpanded ? 'active' : ''}`}>
                <div className="mobile-player-header">
                    <button className="mobile-player-collapse" onClick={() => setMobileExpanded(false)}>
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" /></svg>
                    </button>
                    <span className="mobile-player-label">Now Playing</span>
                    <div style={{ width: 32 }} />
                </div>

                <div className="mobile-player-body">
                    <img
                        className="mobile-player-cover"
                        src={state.currentTrack ? getHighResArtwork(state.currentTrack.artworkUrl100, 600) : ''}
                        alt=""
                    />

                    <div className="mobile-player-track-info">
                        <h2 className="mobile-player-title">{state.currentTrack?.trackName || 'Not Playing'}</h2>
                        <p className="mobile-player-artist">{state.currentTrack?.artistName || ''}</p>
                    </div>

                    <div className="mobile-progress-section">
                        <div
                            className="mobile-progress-bar"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                stopSeeking(Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 0), 100));
                            }}
                        >
                            <div className="progress-bg" />
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="mobile-time-row">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="mobile-controls">
                        <button className={`mobile-ctrl-btn ${state.shuffleMode ? 'active' : ''}`} onClick={toggleShuffle}>
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" /></svg>
                        </button>
                        <button className="mobile-ctrl-btn" onClick={playPrevious}>
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                        </button>
                        <button className="mobile-play-btn" onClick={togglePlay}>
                            <svg viewBox="0 0 24 24" fill="currentColor">{playIcon}</svg>
                        </button>
                        <button className="mobile-ctrl-btn" onClick={playNext}>
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                        </button>
                        <button className={`mobile-ctrl-btn ${state.repeatMode !== 'off' ? 'active' : ''}`} onClick={toggleRepeat}>
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>
                            {state.repeatMode === 'one' && <span className="repeat-one-badge">1</span>}
                        </button>
                    </div>

                    <button className={`mobile-like-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
                        <svg viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
}
