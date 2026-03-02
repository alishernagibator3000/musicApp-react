import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

export function useAudioPlayer() {
    const { state, dispatch, audioRef, showToast } = useApp();
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const isSeeking = useRef(false);

    const audio = audioRef.current;

    useEffect(() => {
        audio.volume = state.isMuted ? 0 : state.volume;
    }, [state.volume, state.isMuted, audio]);

    useEffect(() => {
        const handleTimeUpdate = () => {
            if (!isSeeking.current && audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
                setCurrentTime(audio.currentTime);
            }
        };

        const handleLoadedMetadata = () => setDuration(audio.duration);

        const handleEnded = () => {
            if (state.repeatMode === 'one') {
                audio.currentTime = 0;
                audio.play().catch(() => { });
            } else {
                playNext();
            }
        };

        const handleError = () => {
            if (audio.src && audio.src !== window.location.href) {
                showToast('Could not play this track — trying next', 'error');
                setTimeout(() => playNext(), 1000);
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, [audio, state.repeatMode, state.tracks, state.currentTrackIndex, state.shuffleMode, state.shuffledIndices]);

    const play = useCallback((track, index = 0) => {
        if (!track?.previewUrl) {
            showToast('No preview available for this track', 'error');
            return;
        }

        audio.src = track.previewUrl;
        audio.play().then(() => {
            dispatch({ type: 'SET_CURRENT_TRACK', payload: { track, index } });
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: track.trackName,
                    artist: track.artistName,
                    album: track.collectionName || '',
                    artwork: track.artworkUrl100 ? [
                        { src: track.artworkUrl100.replace('100x100', '512x512'), sizes: '512x512', type: 'image/jpeg' }
                    ] : [],
                });
            }
        }).catch(() => {
            showToast('Playback failed', 'error');
        });
    }, [audio, dispatch, showToast]);

    const togglePlay = useCallback(() => {
        if (!state.currentTrack) return;
        if (state.isPlaying) {
            audio.pause();
            dispatch({ type: 'SET_PLAYING', payload: false });
        } else {
            audio.play().then(() => {
                dispatch({ type: 'SET_PLAYING', payload: true });
            }).catch(() => { });
        }
    }, [audio, state.currentTrack, state.isPlaying, dispatch]);

    const getNextIndex = useCallback((direction = 1) => {
        const len = state.tracks.length;
        if (len === 0) return -1;

        if (state.shuffleMode && state.shuffledIndices.length > 0) {
            const currentShufflePos = state.shuffledIndices.indexOf(state.currentTrackIndex);
            const nextShufflePos = currentShufflePos + direction;

            if (nextShufflePos >= 0 && nextShufflePos < state.shuffledIndices.length) {
                return state.shuffledIndices[nextShufflePos];
            }

            if (state.repeatMode === 'all') {
                return direction > 0 ? state.shuffledIndices[0] : state.shuffledIndices[state.shuffledIndices.length - 1];
            }
            return -1;
        }

        const nextIndex = state.currentTrackIndex + direction;
        if (nextIndex >= 0 && nextIndex < len) return nextIndex;
        if (state.repeatMode === 'all') return direction > 0 ? 0 : len - 1;
        return -1;
    }, [state.tracks, state.currentTrackIndex, state.shuffleMode, state.shuffledIndices, state.repeatMode]);

    const playNext = useCallback(() => {
        const nextIdx = getNextIndex(1);
        if (nextIdx >= 0 && state.tracks[nextIdx]) {
            play(state.tracks[nextIdx], nextIdx);
        } else {
            audio.pause();
            dispatch({ type: 'SET_PLAYING', payload: false });
        }
    }, [getNextIndex, state.tracks, play, audio, dispatch]);

    const playPrevious = useCallback(() => {
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            return;
        }
        const prevIdx = getNextIndex(-1);
        if (prevIdx >= 0 && state.tracks[prevIdx]) {
            play(state.tracks[prevIdx], prevIdx);
        }
    }, [getNextIndex, state.tracks, play, audio]);

    const seek = useCallback((percent) => {
        if (audio.duration) {
            audio.currentTime = (percent / 100) * audio.duration;
            setProgress(percent);
            setCurrentTime(audio.currentTime);
        }
    }, [audio]);

    const startSeeking = useCallback(() => { isSeeking.current = true; }, []);

    const stopSeeking = useCallback((percent) => {
        isSeeking.current = false;
        seek(percent);
    }, [seek]);

    const setVolume = useCallback((vol) => {
        dispatch({ type: 'SET_VOLUME', payload: Math.min(Math.max(vol, 0), 1) });
    }, [dispatch]);

    const toggleMute = useCallback(() => { dispatch({ type: 'TOGGLE_MUTE' }); }, [dispatch]);
    const toggleShuffle = useCallback(() => { dispatch({ type: 'TOGGLE_SHUFFLE' }); }, [dispatch]);

    const toggleRepeat = useCallback(() => {
        const modes = ['off', 'all', 'one'];
        dispatch({ type: 'SET_REPEAT', payload: modes[(modes.indexOf(state.repeatMode) + 1) % 3] });
    }, [state.repeatMode, dispatch]);

    const playAll = useCallback((tracks) => {
        if (tracks?.length > 0) {
            dispatch({ type: 'SET_TRACKS', payload: tracks });
            play(tracks[0], 0);
        }
    }, [dispatch, play]);

    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', togglePlay);
            navigator.mediaSession.setActionHandler('pause', togglePlay);
            navigator.mediaSession.setActionHandler('nexttrack', playNext);
            navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
        }
    }, [togglePlay, playNext, playPrevious]);

    return {
        progress, currentTime, duration,
        play, togglePlay, playNext, playPrevious,
        seek, startSeeking, stopSeeking,
        setVolume, toggleMute, toggleShuffle, toggleRepeat,
        playAll,
    };
}
