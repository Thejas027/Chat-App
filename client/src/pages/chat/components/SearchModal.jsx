import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { messagesAPI } from '../../../services/api';

const SearchModal = ({ isOpen, onClose, conversationId, onJump }) => {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setQ('');
      setResults([]);
      setLoading(false);
    }
  }, [isOpen]);

  const onSearch = async (e) => {
    e?.preventDefault();
    if (!conversationId || !q || q.trim().length < 2) return;
    setLoading(true);
    const res = await messagesAPI.search(conversationId, q.trim());
    if (res?.success) {
      const arr = res.data?.data?.messages || [];
      setResults(arr);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-6" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={onSearch} className="p-4 border-b flex gap-2">
          <input
            autoFocus
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search messages…"
            className="flex-1 border rounded px-3 py-2"
          />
          <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 && !loading ? (
            <div className="p-4 text-sm text-gray-500">Type 2+ characters and press Search.</div>
          ) : (
            results.map((m) => (
              <button
                key={m._id}
                className="w-full text-left p-3 border-b hover:bg-gray-50"
                onClick={() => { onJump?.(m._id); onClose?.(); }}
              >
                <div className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString()}</div>
                <div className="text-sm line-clamp-2">{m.content || m.attachment?.filename || '(attachment)'}</div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

SearchModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  conversationId: PropTypes.string,
  onJump: PropTypes.func,
};

export default SearchModal;
