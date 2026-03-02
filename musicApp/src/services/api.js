const API_BASE = 'https://itunes.apple.com';

const CONFIG = {
  DEFAULT_LIMIT: 12,
  CHART_LIMIT: 8,
  ALL_CHARTS_LIMIT: 50,
  ALL_RELEASES_LIMIT: 30,
  SEARCH_SONGS_LIMIT: 20,
  SEARCH_ALBUMS_LIMIT: 12,
};

let currentAbortController = null;

async function fetchFromAPI(endpoint, signal) {
  const response = await fetch(`${API_BASE}${endpoint}`, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function searchTracks(term, limit = CONFIG.DEFAULT_LIMIT) {
  return fetchFromAPI(`/search?term=${encodeURIComponent(term)}&entity=song&limit=${limit}`);
}

export async function searchAlbums(term, limit = CONFIG.DEFAULT_LIMIT) {
  return fetchFromAPI(`/search?term=${encodeURIComponent(term)}&entity=album&limit=${limit}`);
}

export async function lookupAlbum(albumId) {
  return fetchFromAPI(`/lookup?id=${albumId}&entity=song`);
}

export async function performFullSearch(query) {
  if (currentAbortController) currentAbortController.abort();
  currentAbortController = new AbortController();
  const signal = currentAbortController.signal;
  const encoded = encodeURIComponent(query);

  const [tracksData, albumsData] = await Promise.all([
    fetchFromAPI(`/search?term=${encoded}&entity=song&limit=${CONFIG.SEARCH_SONGS_LIMIT}`, signal),
    fetchFromAPI(`/search?term=${encoded}&entity=album&limit=${CONFIG.SEARCH_ALBUMS_LIMIT}`, signal),
  ]);

  return {
    tracks: (tracksData.results || []).filter(t => t.previewUrl),
    albums: albumsData.results || [],
  };
}

export async function loadInitialData() {
  const [chartsData, releasesData] = await Promise.all([
    searchTracks('top hits', CONFIG.CHART_LIMIT),
    searchAlbums('new music', CONFIG.DEFAULT_LIMIT),
  ]);

  return {
    charts: (chartsData.results || []).filter(t => t.previewUrl),
    releases: releasesData.results || [],
  };
}

export async function loadAllCharts() {
  const data = await searchTracks('top hits', CONFIG.ALL_CHARTS_LIMIT);
  return (data.results || []).filter(t => t.previewUrl);
}

export async function loadAllReleases() {
  const data = await searchAlbums('new music', CONFIG.ALL_RELEASES_LIMIT);
  return data.results || [];
}

export async function loadAlbumDetail(albumId) {
  const data = await lookupAlbum(albumId);
  if (!data?.results?.length) throw new Error('Album not found');
  return { album: data.results[0], tracks: data.results.slice(1).filter(t => t.previewUrl) };
}

export { CONFIG };
