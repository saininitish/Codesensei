import React, { useState, useEffect } from 'react';
import { api } from '../api.js';

const SettingsView = () => {
  const [settings, setSettings] = useState({
    displayName: '',
    email: '',
    notifications: { emailOnComplete: false, weeklyDigest: false }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    api.getSettings()
      .then(data => { setSettings(data); setLoading(false); })
      .catch(err => { console.error("Failed to load settings:", err); setLoading(false); });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      await api.updateSettings(settings);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      setSaveMessage('Failed to save settings.');
    }
    setSaving(false);
  };

  const handleChange = (field, value) => setSettings(prev => ({ ...prev, [field]: value }));

  const handleNotificationChange = (field, checked) =>
    setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [field]: checked } }));

  if (loading) return <div className="p-12 text-center text-slate-500">Loading settings...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto w-full animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Account Settings</h1>
        <p className="text-slate-400 mt-1">Manage your profile and preferences.</p>
      </header>

      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Display Name</label>
              <input type="text" value={settings.displayName} onChange={(e) => handleChange('displayName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
              <input type="email" value={settings.email} onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.notifications.emailOnComplete}
                onChange={(e) => handleNotificationChange('emailOnComplete', e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900" />
              <span className="text-slate-300">Email me when a review is complete</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.notifications.weeklyDigest}
                onChange={(e) => handleNotificationChange('weeklyDigest', e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900" />
              <span className="text-slate-300">Receive weekly progress digest</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors w-full sm:w-auto disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>
              {saveMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
