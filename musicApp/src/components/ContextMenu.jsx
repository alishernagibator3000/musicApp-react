import { useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import './ContextMenu.css';

export default function ContextMenu() {
    const { state, dispatch, showToast, navigate } = useApp();
    const menuRef = useRef(null);

    const close = useCallback(() => {
        dispatch({ type: 'SET_CONTEXT_MENU', payload: null });
    }, [dispatch]);

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) close();
        };
        const handleScroll = () => close();

        if (state.contextMenu) {
            document.addEventListener('click', handleClick);
            document.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [state.contextMenu, close]);

    if (!state.contextMenu) return null;

    const { x, y, item, type } = state.contextMenu;

    const handleLikeSong = () => {
        dispatch({ type: 'TOGGLE_LIKE_SONG', payload: item });
        const isLiked = state.library.likedSongs.has(item.trackId);
        showToast(isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs', isLiked ? 'removed' : 'success');
        close();
    };

    const handleLikeAlbum = () => {
        dispatch({ type: 'TOGGLE_LIKE_ALBUM', payload: item });
        const isLiked = state.library.likedAlbums.has(item.collectionId);
        showToast(isLiked ? 'Removed from Albums' : 'Added to Albums', isLiked ? 'removed' : 'success');
        close();
    };

    const handleAddToPlaylist = (playlistId) => {
        const playlist = state.playlists.find(p => p.id === playlistId);
        if (!playlist) return;
        if (type === 'track') {
            if (playlist.tracks.some(t => t.trackId === item.trackId)) {
                showToast('Song already in playlist', 'error');
            } else {
                dispatch({ type: 'ADD_TRACK_TO_PLAYLIST', payload: { playlistId, track: item } });
                showToast(`Added to ${playlist.name}`, 'success');
            }
        }
        close();
    };

    const handleDeletePlaylist = () => {
        dispatch({ type: 'DELETE_PLAYLIST', payload: item.id });
        showToast('Playlist deleted', 'removed');
        if (state.currentView === 'playlistDetail' && state.currentPlaylistId === item.id) navigate('home');
        close();
    };

    const handleClearPlaylist = () => {
        dispatch({ type: 'CLEAR_PLAYLIST', payload: item.id });
        showToast('Playlist cleared', 'removed');
        close();
    };

    return (
        <div className="context-menu-overlay" onClick={close}>
            <div
                ref={menuRef}
                className="context-menu"
                style={{
                    left: Math.min(x, window.innerWidth - 220),
                    top: Math.min(y, window.innerHeight - 200),
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {type === 'track' && (
                    <>
                        <button className="context-menu-item" onClick={handleLikeSong}>
                            {state.library.likedSongs.has(item.trackId) ? (
                                <>
                                    <svg viewBox="0 0 24 24" fill="var(--color-accent)" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                    Remove from Liked
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                    Save to Liked Songs
                                </>
                            )}
                        </button>
                        {state.playlists.length > 0 && (
                            <>
                                <div className="context-menu-divider" />
                                <div className="context-menu-label">Add to Playlist</div>
                                {state.playlists.map(pl => (
                                    <button
                                        key={pl.id}
                                        className="context-menu-item context-menu-playlist"
                                        onClick={() => handleAddToPlaylist(pl.id)}
                                    >
                                        <span className="playlist-dot" style={{ background: pl.color }} />
                                        {pl.name}
                                    </button>
                                ))}
                            </>
                        )}
                    </>
                )}

                {type === 'album' && (
                    <button className="context-menu-item" onClick={handleLikeAlbum}>
                        {state.library.likedAlbums.has(item.collectionId) ? (
                            <>
                                <svg viewBox="0 0 24 24" fill="var(--color-accent)" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                Remove from Albums
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                Save to Albums
                            </>
                        )}
                    </button>
                )}

                {type === 'playlist' && (
                    <>
                        <button className="context-menu-item" onClick={handleClearPlaylist}>
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                            Clear Playlist
                        </button>
                        <div className="context-menu-divider" />
                        <button className="context-menu-item context-menu-danger" onClick={handleDeletePlaylist}>
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                            Delete Playlist
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
