import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { filesAPI, usersAPI } from '../../../services/api';
import { showError } from '../../../utils/toast';
import { Button } from '../../../components/ui';

const ProfileModal = ({ isOpen, onClose, user, onUpdated }) => {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const dropRef = useRef(null);


  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const normalizeSrc = (src) => {
    if (!src) return '';
    if (/^(?:https?:)?\/\//.test(src) || src.startsWith('data:') || src.startsWith('blob:')) return src;
    return `${API_BASE}${src.startsWith('/') ? src : `/${src}`}`;
  };

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Please choose an image file');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const [isDragging, setIsDragging] = useState(false);
  
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } else if (file) {
      showError('Only image files allowed');
    }
  };

  const onRemovePhoto = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const node = dropRef.current;
    if (!node) return;
    
    const onDragEnter = (e) => { 
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };
    
    const onDragOver = (e) => { 
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
    };
    
    const onDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Only set dragging to false if we're leaving the drop target
      // and not entering a child element
      if (!e.relatedTarget || !node.contains(e.relatedTarget)) {
        setIsDragging(false);
      }
    };
    
    node.addEventListener('dragenter', onDragEnter);
    node.addEventListener('dragover', onDragOver);
    node.addEventListener('dragleave', onDragLeave);
    node.addEventListener('drop', onDrop);
    
    return () => {
      node.removeEventListener('dragenter', onDragEnter);
      node.removeEventListener('dragover', onDragOver);
      node.removeEventListener('dragleave', onDragLeave);
      node.removeEventListener('drop', onDrop);
    };
  }, [isDragging]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      showError('Name cannot be empty');
      return;
    }
    try {
      setSaving(true);
      let avatarUrl = user?.avatar || '';
      if (avatarFile) {
        const up = await filesAPI.uploadAvatar(avatarFile);
        if (!up.success) throw new Error(up.error || 'Avatar upload failed');
        avatarUrl = up.data.url;
      }
      const r = await usersAPI.updateProfile({ fullName, avatar: avatarUrl });
      if (!r.success) throw new Error(r.error || 'Failed to update');
      onUpdated?.(r.data?.data || r.data);
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Reset state when opening or when user changes
  useEffect(() => {
    if (isOpen) {
      setFullName(user?.fullName || '');
      setAvatarPreview(user?.avatar || '');
      setAvatarFile(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Edit profile</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
        <div className="px-6 py-5">
          <div 
            ref={dropRef} 
            className={`flex items-center gap-5 mb-5 p-3 rounded-xl transition-all duration-300 ${
              isDragging 
                ? 'bg-blue-50 border-2 border-dashed border-blue-300 ring-4 ring-blue-100 ring-opacity-50' 
                : 'border-2 border-transparent'
            }`}
          >
            <div className="relative">
              {/* Display user avatar with preview */}
              {avatarPreview ? (
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg">
                  <img
                    src={avatarPreview}
                    alt={user?.fullName}
                    className="w-full h-full object-cover bg-gray-100 transition-transform duration-300 hover:scale-105"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              {avatarPreview && (
                <button
                  onClick={onRemovePhoto}
                  className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-white border-2 border-red-100 shadow-md hover:bg-red-50 transition-colors duration-200 hover:scale-110 active:scale-95"
                  title="Remove photo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path d="M6 8a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" /></svg>
                </button>
              )}
            </div>
            <div className="flex-1">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm cursor-pointer text-sm transition-all duration-200 hover:shadow hover:scale-105 active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Choose a photo
                <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                <span className="inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Drag & drop an image here too
                </span>
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-1">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Your name"
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>Save changes</Button>
        </div>
      </div>
    </div>
  );
};

ProfileModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  onUpdated: PropTypes.func,
};

export default ProfileModal;
