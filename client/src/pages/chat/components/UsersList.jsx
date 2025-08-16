import React from 'react';
import UserAvatar from './UserAvatar';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const UsersList = ({ users, onSelectUser, loading }) => {
  if (loading) {
    return <div className="p-4 text-center"><LoadingSpinner /></div>;
  }

  if (!users || users.length === 0) {
    return <div className="p-4 text-center text-gray-500">No users found.</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="divide-y divide-gray-200">
        {users.map(user => (
          <li
            key={user._id}
            onClick={() => onSelectUser(user)}
            className="p-3 flex items-center space-x-4 cursor-pointer hover:bg-gray-50"
          >
            <UserAvatar
              src={user.avatar}
              alt={user.fullName}
              status={user.isOnline ? 'online' : 'offline'}
              initials={user.initials}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 truncate">
                  {user.fullName}
                </h3>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {user.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UsersList;
