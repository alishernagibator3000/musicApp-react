import { useApp } from '../context/AppContext';
import './MobileNav.css';

export default function MobileNav() {
    const { state, navigate } = useApp();

    const items = [
        { id: 'home', label: 'Listen Now', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg> },
        { id: 'search', label: 'Search', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg> },
        { id: 'library', label: 'Library', icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 9h-2v3.5c0 1.38-1.12 2.5-2.5 2.5S10 15.88 10 14.5s1.12-2.5 2.5-2.5c.57 0 1.08.19 1.5.51V7h3v4z" /></svg> },
    ];

    return (
        <nav className="mobile-nav">
            {items.map(item => (
                <button
                    key={item.id}
                    className={`mobile-nav-item ${state.currentView === item.id ? 'active' : ''}`}
                    onClick={() => navigate(item.id)}
                >
                    <span className="mobile-nav-icon">{item.icon}</span>
                    <span className="mobile-nav-label">{item.label}</span>
                </button>
            ))}
        </nav>
    );
}
