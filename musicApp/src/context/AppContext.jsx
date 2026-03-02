import { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { loadLibrary, saveLibrary, loadPlaylists, savePlaylists } from '../services/storage';
import { generateId, shuffleArray } from '../utils/helpers';

const AppContext = createContext(null);

const initialState = {
    currentView: 'home',
    viewHistory: [],
    currentTrack: null,
    currentTrackIndex: 0,
    tracks: [],
    isPlaying: false,
    volume: 0.7,
    isMuted: false,
    previousVolume: 0.7,
    shuffleMode: false,
    repeatMode: 'off',
    shuffledIndices: [],
    library: loadLibrary(),
    playlists: loadPlaylists(),
    currentAlbumId: null,
    currentPlaylistId: null,
    toasts: [],
    contextMenu: null,
    playlistModalOpen: false,
    initialCharts: [],
    initialReleases: [],
    isLoading: true,
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_VIEW':
            return {
                ...state,
                currentView: action.payload,
                viewHistory: [...state.viewHistory, state.currentView],
            };

        case 'GO_BACK': {
            const history = [...state.viewHistory];
            const prev = history.pop() || 'home';
            return { ...state, currentView: prev, viewHistory: history };
        }

        case 'SET_CURRENT_TRACK':
            return {
                ...state,
                currentTrack: action.payload.track,
                currentTrackIndex: action.payload.index ?? 0,
                isPlaying: true,
            };

        case 'SET_TRACKS':
            return { ...state, tracks: action.payload };

        case 'SET_PLAYING':
            return { ...state, isPlaying: action.payload };

        case 'SET_VOLUME':
            return {
                ...state,
                volume: action.payload,
                isMuted: action.payload === 0,
                previousVolume: action.payload > 0 ? action.payload : state.previousVolume,
            };

        case 'TOGGLE_MUTE':
            return {
                ...state,
                isMuted: !state.isMuted,
                volume: state.isMuted ? state.previousVolume : 0,
            };

        case 'TOGGLE_SHUFFLE': {
            const newShuffle = !state.shuffleMode;
            let shuffledIndices = [];
            if (newShuffle && state.tracks.length > 0) {
                shuffledIndices = shuffleArray(
                    Array.from({ length: state.tracks.length }, (_, i) => i)
                );
                const currentPos = shuffledIndices.indexOf(state.currentTrackIndex);
                if (currentPos > 0) {
                    [shuffledIndices[0], shuffledIndices[currentPos]] = [shuffledIndices[currentPos], shuffledIndices[0]];
                }
            }
            return { ...state, shuffleMode: newShuffle, shuffledIndices };
        }

        case 'SET_REPEAT':
            return { ...state, repeatMode: action.payload };

        case 'TOGGLE_LIKE_SONG': {
            const track = action.payload;
            if (!track) return state;
            const newLib = { ...state.library, likedSongs: new Map(state.library.likedSongs) };
            if (newLib.likedSongs.has(track.trackId)) {
                newLib.likedSongs.delete(track.trackId);
            } else {
                newLib.likedSongs.set(track.trackId, track);
            }
            saveLibrary(newLib);
            return { ...state, library: newLib };
        }

        case 'TOGGLE_LIKE_ALBUM': {
            const album = action.payload;
            if (!album) return state;
            const newLib = { ...state.library, likedAlbums: new Map(state.library.likedAlbums) };
            if (newLib.likedAlbums.has(album.collectionId)) {
                newLib.likedAlbums.delete(album.collectionId);
            } else {
                newLib.likedAlbums.set(album.collectionId, album);
            }
            saveLibrary(newLib);
            return { ...state, library: newLib };
        }

        case 'CREATE_PLAYLIST': {
            const { name, color } = action.payload;
            const newPlaylists = [...state.playlists, { id: generateId(), name, color, tracks: [] }];
            savePlaylists(newPlaylists);
            return { ...state, playlists: newPlaylists };
        }

        case 'DELETE_PLAYLIST': {
            const newPlaylists = state.playlists.filter(p => p.id !== action.payload);
            savePlaylists(newPlaylists);
            return { ...state, playlists: newPlaylists };
        }

        case 'CLEAR_PLAYLIST': {
            const newPlaylists = state.playlists.map(p =>
                p.id === action.payload ? { ...p, tracks: [] } : p
            );
            savePlaylists(newPlaylists);
            return { ...state, playlists: newPlaylists };
        }

        case 'ADD_TRACK_TO_PLAYLIST': {
            const { playlistId, track } = action.payload;
            const newPlaylists = state.playlists.map(p => {
                if (p.id !== playlistId) return p;
                if (p.tracks.some(t => t.trackId === track.trackId)) return p;
                return { ...p, tracks: [...p.tracks, track] };
            });
            savePlaylists(newPlaylists);
            return { ...state, playlists: newPlaylists };
        }

        case 'ADD_TRACKS_TO_PLAYLIST': {
            const { playlistId, tracks } = action.payload;
            const newPlaylists = state.playlists.map(p => {
                if (p.id !== playlistId) return p;
                const existingIds = new Set(p.tracks.map(t => t.trackId));
                const newTracks = tracks.filter(t => !existingIds.has(t.trackId));
                return { ...p, tracks: [...p.tracks, ...newTracks] };
            });
            savePlaylists(newPlaylists);
            return { ...state, playlists: newPlaylists };
        }

        case 'REMOVE_TRACK_FROM_PLAYLIST': {
            const { playlistId, trackIndex } = action.payload;
            const newPlaylists = state.playlists.map(p => {
                if (p.id !== playlistId) return p;
                const newTracks = [...p.tracks];
                newTracks.splice(trackIndex, 1);
                return { ...p, tracks: newTracks };
            });
            savePlaylists(newPlaylists);
            return { ...state, playlists: newPlaylists };
        }

        case 'MOVE_TRACK_IN_PLAYLIST': {
            const { playlistId, fromIndex, toIndex } = action.payload;
            const newPlaylists = state.playlists.map(p => {
                if (p.id !== playlistId) return p;
                const newTracks = [...p.tracks];
                if (toIndex < 0 || toIndex >= newTracks.length) return p;
                [newTracks[fromIndex], newTracks[toIndex]] = [newTracks[toIndex], newTracks[fromIndex]];
                return { ...p, tracks: newTracks };
            });
            savePlaylists(newPlaylists);
            return { ...state, playlists: newPlaylists };
        }

        case 'SET_CURRENT_ALBUM_ID':
            return { ...state, currentAlbumId: action.payload };

        case 'SET_CURRENT_PLAYLIST_ID':
            return { ...state, currentPlaylistId: action.payload };

        case 'ADD_TOAST':
            return { ...state, toasts: [...state.toasts, action.payload] };

        case 'REMOVE_TOAST':
            return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };

        case 'SET_CONTEXT_MENU':
            return { ...state, contextMenu: action.payload };

        case 'SET_PLAYLIST_MODAL':
            return { ...state, playlistModalOpen: action.payload };

        case 'SET_INITIAL_DATA':
            return {
                ...state,
                initialCharts: action.payload.charts,
                initialReleases: action.payload.releases,
                isLoading: false,
            };

        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        default:
            return state;
    }
}

export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const audioRef = useRef(new Audio());
    const toastIdRef = useRef(0);

    const showToast = useCallback((message, type = 'default') => {
        const id = ++toastIdRef.current;
        dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
        setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3000);
    }, []);

    const navigate = useCallback((view) => {
        dispatch({ type: 'SET_VIEW', payload: view });
    }, []);

    const goBack = useCallback(() => {
        dispatch({ type: 'GO_BACK' });
    }, []);

    return (
        <AppContext.Provider value={{ state, dispatch, audioRef, showToast, navigate, goBack }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
}

export default AppContext;
