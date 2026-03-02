import { useEffect, useState, useCallback, useRef } from 'react';
import { useApp } from './context/AppContext';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { loadInitialData, loadAllCharts, loadAllReleases, loadAlbumDetail, performFullSearch } from './services/api';
import { getGreeting, getHighResArtwork, debounce, formatTime } from './utils/helpers';

import Sidebar from './components/Sidebar';
import Player from './components/Player';
import MobileNav from './components/MobileNav';
import TrackCard from './components/TrackCard';
import AlbumCard from './components/AlbumCard';
import Toast from './components/Toast';
import ContextMenu from './components/ContextMenu';
import { CreatePlaylistModal, EditPlaylistModal } from './components/Modal';

import './App.css';

export default function App() {
  const { state, dispatch, navigate, goBack, showToast } = useApp();
  const { play, playAll } = useAudioPlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ tracks: [], albums: [] });
  const [allCharts, setAllCharts] = useState([]);
  const [allReleases, setAllReleases] = useState([]);
  const [albumDetail, setAlbumDetail] = useState(null);

  const [editPlaylistId, setEditPlaylistId] = useState(null);
  const [libraryTab, setLibraryTab] = useState('songs');
  const [loadingContent, setLoadingContent] = useState(false);

  const contentRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await loadInitialData();
        dispatch({ type: 'SET_INITIAL_DATA', payload: data });
        dispatch({ type: 'SET_TRACKS', payload: data.charts });
      } catch {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, [dispatch]);

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) return;
      try {
        setLoadingContent(true);
        const results = await performFullSearch(query);
        setSearchResults(results);
        navigate('search');
      } catch (error) {
        if (error.name !== 'AbortError') showToast('Search failed', 'error');
      } finally {
        setLoadingContent(false);
      }
    }, 500),
    [navigate, showToast]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) debouncedSearch(value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      debouncedSearch.cancel?.();
      debouncedSearch(searchQuery);
    }
  };

  const handleLoadAllCharts = async () => {
    setLoadingContent(true);
    try {
      const charts = await loadAllCharts();
      setAllCharts(charts);
      navigate('charts');
    } catch { showToast('Failed to load charts', 'error'); }
    setLoadingContent(false);
  };

  const handleLoadAllReleases = async () => {
    setLoadingContent(true);
    try {
      const releases = await loadAllReleases();
      setAllReleases(releases);
      navigate('releases');
    } catch { showToast('Failed to load releases', 'error'); }
    setLoadingContent(false);
  };

  const handleLoadAlbum = async (albumId) => {
    setLoadingContent(true);
    try {
      const data = await loadAlbumDetail(albumId);
      setAlbumDetail(data);
      dispatch({ type: 'SET_CURRENT_ALBUM_ID', payload: parseInt(albumId) });
      dispatch({ type: 'SET_TRACKS', payload: data.tracks });
      navigate('detail');
    } catch { showToast('Failed to load album', 'error'); }
    setLoadingContent(false);
  };

  const handlePlaylistOpen = (playlistId) => {
    dispatch({ type: 'SET_CURRENT_PLAYLIST_ID', payload: playlistId });
    navigate('playlistDetail');
  };

  const handleCreatePlaylist = (name, color) => {
    dispatch({ type: 'CREATE_PLAYLIST', payload: { name, color } });
    showToast(`Playlist "${name}" created`, 'success');
  };

  const handlePlayAll = (tracks) => {
    if (tracks?.length > 0) {
      dispatch({ type: 'SET_TRACKS', payload: tracks });
      playAll(tracks);
    }
  };

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.currentView]);

  const showBackBtn = ['detail', 'playlistDetail', 'charts', 'releases', 'search'].includes(state.currentView);
  const currentPlaylist = state.playlists.find(p => p.id === state.currentPlaylistId);
  const editPlaylist = state.playlists.find(p => p.id === editPlaylistId);
  const isLikedAlbum = albumDetail && state.library.likedAlbums.has(albumDetail.album.collectionId);

  const handleLikeAlbum = () => {
    if (!albumDetail) return;
    dispatch({ type: 'TOGGLE_LIKE_ALBUM', payload: albumDetail.album });
    const isLiked = state.library.likedAlbums.has(albumDetail.album.collectionId);
    showToast(isLiked ? 'Removed from Albums' : 'Added to Albums', isLiked ? 'removed' : 'success');
  };

  const SkeletonTrack = () => (
    <div className="skeleton-track">
      <div className="skeleton" style={{ width: 24, height: 14 }} />
      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 4 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="skeleton" style={{ width: '60%', height: 12 }} />
        <div className="skeleton" style={{ width: '40%', height: 10 }} />
      </div>
    </div>
  );

  const SkeletonAlbum = () => (
    <div className="skeleton-album">
      <div className="skeleton" style={{ width: '100%', aspectRatio: '1', borderRadius: 12 }} />
      <div className="skeleton" style={{ width: '70%', height: 12, marginTop: 10 }} />
      <div className="skeleton" style={{ width: '50%', height: 10, marginTop: 4 }} />
    </div>
  );

  return (
    <div className="app">
      <Sidebar />

      <main className="main-content">
        <header className="top-header">
          <div className="header-content">
            {showBackBtn && (
              <button className="back-btn" onClick={goBack} aria-label="Go back">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
              </button>
            )}
            <div className="search-bar">
              <svg className="search-bar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search"
                aria-label="Search"
              />
            </div>
          </div>
        </header>

        <div className="content-scroll" ref={contentRef}>

          {state.currentView === 'home' && (
            <div className="view-content" key="home">
              <div className="hero-section">
                <h1 className="page-title">{getGreeting()}</h1>

                <div className="quick-picks">
                  {state.isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="quick-pick skeleton" style={{ height: 64 }} />
                    ))
                    : state.initialReleases.slice(0, 6).map(item => (
                      <div
                        key={item.collectionId}
                        className="quick-pick"
                        onClick={() => handleLoadAlbum(item.collectionId)}
                      >
                        <img src={item.artworkUrl100} alt="" />
                        <span>{item.collectionName}</span>
                      </div>
                    ))
                  }
                </div>
              </div>

              <section className="content-section">
                <div className="section-header">
                  <h2 className="section-title">Top Charts</h2>
                  <button className="see-all-btn" onClick={handleLoadAllCharts}>See All</button>
                </div>
                <div className="tracks-list">
                  {state.isLoading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonTrack key={i} />)
                    : state.initialCharts.map((track, index) => (
                      <TrackCard
                        key={track.trackId}
                        track={track}
                        index={index}
                        tracks={state.initialCharts}
                      />
                    ))
                  }
                </div>
              </section>

              <section className="content-section">
                <div className="section-header">
                  <h2 className="section-title">New Releases</h2>
                  <button className="see-all-btn" onClick={handleLoadAllReleases}>See All</button>
                </div>
                <div className="albums-grid">
                  {state.isLoading
                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonAlbum key={i} />)
                    : state.initialReleases.map(album => (
                      <AlbumCard
                        key={album.collectionId}
                        album={album}
                        onClick={() => handleLoadAlbum(album.collectionId)}
                      />
                    ))
                  }
                </div>
              </section>
            </div>
          )}

          {state.currentView === 'search' && (
            <div className="view-content" key="search">
              <h1 className="page-title">Search Results</h1>
              {searchResults.tracks.length > 0 && (
                <section className="content-section">
                  <h2 className="section-title">Songs</h2>
                  <div className="tracks-list">
                    {searchResults.tracks.map((track, index) => (
                      <TrackCard key={track.trackId} track={track} index={index} tracks={searchResults.tracks} />
                    ))}
                  </div>
                </section>
              )}
              {searchResults.albums.length > 0 && (
                <section className="content-section">
                  <h2 className="section-title">Albums</h2>
                  <div className="albums-grid">
                    {searchResults.albums.map(album => (
                      <AlbumCard key={album.collectionId} album={album} onClick={() => handleLoadAlbum(album.collectionId)} />
                    ))}
                  </div>
                </section>
              )}
              {searchResults.tracks.length === 0 && searchResults.albums.length === 0 && !loadingContent && (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <h3>No results found</h3>
                  <p>Try a different search term</p>
                </div>
              )}
            </div>
          )}

          {state.currentView === 'library' && (
            <div className="view-content" key="library">
              <h1 className="page-title">Library</h1>
              <div className="library-tabs">
                {['songs', 'albums', 'playlists'].map(tab => (
                  <button
                    key={tab}
                    className={`tab-btn ${libraryTab === tab ? 'active' : ''}`}
                    onClick={() => setLibraryTab(tab)}
                  >
                    {tab === 'songs' ? 'Liked Songs' : tab === 'albums' ? 'Albums' : 'Playlists'}
                  </button>
                ))}
              </div>

              {libraryTab === 'songs' && (
                <div className="tracks-list">
                  {state.library.likedSongs.size === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">♫</div>
                      <h3>No liked songs</h3>
                      <p>Go find some music you love!</p>
                    </div>
                  ) : (
                    Array.from(state.library.likedSongs.values()).map((track, index, arr) => (
                      <TrackCard key={track.trackId} track={track} index={index} tracks={arr} />
                    ))
                  )}
                </div>
              )}

              {libraryTab === 'albums' && (
                <div className="albums-grid">
                  {state.library.likedAlbums.size === 0 ? (
                    <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                      <div className="empty-icon">💿</div>
                      <h3>No saved albums</h3>
                      <p>Save albums to your library</p>
                    </div>
                  ) : (
                    Array.from(state.library.likedAlbums.values()).map(album => (
                      <AlbumCard key={album.collectionId} album={album} onClick={() => handleLoadAlbum(album.collectionId)} />
                    ))
                  )}
                </div>
              )}

              {libraryTab === 'playlists' && (
                <div className="albums-grid">
                  <div className="create-playlist-card" onClick={() => dispatch({ type: 'SET_PLAYLIST_MODAL', payload: true })}>
                    <div className="create-playlist-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                    </div>
                    <span>New Playlist</span>
                  </div>
                  {state.playlists.map(pl => (
                    <div
                      key={pl.id}
                      className="playlist-grid-card"
                      onClick={() => handlePlaylistOpen(pl.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        dispatch({ type: 'SET_CONTEXT_MENU', payload: { x: e.clientX, y: e.clientY, item: pl, type: 'playlist' } });
                      }}
                    >
                      <div className="playlist-grid-cover" style={{ background: pl.color }}>
                        <svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)" width="36" height="36">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                      </div>
                      <div className="album-title">{pl.name}</div>
                      <div className="album-artist">{pl.tracks.length} songs</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {state.currentView === 'charts' && (
            <div className="view-content" key="charts">
              <h1 className="page-title">Top Charts</h1>
              <div className="tracks-list">
                {allCharts.map((track, index) => (
                  <TrackCard key={track.trackId} track={track} index={index} tracks={allCharts} />
                ))}
              </div>
            </div>
          )}

          {state.currentView === 'releases' && (
            <div className="view-content" key="releases">
              <h1 className="page-title">New Releases</h1>
              <div className="albums-grid">
                {allReleases.map(album => (
                  <AlbumCard key={album.collectionId} album={album} onClick={() => handleLoadAlbum(album.collectionId)} />
                ))}
              </div>
            </div>
          )}

          {state.currentView === 'detail' && albumDetail && (
            <div className="view-content" key="detail">
              <div className="detail-header">
                <img
                  className="detail-cover"
                  src={getHighResArtwork(albumDetail.album.artworkUrl100, 600)}
                  alt={albumDetail.album.collectionName}
                />
                <div className="detail-info">
                  <span className="detail-type">Album</span>
                  <h1 className="detail-title">{albumDetail.album.collectionName}</h1>
                  <p className="detail-artist">{albumDetail.album.artistName}</p>
                  <p className="detail-meta">
                    {albumDetail.tracks.length} songs •{' '}
                    {(() => {
                      const totalMs = albumDetail.tracks.reduce((s, t) => s + (t.trackTimeMillis || 0), 0);
                      const hrs = Math.floor(totalMs / 3600000);
                      const mins = Math.floor((totalMs % 3600000) / 60000);
                      return hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;
                    })()}
                  </p>
                </div>
              </div>
              <div className="detail-actions">
                <button className="action-btn-primary" onClick={() => handlePlayAll(albumDetail.tracks)}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  Play
                </button>
                <button className={`action-btn-icon ${isLikedAlbum ? 'liked' : ''}`} onClick={handleLikeAlbum}>
                  <svg viewBox="0 0 24 24" fill={isLikedAlbum ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
              <div className="tracks-list">
                {albumDetail.tracks.map((track, index) => (
                  <TrackCard key={track.trackId} track={track} index={index} tracks={albumDetail.tracks} />
                ))}
              </div>
            </div>
          )}

          {state.currentView === 'playlistDetail' && currentPlaylist && (
            <div className="view-content" key="playlistDetail">
              <div className="detail-header">
                <div className="playlist-detail-cover" style={{ background: currentPlaylist.color }}>
                  <svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)" width="56" height="56">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
                <div className="detail-info">
                  <span className="detail-type">Playlist</span>
                  <h1 className="detail-title">{currentPlaylist.name}</h1>
                  <p className="detail-meta">{currentPlaylist.tracks.length} songs</p>
                </div>
              </div>
              <div className="detail-actions">
                <button className="action-btn-primary" onClick={() => handlePlayAll(currentPlaylist.tracks)}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  Play
                </button>
                <button className="action-btn-icon" onClick={() => setEditPlaylistId(currentPlaylist.id)}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
              </div>
              <div className="tracks-list">
                {currentPlaylist.tracks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🎵</div>
                    <h3>No songs yet</h3>
                    <p>Add songs from context menu</p>
                  </div>
                ) : (
                  currentPlaylist.tracks.map((track, index) => (
                    <TrackCard key={`${track.trackId}-${index}`} track={track} index={index} tracks={currentPlaylist.tracks} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Player />
      <MobileNav />
      <Toast />
      <ContextMenu />

      <CreatePlaylistModal
        isOpen={state.playlistModalOpen}
        onClose={() => dispatch({ type: 'SET_PLAYLIST_MODAL', payload: false })}
        onCreate={handleCreatePlaylist}
      />

      <EditPlaylistModal
        isOpen={!!editPlaylistId}
        onClose={() => setEditPlaylistId(null)}
        playlist={editPlaylist}
        onMoveTrack={(index, dir) => {
          dispatch({
            type: 'MOVE_TRACK_IN_PLAYLIST',
            payload: { playlistId: editPlaylistId, fromIndex: index, toIndex: index + dir },
          });
        }}
        onRemoveTrack={(index) => {
          dispatch({
            type: 'REMOVE_TRACK_FROM_PLAYLIST',
            payload: { playlistId: editPlaylistId, trackIndex: index },
          });
        }}
      />
    </div>
  );
}
