import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../../context/AuthContext';
import { conversationsAPI } from '../../../services/api';
import UserAvatar from './UserAvatar';

const UsersSidebar = ({ onSelectUser, selectedUserId }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <aside className="w-72 bg-white border-r h-full flex flex-col">
      <div className="p-4 border-b font-bold text-lg">Users</div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>
      ) : (
        <ul className="flex-1 overflow-y-auto">
          {users.map(u => (
            <li
              key={u._id}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${selectedUserId === u._id ? 'bg-blue-100' : ''}`}
              onClick={() => onSelectUser(u)}
            >
              <UserAvatar
                src={u.avatar}
                alt={u.fullName}
                size="small"
                status={u.isOnline ? 'online' : 'offline'}
                initials={u.fullName?.split(' ').map(n => n[0]).join('') || '?'}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{u.fullName}</div>
                <div className="text-xs text-gray-400 truncate">{u.email}</div>
              </div>
              <span className={`w-2 h-2 rounded-full ${u.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

UsersSidebar.propTypes = {
  onSelectUser: PropTypes.func.isRequired,
  selectedUserId: PropTypes.string
};

export default UsersSidebar;
