import PropTypes from 'prop-types';
import { DEFAULT_AVATAR } from '../../../assets/defaultAvatar';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const normalizeSrc = (src) => {
  if (!src) return DEFAULT_AVATAR;
  // If src already absolute (http/https/data), return as is
  if (/^(?:https?:)?\/\//.test(src) || src.startsWith('data:')) return src;
  // Ensure it has server base
  return `${API_BASE}${src.startsWith('/') ? src : `/${src}`}`;
};

const UserAvatar = ({ 
  src, 
  alt = 'User Avatar', 
  size = 'medium',
  status = null,
  className = '',
  initials = null
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12', 
    large: 'w-16 h-16',
    xlarge: 'w-20 h-20'
  };

  const statusColors = {
    online: 'bg-green-400',
    offline: 'bg-gray-400',
    away: 'bg-yellow-400',
    busy: 'bg-red-400'
  };

  return (
    <div className={`relative inline-block ${className}`}>
    {src || DEFAULT_AVATAR ? (
        <img
      src={normalizeSrc(src)}
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-300 hover:border-blue-500 transition-colors duration-300`}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold border-2 border-gray-300 hover:border-blue-500 transition-colors duration-300`}>
          {initials || alt.charAt(0).toUpperCase()}
        </div>
      )}
      
      {status && (
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${statusColors[status]} rounded-full border-2 border-white`} />
      )}
    </div>
  );
};

UserAvatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
  status: PropTypes.oneOf(['online', 'offline', 'away', 'busy']),
  className: PropTypes.string,
  initials: PropTypes.string
};

export default UserAvatar;
