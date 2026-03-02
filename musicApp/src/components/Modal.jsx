import { useState } from 'react';
import './Modal.css';

export default function Modal({ isOpen, onClose, title, children, footer }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

const COLORS = ['#FA2D48', '#FF6B6B', '#4ECDC4', '#FFD93D', '#C44569', '#6C5CE7', '#30D158', '#5856D6'];

export function CreatePlaylistModal({ isOpen, onClose, onCreate }) {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#FA2D48');

    const handleCreate = () => {
        if (!name.trim()) return;
        onCreate(name.trim(), color);
        setName('');
        setColor('#FA2D48');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="New Playlist"
            footer={
                <>
                    <button className="modal-btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="modal-btn-primary" onClick={handleCreate} disabled={!name.trim()}>
                        Create
                    </button>
                </>
            }
        >
            <input
                className="modal-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Playlist name"
                maxLength={50}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <div className="modal-color-section">
                <label>Theme Color</label>
                <div className="modal-color-options">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            className={`modal-color-btn ${color === c ? 'active' : ''}`}
                            style={{ background: c }}
                            onClick={() => setColor(c)}
                        />
                    ))}
                </div>
            </div>
        </Modal>
    );
}

export function EditPlaylistModal({ isOpen, onClose, playlist, onMoveTrack, onRemoveTrack }) {
    if (!playlist) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit "${playlist.name}"`}>
            <div className="edit-tracks-list">
                {playlist.tracks.length === 0 ? (
                    <p className="empty-edit-text">No tracks in this playlist</p>
                ) : (
                    playlist.tracks.map((track, index) => (
                        <div key={`${track.trackId}-${index}`} className="edit-track-item">
                            <span className="edit-track-index">{index + 1}</span>
                            <span className="edit-track-name">{track.trackName}</span>
                            <div className="edit-track-actions">
                                <button
                                    className="edit-action-btn"
                                    onClick={() => onMoveTrack(index, -1)}
                                    disabled={index === 0}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" /></svg>
                                </button>
                                <button
                                    className="edit-action-btn"
                                    onClick={() => onMoveTrack(index, 1)}
                                    disabled={index === playlist.tracks.length - 1}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg>
                                </button>
                                <button className="edit-action-btn danger" onClick={() => onRemoveTrack(index)}>
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
}
