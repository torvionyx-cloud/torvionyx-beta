'use client';

import { useState } from 'react';

export default function ConsentPreferencesPage() {
  const [preferences, setPreferences] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('consent_preferences', JSON.stringify({ essential: true, preferences }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Consent Preferences</h1>
        <p className="text-sm text-neutral-400 mb-10">Manage how Torvionyx uses cookies on your device.</p>

        <div className="space-y-6">

          <div className="flex items-start justify-between p-6 rounded-xl border border-neutral-200 bg-neutral-50">
            <div className="pr-8">
              <h2 className="text-base font-semibold text-neutral-900 mb-1">Essential Cookies</h2>
              <p className="text-sm text-neutral-500">Required for authentication and core site functionality. These cannot be disabled as the service would not work without them.</p>
            </div>
            <div className="shrink-0">
              <span className="inline-block px-3 py-1 text-xs font-medium bg-neutral-200 text-neutral-500 rounded-full">Always on</span>
            </div>
          </div>

          <div className="flex items-start justify-between p-6 rounded-xl border border-neutral-200">
            <div className="pr-8">
              <h2 className="text-base font-semibold text-neutral-900 mb-1">Preference Cookies</h2>
              <p className="text-sm text-neutral-500">Used to remember your settings such as dark or light mode. Disabling these means your preferences will reset on each visit.</p>
            </div>
            <div className="shrink-0">
              <button
                onClick={() => setPreferences(!preferences)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${preferences ? 'bg-cyan-500' : 'bg-neutral-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${preferences ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-neutral-100 bg-neutral-50 text-sm text-neutral-500">
            We do not use advertising or tracking cookies. For full details see our{' '}
            <a href="/cookie-policy" className="text-cyan-600 hover:underline">Cookie Policy</a> and{' '}
            <a href="/privacy-policy" className="text-cyan-600 hover:underline">Privacy Policy</a>.
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold rounded-lg transition-colors"
            >
              Save preferences
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-neutral-100">
          <a href="/" className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors">← Back to Torvionyx</a>
        </div>
      </div>
    </div>
  );
}