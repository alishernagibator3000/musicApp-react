import { memo } from 'react';
import { useApp } from '../context/AppContext';
import { getHighResArtwork } from '../utils/helpers';
import './AlbumCard.css';

const AlbumCard = memo(function AlbumCard({ album, onClick }) {
    const { dispatch } = useApp();

    const handleContextMenu = (e) => {
        e.preventDefault();
        dispatch({
            type: 'SET_CONTEXT_MENU',
            payload: { x: e.clientX, y: e.clientY, item: album, type: 'album' },
        });
    };

    return (
        <div className="album-card" onClick={onClick} onContextMenu={handleContextMenu}>
            <div className="album-cover-wrapper">
                <img
                    className="album-cover"
                    src={getHighResArtwork(album.artworkUrl100, 400)}
                    alt={album.collectionName}
                    loading="lazy"
                />
                <div className="album-play-overlay">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>
            <div className="album-title">{album.collectionName}</div>
            <div className="album-artist">{album.artistName}</div>
        </div>
    );
});

export default AlbumCard;
