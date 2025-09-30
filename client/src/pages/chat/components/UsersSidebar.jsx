import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { conversationsAPI } from '../../../services/api';
import UserAvatar from './UserAvatar';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

// Helper function to format last seen time
const getLastSeenText = (lastSeen) => {
  if (!lastSeen) return 'Offline';
  
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffInMinutes = (now - lastSeenDate) / (1000 * 60);
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    const mins = Math.floor(diffInMinutes);
    return `${mins}m ago`;
  } else if (diffInMinutes < 24 * 60) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ago`;
  } else {
    return 'Offline';
  }
};

const UsersSidebar = ({ onSelectUser, selectedUserId }) => {
  const { user } = useAuth();
  const { userStatuses } = useSocket();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredUserId, setHoveredUserId] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const response = await conversationsAPI.getUsers();
      if (response.success && response.data?.data?.users) {
        setUsers(response.data.data.users.filter(u => u._id !== user._id));
      } else {
        setUsers([]);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [user._id]);

  // Filter users based on search query
  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
  });

  // Sort users by online status
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aOnline = userStatuses[a._id]?.isOnline || a.isOnline ? 1 : 0;
    const bOnline = userStatuses[b._id]?.isOnline || b.isOnline ? 1 : 0;
    return bOnline - aOnline;
  });

  return (
    <aside className="w-72 bg-white border-r h-full flex flex-col shadow-sm">
      <div className="p-4 border-b bg-gradient-to-r from-white to-blue-50">
        <h2 className="font-semibold text-lg text-gray-800 mb-2">Online Users</h2>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <LoadingSpinner size="medium" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {sortedUsers.length === 0 ? (
            <div className="py-8 px-4 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>No users found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              {sortedUsers.map(u => {
                const isOnline = userStatuses[u._id]?.isOnline || u.isOnline;
                return (
                  <li
                    key={u._id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
                      ${selectedUserId === u._id ? 'bg-blue-100 ring-1 ring-blue-200' : 'hover:bg-blue-50'}
                      ${hoveredUserId === u._id ? 'transform scale-[1.02]' : ''}`
                    }
                    onClick={() => onSelectUser(u)}
                    onMouseEnter={() => setHoveredUserId(u._id)}
                    onMouseLeave={() => setHoveredUserId(null)}
                  >
                    <UserAvatar
                      src={u.avatar}
                      alt={u.fullName}
                      size="small"
                      status={isOnline ? 'online' : 'offline'}
                      initials={u.fullName?.split(' ').map(n => n[0]).join('') || '?'}
                      lastSeen={userStatuses[u._id]?.lastSeen || u.lastSeen}
                      className={selectedUserId === u._id ? 'ring-2 ring-blue-300 ring-offset-1' : ''}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate text-sm ${isOnline ? 'text-gray-900' : 'text-gray-600'}`}>
                        {u.fullName}
                      </div>
                      <div className="text-xs text-gray-400 truncate flex items-center gap-1">
                        {isOnline ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Online
                          </span>
                        ) : (
                          <span>
                            {userStatuses[u._id]?.lastSeen ? (
                              getLastSeenText(userStatuses[u._id]?.lastSeen)
                            ) : (
                              'Offline'
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className={`transition-opacity duration-200 ${hoveredUserId === u._id || selectedUserId === u._id ? 'opacity-100' : 'opacity-0'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
};

UsersSidebar.propTypes = {
  onSelectUser: PropTypes.func.isRequired,
  selectedUserId: PropTypes.string
};

export default UsersSidebar;
