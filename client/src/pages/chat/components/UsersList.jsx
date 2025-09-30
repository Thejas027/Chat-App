import React, { useState } from 'react';
import UserAvatar from './UserAvatar';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const UsersList = ({ users, onSelectUser, loading }) => {
  const [hoveredUserId, setHoveredUserId] = useState(null);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <LoadingSpinner size="medium" />
        <p className="mt-2 text-sm text-gray-500">Loading users...</p>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">No users found</p>
        <p className="text-xs text-gray-400 mt-1">Try checking your connection</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="divide-y divide-gray-100">
        {users.map(user => (
          <li
            key={user._id}
            onClick={() => onSelectUser(user)}
            onMouseEnter={() => setHoveredUserId(user._id)}
            onMouseLeave={() => setHoveredUserId(null)}
            className="p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 hover:bg-blue-50 rounded-lg"
          >
            <div className={`transition-transform ${hoveredUserId === user._id ? 'scale-105' : ''} duration-200`}>
              <UserAvatar
                src={user.avatar}
                alt={user.fullName}
                size="medium"
                status={user.isOnline ? 'online' : 'offline'}
                lastSeen={user.lastSeen}
                initials={user.fullName?.split(' ').map(n => n[0]).join('') || user.initials || '?'}
                className={hoveredUserId === user._id ? 'ring-2 ring-blue-300 ring-offset-1' : ''}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700">
                  {user.fullName}
                </h3>
                {user.isOnline && (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    Online
                  </span>
                )}
              </div>
              
              <div className="mt-1 flex items-center">
                <p className="text-xs text-gray-500 truncate">
                  {user.email || user.username || 'No contact info'}
                </p>
              </div>
            </div>
            
            <div className={`transition-opacity duration-200 ${hoveredUserId === user._id ? 'opacity-100' : 'opacity-0'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UsersList;
