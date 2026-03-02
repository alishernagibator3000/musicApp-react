import { useApp } from '../context/AppContext';
import './Sidebar.css';

export default function Sidebar() {
    const { state, navigate, dispatch } = useApp();

    const navItems = [
        { id: 'home', label: 'Listen Now', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg> },
        { id: 'search', label: 'Search', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg> },
        { id: 'library', label: 'Library', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 9h-2v3.5c0 1.38-1.12 2.5-2.5 2.5S10 15.88 10 14.5s1.12-2.5 2.5-2.5c.57 0 1.08.19 1.5.51V7h3v4z" /></svg> },
    ];

    const handlePlaylistOpen = (playlistId) => {
        dispatch({ type: 'SET_CURRENT_PLAYLIST_ID', payload: playlistId });
        navigate('playlistDetail');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                <div className="sidebar-logo">
                    <div className="logo-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </div>
                    <span>Music</span>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`sidebar-nav-item ${state.currentView === item.id ? 'active' : ''}`}
                            onClick={() => navigate(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-section">
                    <div className="sidebar-section-header">
                        <h3>Playlists</h3>
                        <button
                            className="sidebar-add-btn"
                            onClick={() => dispatch({ type: 'SET_PLAYLIST_MODAL', payload: true })}
                            aria-label="Create playlist"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                        </button>
                    </div>

                    <div className="sidebar-playlists">
                        {state.playlists.map(pl => (
                            <button
                                key={pl.id}
                                className={`sidebar-playlist-item ${state.currentView === 'playlistDetail' && state.currentPlaylistId === pl.id ? 'active' : ''}`}
                                onClick={() => handlePlaylistOpen(pl.id)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    dispatch({
                                        type: 'SET_CONTEXT_MENU',
                                        payload: { x: e.clientX, y: e.clientY, item: pl, type: 'playlist' },
                                    });
                                }}
                            >
                                <div className="playlist-color" style={{ background: pl.color }}>
                                    <svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)" width="12" height="12">
                                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                    </svg>
                                </div>
                                <div className="playlist-info">
                                    <span className="playlist-name">{pl.name}</span>
                                    <span className="playlist-count">{pl.tracks.length} songs</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}
