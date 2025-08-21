import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { usersAPI, conversationsAPI } from '../../../services/api';
import UserAvatar from './UserAvatar';

const NewChatModal = ({ isOpen, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      const res = await usersAPI.getUsers();
  // Support both {success,data:{users}} and legacy array response
  const list = Array.isArray(res?.data) ? res.data : (res?.data?.data?.users || []);
  setUsers(list);
      setLoading(false);
    };
    load();
  }, [isOpen]);

  const filtered = users.filter((u) => (u.fullName || '').toLowerCase().includes(query.trim().toLowerCase()));

  const startChat = async (userId) => {
    setLoading(true);
    const res = await conversationsAPI.findOrCreateConversation(userId);
    setLoading(false);
    const conv = res?.data?.data || res?.data;
    if (conv && conv._id) {
      onCreated?.(conv);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md sm:rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">New chat</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-3 border-b">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people..."
            className="w-full px-3 py-2 rounded-lg bg-gray-100 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : (
            <ul className="divide-y">
              {filtered.map((u) => (
                <li key={u._id} className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50" onClick={() => startChat(u._id)}>
                  <UserAvatar src={u.avatar} alt={u.fullName} size="medium" status={u.isOnline ? 'online' : 'offline'} initials={u.fullName?.[0] || '?'} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{u.fullName}</div>
                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                  </div>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="p-6 text-center text-gray-500">No users found</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

NewChatModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func,
};

export default NewChatModal;
