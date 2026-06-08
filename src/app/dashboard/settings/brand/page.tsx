'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { Upload, AlertCircle, Check, Trash2 } from 'lucide-react';

interface BrandSettings {
  id: string;
  user_id: string;
  company_name: string;
  logo_url: string | null;
  primary_colour: string;
  company_description: string;
}

interface VoiceProfile {
  id: string;
  user_id: string;
  block_additions: Record<string, number>;
  block_removals: Record<string, number>;
  length_preference: 'longer' | 'shorter' | 'same';
  length_percentage: number;
  proposals_learned: number;
  explicit_notes: string;
}

interface ToneSettings {
  id: string;
  user_id: string;
  tone_preference: 'formal' | 'balanced' | 'conversational';
}

export default function BrandSettingsPage() {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Brand settings state
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [primaryColour, setPrimaryColour] = useState('#0F1F3D');
  const [companyDescription, setCompanyDescription] = useState('');

  // Voice profile state
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [explicitNotes, setExplicitNotes] = useState('');

  // Tone settings state
  const [tonePreference, setTonePreference] = useState<'formal' | 'balanced' | 'conversational'>('balanced');

  // UI state
  const [loading, setLoading] = useState(true);
  const [savingBrand, setSavingBrand] = useState(false);
  const [savingVoice, setSavingVoice] = useState(false);
  const [savingTone, setSavingTone] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [clearingVoice, setClearingVoice] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    if (!user?.id) return;

    async function fetchSettings() {
      try {
        const [brandRes, voiceRes, toneRes] = await Promise.all([
          fetch('/api/settings/brand'),
          fetch('/api/settings/voice'),
          fetch('/api/settings/tone'),
        ]);

        if (brandRes.ok) {
          const data = await brandRes.json();
          setBrandSettings(data);
          setCompanyName(data.company_name || '');
          setLogoUrl(data.logo_url);
          setLogoPreview(data.logo_url);
          setPrimaryColour(data.primary_colour || '#0F1F3D');
          setCompanyDescription(data.company_description || '');
        }

        if (voiceRes.ok) {
          const data = await voiceRes.json();
          setVoiceProfile(data);
          setExplicitNotes(data.explicit_notes || '');
        }

        if (toneRes.ok) {
          const data = await toneRes.json();
          setTonePreference(data.tone_preference || 'balanced');
        }
      } catch (err) {
        setError('Failed to load settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [user?.id]);

  // Handle logo upload
  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setLogoUrl(data.url);
      setLogoPreview(data.url);

      await saveBrandSettings({ logo_url: data.url });
    } catch (err) {
      setError('Failed to upload logo');
      console.error(err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleLogoUpload(files[0]);
    }
  };

  // Save brand settings
  const saveBrandSettings = async (updates?: Partial<BrandSettings>) => {
    setSavingBrand(true);
    try {
      const payload = updates || {
        company_name: companyName,
        primary_colour: primaryColour,
        company_description: companyDescription,
        logo_url: logoUrl,
      };

      const response = await fetch('/api/settings/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Save failed');

      const data = await response.json();
      setBrandSettings(data);
      setSaveSuccess('Brand settings saved');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save brand settings');
      console.error(err);
    } finally {
      setSavingBrand(false);
    }
  };

  // Save voice profile
  const saveVoiceProfile = async () => {
    setSavingVoice(true);
    try {
      const response = await fetch('/api/settings/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ explicit_notes: explicitNotes }),
      });

      if (!response.ok) throw new Error('Save failed');

      const data = await response.json();
      setVoiceProfile(data);
      setSaveSuccess('Voice preferences saved');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save voice profile');
      console.error(err);
    } finally {
      setSavingVoice(false);
    }
  };

  // Clear voice profile
  const clearVoiceProfile = async () => {
    if (!confirm('Are you sure? This cannot be undone.')) return;

    setClearingVoice(true);
    try {
      const response = await fetch('/api/settings/voice', {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      setVoiceProfile(null);
      setExplicitNotes('');
      setSaveSuccess('Voice profile cleared');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setError('Failed to clear voice profile');
      console.error(err);
    } finally {
      setClearingVoice(false);
    }
  };

  // Save tone preference
  const saveTonePreference = async () => {
    setSavingTone(true);
    try {
      const response = await fetch('/api/settings/tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone_preference: tonePreference }),
      });

      if (!response.ok) throw new Error('Save failed');

      setSaveSuccess('Tone preference saved');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save tone preference');
      console.error(err);
    } finally {
      setSavingTone(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div style={{ color: '#0F1F3D' }}>Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Logo */}
        <div className="mb-8 sm:mb-12">
          <Image
            src="/logo.png"
            alt="Torvionyx"
            width={120}
            height={120}
          />
        </div>

        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#0F1F3D' }}>
          Brand settings
        </h1>
        <p style={{ color: '#4A5568' }} className="mb-8 text-base">
          Customise how your proposals look and sound.
        </p>

        {/* Success Banner */}
        {saveSuccess && (
          <div
            className="mb-6 p-4 rounded-lg flex items-center gap-3"
            style={{ backgroundColor: '#D1FAE5', borderLeft: '4px solid #10B981' }}
          >
            <Check size={20} style={{ color: '#059669' }} />
            <p style={{ color: '#065F46' }} className="text-sm">
              {saveSuccess}
            </p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div
            className="mb-6 p-4 rounded-lg flex items-center gap-3"
            style={{ backgroundColor: '#FEE2E2', borderLeft: '4px solid #DC2626' }}
          >
            <AlertCircle size={20} style={{ color: '#991B1B' }} />
            <p style={{ color: '#7F1D1D' }} className="text-sm">
              {error}
            </p>
          </div>
        )}

        {/* Section 1: Company Identity */}
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#0F1F3D' }}>
            Company Identity
          </h2>

          <div className="space-y-6">
            {/* Company Name */}
            <div>
              <label style={{ color: '#4A5568' }} className="block text-sm font-medium mb-2">
                Company name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onBlur={() => saveBrandSettings({ company_name: companyName })}
                placeholder="e.g. Acme Design Co."
                className="w-full px-4 py-2 rounded-lg border-2 transition-colors focus:outline-none text-sm sm:text-base"
                style={{
                  borderColor: '#0F1F3D',
                  color: '#4A5568',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#C9A84C';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201, 168, 76, 0.1)';
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.borderColor = '#0F1F3D';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label style={{ color: '#4A5568' }} className="block text-sm font-medium mb-2">
                Logo
              </label>

              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all"
                style={{
                  borderColor: dragActive ? '#C9A84C' : '#0F1F3D',
                  backgroundColor: dragActive ? 'rgba(201, 168, 76, 0.05)' : '#FFFFFF',
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleLogoUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {logoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-20 h-20">
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p style={{ color: '#718096' }} className="text-sm">
                      Click or drag to replace
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload size={32} style={{ color: '#0F1F3D' }} />
                    <div>
                      <p style={{ color: '#0F1F3D' }} className="font-medium text-sm sm:text-base">
                        Drop your logo here
                      </p>
                      <p style={{ color: '#718096' }} className="text-xs sm:text-sm">
                        or click to browse
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Primary Colour Picker */}
            <div>
              <label style={{ color: '#4A5568' }} className="block text-sm font-medium mb-2">
                Primary colour
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColour}
                    onChange={(e) => setPrimaryColour(e.target.value)}
                    onBlur={() => saveBrandSettings({ primary_colour: primaryColour })}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2"
                    style={{ borderColor: '#0F1F3D' }}
                  />
                  <div>
                    <p style={{ color: '#0F1F3D' }} className="font-mono text-sm font-medium">
                      {primaryColour.toUpperCase()}
                    </p>
                    <p style={{ color: '#718096' }} className="text-xs">
                      Hex code
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Description */}
            <div>
              <label style={{ color: '#4A5568' }} className="block text-sm font-medium mb-2">
                Company description
              </label>
              <p style={{ color: '#718096' }} className="text-xs sm:text-sm mb-2">
                Share your mission, values, or tagline — this helps personalise proposals.
              </p>
              <textarea
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                onBlur={() => saveBrandSettings({ company_description: companyDescription })}
                placeholder="e.g. We create beautiful, user-centred digital experiences that drive business growth."
                className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none text-sm resize-none"
                style={{
                  borderColor: '#0F1F3D',
                  color: '#4A5568',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#C9A84C';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201, 168, 76, 0.1)';
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.borderColor = '#0F1F3D';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Voice Profile */}
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#0F1F3D' }}>
            Voice Profile
          </h2>

          {voiceProfile && voiceProfile.proposals_learned >= 2 ? (
            <div className="space-y-6">
              {/* Learned Preferences */}
              <div>
                <h3 style={{ color: '#4A5568' }} className="font-medium text-sm mb-4">
                  Learnt preferences from {voiceProfile.proposals_learned} proposals:
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* Block Additions */}
                  {Object.entries(voiceProfile.block_additions).length > 0 && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
                      <p style={{ color: '#0F1F3D' }} className="font-medium text-sm mb-3">
                        Frequently added:
                      </p>
                      <div className="space-y-2">
                        {Object.entries(voiceProfile.block_additions).map(([block, count]) => (
                          <div key={block} className="flex items-center justify-between">
                            <span style={{ color: '#4A5568' }} className="text-sm">
                              {block}
                            </span>
                            <span
                              className="px-2 py-1 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: '#10B981' }}
                            >
                              +{count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Block Removals */}
                  {Object.entries(voiceProfile.block_removals).length > 0 && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
                      <p style={{ color: '#0F1F3D' }} className="font-medium text-sm mb-3">
                        Frequently removed:
                      </p>
                      <div className="space-y-2">
                        {Object.entries(voiceProfile.block_removals).map(([block, count]) => (
                          <div key={block} className="flex items-center justify-between">
                            <span style={{ color: '#4A5568' }} className="text-sm">
                              {block}
                            </span>
                            <span
                              className="px-2 py-1 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: '#DC2626' }}
                            >
                              -{count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Length Preference */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
                  <p style={{ color: '#0F1F3D' }} className="font-medium text-sm mb-2">
                    Length preference
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{
                        backgroundColor:
                          voiceProfile.length_preference === 'longer'
                            ? '#10B981'
                            : voiceProfile.length_preference === 'shorter'
                              ? '#DC2626'
                              : '#718096',
                      }}
                    >
                      {voiceProfile.length_preference.charAt(0).toUpperCase() +
                        voiceProfile.length_preference.slice(1)}
                    </span>
                    <span style={{ color: '#4A5568' }} className="text-sm">
                      ({voiceProfile.length_percentage}% confidence)
                    </span>
                  </div>
                </div>
              </div>

              {/* Heat Legend */}
              <div className="pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
                <p style={{ color: '#4A5568' }} className="text-sm font-medium mb-3">
                  Heat legend:
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: '#718096' }}
                    />
                    <span style={{ color: '#4A5568' }}>Cold</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: '#F59E0B' }}
                    />
                    <span style={{ color: '#4A5568' }}>Warm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: '#DC2626' }}
                    />
                    <span style={{ color: '#4A5568' }}>Hot</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: '#718096' }} className="text-sm italic">
              Generate and refine at least 2 proposals to unlock voice learning.
            </p>
          )}

          {/* Explicit Notes */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: '#E2E8F0' }}>
            <label style={{ color: '#4A5568' }} className="block text-sm font-medium mb-2">
              Explicit notes
            </label>
            <p style={{ color: '#718096' }} className="text-xs sm:text-sm mb-2">
              Add notes to guide proposal generation — e.g. "Always include ROI calculator" or "Never use overly casual language".
            </p>
            <textarea
              value={explicitNotes}
              onChange={(e) => setExplicitNotes(e.target.value)}
              placeholder="E.g. Always include case studies. Never mention pricing until final section."
              className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none text-sm resize-none"
              style={{
                borderColor: '#0F1F3D',
                color: '#4A5568',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#C9A84C';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201, 168, 76, 0.1)';
              }}
              onBlurCapture={(e) => {
                e.currentTarget.style.borderColor = '#0F1F3D';
                e.currentTarget.style.boxShadow = 'none';
              }}
              rows={3}
            />
            <button
              onClick={saveVoiceProfile}
              disabled={savingVoice}
              className="mt-3 px-4 py-2 rounded-lg font-medium transition-all text-sm text-white disabled:opacity-50"
              style={{ backgroundColor: savingVoice ? '#718096' : '#0F1F3D' }}
            >
              {savingVoice ? 'Saving…' : 'Save notes'}
            </button>
          </div>

          {/* Clear Voice Profile */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: '#E2E8F0' }}>
            <button
              onClick={clearVoiceProfile}
              disabled={clearingVoice || !voiceProfile}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm text-white disabled:opacity-50"
              style={{ backgroundColor: '#DC2626' }}
            >
              <Trash2 size={16} />
              {clearingVoice ? 'Clearing…' : 'Clear voice profile'}
            </button>
            <p style={{ color: '#718096' }} className="text-xs mt-2">
              Warning: This cannot be undone.
            </p>
          </div>
        </div>

        {/* Section 3: Tone Preference */}
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#0F1F3D' }}>
            Tone Preference
          </h2>

          <div className="space-y-4">
            {[
              {
                value: 'formal',
                label: 'Formal',
                description: 'Professional, structured, emphasises credentials and process.',
              },
              {
                value: 'balanced',
                label: 'Balanced',
                description: 'Clear and professional with approachable, conversational elements.',
              },
              {
                value: 'conversational',
                label: 'Conversational',
                description: 'Friendly, personable, emphasises collaboration and partnership.',
              },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all"
                style={{
                  borderColor:
                    tonePreference === option.value ? '#C9A84C' : '#E2E8F0',
                  backgroundColor:
                    tonePreference === option.value ? 'rgba(201, 168, 76, 0.05)' : '#FFFFFF',
                }}
              >
                <input
                  type="radio"
                  name="tone"
                  value={option.value}
                  checked={tonePreference === option.value}
                  onChange={(e) => {
                    setTonePreference(e.target.value as any);
                    saveTonePreference();
                  }}
                  className="mt-1 cursor-pointer"
                  style={{ accentColor: '#0F1F3D' }}
                />
                <div className="flex-1">
                  <p style={{ color: '#0F1F3D' }} className="font-medium text-sm sm:text-base">
                    {option.label}
                  </p>
                  <p style={{ color: '#718096' }} className="text-xs sm:text-sm">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {savingTone && (
            <p style={{ color: '#718096' }} className="text-sm mt-4">
              Saving…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
