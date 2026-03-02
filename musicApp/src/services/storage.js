const STORAGE_KEY = 'musica_library_v5';
const PLAYLISTS_KEY = 'musica_playlists_v5';

export function loadLibrary() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!data) return { likedSongs: new Map(), likedAlbums: new Map() };
        return {
            likedSongs: new Map(data.likedSongs || []),
            likedAlbums: new Map(data.likedAlbums || []),
        };
    } catch {
        return { likedSongs: new Map(), likedAlbums: new Map() };
    }
}

export function saveLibrary(library) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            likedSongs: Array.from(library.likedSongs.entries()),
            likedAlbums: Array.from(library.likedAlbums.entries()),
        }));
    } catch { }
}

export function loadPlaylists() {
    try {
        return JSON.parse(localStorage.getItem(PLAYLISTS_KEY)) || [];
    } catch {
        return [];
    }
}

export function savePlaylists(playlists) {
    try {
        localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    } catch { }
}
