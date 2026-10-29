import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileMessage({ text: '', type: '' });
    setIsSubmittingProfile(true);

    try {
      const res = await fetch('/api/v1/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMessage({ text: 'Profile updated successfully.', type: 'success' });
      } else {
        setProfileMessage({ text: data.message || 'Failed to update profile.', type: 'error' });
      }
    } catch (err) {
      setProfileMessage({ text: 'Network error updating profile.', type: 'error' });
    } finally {
      setIsSubmittingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    if (newPassword !== passwordConfirmation) {
      setPasswordMessage({ text: 'Password confirmation does not match.', type: 'error' });
      return;
    }

    setIsSubmittingPassword(true);

    try {
      const res = await fetch('/api/v1/admin/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: passwordConfirmation,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage({ text: 'Password updated successfully.', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setPasswordConfirmation('');
      } else {
        setPasswordMessage({ text: data.message || 'Failed to update password.', type: 'error' });
      }
    } catch (err) {
      setPasswordMessage({ text: 'Network error updating password.', type: 'error' });
    } finally {
      setIsSubmittingPassword(false);
    }
  }

  return (
    <div className="admin-profile-page" style={{ padding: 'var(--space-6)', maxWidth: '720px' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)' }}>
          Profile & Security Settings
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
          Manage your administrator profile details and change your account password.
        </p>
      </header>

      {/* Profile Details Form */}
      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
          Administrator Profile
        </h2>

        {profileMessage.text && (
          <div
            role="alert"
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-4)',
              background: profileMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: profileMessage.type === 'success' ? '#166534' : '#991b1b',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {profileMessage.text}
          </div>
        )}

        <form onSubmit={handleProfileSubmit}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label
              htmlFor="profile-name"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)' }}
            >
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmittingProfile}
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label
              htmlFor="profile-email"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)' }}
            >
              Email Address
            </label>
            <input
              id="profile-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmittingProfile}
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingProfile}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--color-text-primary)',
              color: 'var(--color-bg)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: isSubmittingProfile ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmittingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </section>

      {/* Change Password Form */}
      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-6)',
        }}
      >
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
          Update Password
        </h2>

        {passwordMessage.text && (
          <div
            role="alert"
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-4)',
              background: passwordMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: passwordMessage.type === 'success' ? '#166534' : '#991b1b',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label
              htmlFor="current-password"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)' }}
            >
              Current Password
            </label>
            <input
              id="current-password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSubmittingPassword}
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label
              htmlFor="new-password"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)' }}
            >
              New Password (min 8 characters)
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmittingPassword}
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label
              htmlFor="password-confirmation"
              style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)' }}
            >
              Confirm New Password
            </label>
            <input
              id="password-confirmation"
              type="password"
              required
              minLength={8}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              disabled={isSubmittingPassword}
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingPassword}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--color-text-primary)',
              color: 'var(--color-bg)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: isSubmittingPassword ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmittingPassword ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </section>
    </div>
  );
}
