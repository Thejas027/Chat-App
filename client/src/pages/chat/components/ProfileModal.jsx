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

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
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
    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
    node.addEventListener('dragenter', prevent);
    node.addEventListener('dragover', prevent);
    node.addEventListener('drop', onDrop);
    return () => {
      node.removeEventListener('dragenter', prevent);
      node.removeEventListener('dragover', prevent);
      node.removeEventListener('drop', onDrop);
    };
  }, []);

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
          <div ref={dropRef} className="flex items-center gap-5 mb-5">
            <div className="relative">
              <img
                src={avatarPreview || normalizeSrc(user?.avatar) || ''}
                alt={user?.fullName}
                className="w-20 h-20 rounded-full object-cover bg-gray-100 border"
              />
              {avatarPreview && (
                <button
                  onClick={onRemovePhoto}
                  className="absolute -bottom-2 -right-2 p-1 rounded-full bg-white border shadow"
                  title="Remove photo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6 8a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" /></svg>
                </button>
              )}
            </div>
            <div className="flex-1">
              <label className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer text-sm">
                Change photo
                <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
              </label>
              <p className="text-xs text-gray-500 mt-2">Drag & drop an image here too.</p>
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
