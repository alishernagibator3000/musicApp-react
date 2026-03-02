import { useApp } from '../context/AppContext';
import './Toast.css';

export default function Toast() {
    const { state } = useApp();

    return (
        <div className="toast-container">
            {state.toasts.map((toast) => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    <span className="toast-icon">
                        {toast.type === 'success' && '✓'}
                        {toast.type === 'error' && '✕'}
                        {toast.type === 'removed' && '−'}
                        {toast.type === 'default' && 'ℹ'}
                    </span>
                    <span className="toast-message">{toast.message}</span>
                </div>
            ))}
        </div>
    );
}
