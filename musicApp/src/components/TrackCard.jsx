import { memo } from 'react';
import { useApp } from '../context/AppContext';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { formatTime } from '../utils/helpers';
import './TrackCard.css';

const TrackCard = memo(function TrackCard({ track, index, tracks }) {
    const { state, dispatch, showToast } = useApp();
    const { play } = useAudioPlayer();

    const isPlaying = state.currentTrack?.trackId === track.trackId;
    const isLiked = state.library.likedSongs.has(track.trackId);

    const handleClick = () => {
        if (tracks) dispatch({ type: 'SET_TRACKS', payload: tracks });
        play(track, index);
    };

    const handleLike = (e) => {
        e.stopPropagation();
        dispatch({ type: 'TOGGLE_LIKE_SONG', payload: track });
        showToast(
            isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs',
            isLiked ? 'removed' : 'success'
        );
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        dispatch({
            type: 'SET_CONTEXT_MENU',
            payload: { x: e.clientX, y: e.clientY, item: track, type: 'track' },
        });
    };

    return (
        <div
            className={`track-card ${isPlaying ? 'playing' : ''}`}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
        >
            <span className="track-index">
                {isPlaying ? (
                    <span className="now-playing-bars">
                        <span /><span /><span />
                    </span>
                ) : (
                    index + 1
                )}
            </span>
            <img
                className="track-cover"
                src={track.artworkUrl100}
                alt={track.trackName}
                loading="lazy"
            />
            <div className="track-info">
                <span className={`track-title ${isPlaying ? 'text-accent' : ''}`}>
                    {track.trackName}
                </span>
                <span className="track-artist">{track.artistName}</span>
            </div>
            <span className="track-duration">
                {formatTime((track.trackTimeMillis || 0) / 1000)}
            </span>
            <button
                className={`track-like-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
                aria-label={isLiked ? 'Unlike' : 'Like'}
            >
                <svg viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
            </button>
        </div>
    );
});

export default TrackCard;
