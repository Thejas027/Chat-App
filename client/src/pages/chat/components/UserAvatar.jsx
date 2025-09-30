import PropTypes from 'prop-types';
import { DEFAULT_AVATAR } from '../../../assets/defaultAvatar';
import { API_BASE_URL } from '../../../services/api';
import { useState, useEffect } from 'react';

const normalizeSrc = (src) => {
  if (!src) return DEFAULT_AVATAR;
  // If src already absolute (http/https/data), return as is
  if (/^(?:https?:)?\/\//.test(src) || src.startsWith('data:')) return src;
  // Ensure it has server base
  return `${API_BASE_URL}${src.startsWith('/') ? src : `/${src}`}`;
};

const UserAvatar = ({ 
  src, 
  alt = 'User Avatar', 
  size = 'medium',
  status = null,
  className = '',
  initials = null,
  lastSeen = null,
  showStatusAnimation = true,
  showPresence = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Handle image load effect
  useEffect(() => {
    setIsLoaded(false);
    const img = new Image();
    img.src = normalizeSrc(src);
    img.onload = () => setIsLoaded(true);
  }, [src]);

  const sizeClasses = {
    tiny: 'w-6 h-6 text-xs',
    small: 'w-8 h-8 text-sm',
    medium: 'w-12 h-12 text-base', 
    large: 'w-16 h-16 text-lg',
    xlarge: 'w-20 h-20 text-xl',
    xxlarge: 'w-24 h-24 text-2xl'
  };

  const statusSizeClasses = {
    tiny: 'w-2 h-2 -bottom-0 -right-0',
    small: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    medium: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5', 
    large: 'w-4 h-4 -bottom-1 -right-1',
    xlarge: 'w-5 h-5 -bottom-1 -right-1',
    xxlarge: 'w-6 h-6 -bottom-1 -right-1'
  };

  const statusColors = {
    online: 'bg-gradient-to-br from-green-400 to-green-500',
    offline: 'bg-gradient-to-br from-gray-400 to-gray-500',
    away: 'bg-gradient-to-br from-yellow-300 to-yellow-400',
    busy: 'bg-gradient-to-br from-red-400 to-red-500',
    typing: 'bg-gradient-to-br from-blue-400 to-blue-500'
  };

  const statusPulseClasses = {
    online: showStatusAnimation ? 'animate-pulse-slow' : '',
    typing: 'animate-pulse-fast'
  };
  
  const getStatusTitle = () => {
    if (status === 'online') return 'Online';
    if (status === 'typing') return 'Typing...';
    if (status === 'offline' && lastSeen) {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffInMinutes = (now - lastSeenDate) / (1000 * 60);
      
      if (diffInMinutes < 1) {
        return 'Last seen just now';
      } else if (diffInMinutes < 60) {
        const mins = Math.floor(diffInMinutes);
        return `Last seen ${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffInMinutes < 24 * 60) {
        const hours = Math.floor(diffInMinutes / 60);
        return `Last seen ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffInMinutes < 7 * 24 * 60) {
        const days = Math.floor(diffInMinutes / (24 * 60));
        return `Last seen ${days} ${days === 1 ? 'day' : 'days'} ago`;
      } else {
        // Check if it's the current year
        const currentYear = now.getFullYear();
        const lastSeenYear = lastSeenDate.getFullYear();
        
        const options = { 
          month: 'short', 
          day: 'numeric',
          ...(currentYear !== lastSeenYear && { year: 'numeric' })
        };
        
        return `Last seen on ${lastSeenDate.toLocaleDateString(undefined, options)} at ${lastSeenDate.toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}`;
      }
    }
    return status ? `Status: ${status}` : '';
  };

  return (
    <div 
      className={`relative inline-block ${className}`} 
      title={getStatusTitle()}
    >
      <div className={`
        relative overflow-hidden 
        ${sizeClasses[size]} 
        rounded-full shadow-md 
        transition-all duration-300 transform
        hover:shadow-lg hover:scale-105
      `}>
        {src || DEFAULT_AVATAR ? (
          <>
            <div className={`
              absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-300 
              animate-pulse rounded-full
              ${isLoaded ? 'opacity-0' : 'opacity-100'}
              transition-opacity duration-300
            `}/>
            <img
              src={normalizeSrc(src)}
              alt={alt}
              onLoad={() => setIsLoaded(true)}
              className={`
                w-full h-full rounded-full object-cover 
                border-2 border-white/80 shadow-inner
                transition-all duration-300
                ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                hover:border-blue-300 
              `}
              style={{
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.07)'
              }}
            />
          </>
        ) : (
          <div className={`
            w-full h-full rounded-full 
            bg-gradient-to-br from-blue-500 to-blue-700
            flex items-center justify-center text-white font-medium
            border-2 border-white/90 shadow-inner
            transition-all duration-300
            hover:from-blue-600 hover:to-blue-800
          `}>
            {initials || alt.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      {status && showPresence && (
        <div 
          className={`
            absolute ${statusSizeClasses[size]}
            ${statusColors[status]} 
            ${statusPulseClasses[status] || ''} 
            rounded-full shadow-md
            border-2 border-white
            z-10
          `}
          aria-label={getStatusTitle()}
        />
      )}
    </div>
  );
};

UserAvatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.oneOf(['tiny', 'small', 'medium', 'large', 'xlarge', 'xxlarge']),
  status: PropTypes.oneOf(['online', 'offline', 'away', 'busy', 'typing']),
  className: PropTypes.string,
  initials: PropTypes.string,
  lastSeen: PropTypes.string,
  showStatusAnimation: PropTypes.bool,
  showPresence: PropTypes.bool
};

export default UserAvatar;
