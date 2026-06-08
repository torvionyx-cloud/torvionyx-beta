'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, Copy, Check, Send, TrendingUp, Clock, Eye, Zap } from 'lucide-react';

interface ProposalData {
  id: string;
  title: string;
  client_name: string;
  client_email: string | null;
  status: 'draft' | 'shared' | 'accepted' | 'declined';
  share_token: string;
  content: Array<{ type: string; text: string; heading?: string }>;
  created_at: string;
  last_viewed_at: string | null;
  view_count: number;
}

interface AnalyticsSection {
  id: string;
  name: string;
  heat: 'cold' | 'warm' | 'hot';
  duration: number;
  lastViewedAt: string | null;
  viewCount: number;
  behaviour: 'Interested' | 'Comparing' | 'Stalled' | 'Shared Internally' | 'Needs Nudge';
}

interface FollowUpSuggestion {
  id: string;
  rank: number;
  message: string;
  trigger_reason: string;
  urgency: 'low' | 'medium' | 'high';
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Follow-up state
  const [selectedSuggestion, setSelectedSuggestion] = useState<FollowUpSuggestion | null>(null);
  const [message, setMessage] = useState('');
  const [sendingState, setSendingState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [remainingFollowUps, setRemainingFollowUps] = useState(0);

  const suggestions: FollowUpSuggestion[] = [
    {
      id: '1',
      rank: 1,
      message: 'Quick check-in to see how the proposal looks.',
      trigger_reason: 'No view in 3 days',
      urgency: 'high',
    },
    {
      id: '2',
      rank: 2,
      message: 'Happy to discuss any questions or adjustments.',
      trigger_reason: 'Viewed but no engagement',
      urgency: 'medium',
    },
  ];

  useEffect(() => {
    async function fetchProposal() {
      try {
        const response = await fetch(`/api/proposals/${proposalId}`);
        if (!response.ok) throw new Error('Failed to fetch proposal');
        const data = await response.json();
        setProposal(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchProposal();
  }, [proposalId]);

  const handleCopyLink = async () => {
    if (!proposal) return;
    const shareUrl = `${window.location.origin}/p/${proposal.share_token}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = async () => {
    if (!selectedSuggestion || !message.trim()) return;

    setSendingState('sending');
    setErrorMessage('');

    try {
      const response = await fetch(`/api/proposals/${proposalId}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          suggestion_id: selectedSuggestion.id,
          trigger_reason: selectedSuggestion.trigger_reason,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      setRemainingFollowUps(data.remaining_follow_ups);
      setSendingState('sent');
      setMessage('');
      setSelectedSuggestion(null);

      setTimeout(() => setSendingState('idle'), 4000);
    } catch (err) {
      setSendingState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
        <div style={{ color: '#0F1F3D' }}>Loading proposal...</div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
        <div style={{ color: '#DC2626' }}>Error: {error || 'Proposal not found'}</div>
      </div>
    );
  }

  const statusColours: Record<string, string> = {
    draft: '#4A5568',
    shared: '#C9A84C',
    accepted: '#10B981',
    declined: '#DC2626',
  };

  const heatColours = {
    cold: '#718096',
    warm: '#F59E0B',
    hot: '#DC2626',
  };

  // Mock analytics data
  const analyticsData: AnalyticsSection[] = [
    {
      id: '1',
      name: 'Executive Summary',
      heat: 'hot',
      duration: 2.3,
      lastViewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      viewCount: 5,
      behaviour: 'Interested',
    },
    {
      id: '2',
      name: 'Scope & Deliverables',
      heat: 'warm',
      duration: 1.8,
      lastViewedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      viewCount: 3,
      behaviour: 'Comparing',
    },
    {
      id: '3',
      name: 'Pricing',
      heat: 'cold',
      duration: 0.5,
      lastViewedAt: null,
      viewCount: 0,
      behaviour: 'Stalled',
    },
  ];

  const timeAgo = (date: string | null) => {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Logo */}
          <div className="mb-6">
            <Image
              src="/logo.png"
              alt="Torvionyx"
              width={120}
              height={120}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#0F1F3D' }}>
                  {proposal.title}
                </h1>
                <span
                  className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-white"
                  style={{ backgroundColor: statusColours[proposal.status] }}
                >
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </span>
              </div>
              <p style={{ color: '#4A5568' }} className="text-sm sm:text-base">
                For: <span className="font-semibold">{proposal.client_name}</span>
              </p>
            </div>

            {/* Share Link */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: copied ? '#10B981' : '#0F1F3D',
                  color: 'white',
                  fontSize: '0.875rem',
                }}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Share
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Proposal Editor (Read-only) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-semibold mb-6" style={{ color: '#0F1F3D' }}>
                Proposal Content
              </h2>

              {proposal.content && proposal.content.length > 0 ? (
                <div className="space-y-6">
                  {proposal.content.map((block, idx) => (
                    <div key={idx} className="prose prose-sm max-w-none">
                      {block.type === 'heading' && (
                        <h3
                          className="text-lg font-semibold mb-2"
                          style={{ color: '#0F1F3D' }}
                        >
                          {block.heading || block.text}
                        </h3>
                      )}
                      {block.type === 'paragraph' && (
                        <p style={{ color: '#4A5568' }} className="text-base leading-relaxed">
                          {block.text}
                        </p>
                      )}
                      {block.type === 'list' && (
                        <ul className="list-disc list-inside space-y-2 mb-4">
                          {block.text.split('\n').map((item, i) => (
                            <li key={i} style={{ color: '#4A5568' }}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#718096' }} className="italic">
                  No content yet. Generate a proposal to see it here.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Analytics & Coach */}
          <div className="lg:col-span-1 space-y-6">
            {/* Panel 1: Closing Intelligence */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={20} style={{ color: '#0F1F3D' }} />
                <h2 className="text-lg font-semibold" style={{ color: '#0F1F3D' }}>
                  Closing Intelligence
                </h2>
              </div>

              <div className="space-y-4">
                {analyticsData.map((section) => (
                  <div key={section.id} className="border rounded-lg p-4" style={{ borderColor: '#E2E8F0' }}>
                    {/* Section Name & Heat Indicator */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 style={{ color: '#0F1F3D' }} className="font-medium">
                        {section.name}
                      </h3>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: heatColours[section.heat] }}
                        title={`Heat: ${section.heat}`}
                      />
                    </div>

                    {/* Duration Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ color: '#718096' }} className="text-xs">
                          Time spent
                        </span>
                        <span style={{ color: '#0F1F3D' }} className="text-xs font-semibold">
                          {section.duration.toFixed(1)}m
                        </span>
                      </div>
                      <div
                        className="w-full h-2 rounded-full"
                        style={{ backgroundColor: '#E2E8F0' }}
                      >
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            backgroundColor: heatColours[section.heat],
                            width: `${Math.min((section.duration / 5) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Behaviour & Metadata */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                          style={{
                            backgroundColor:
                              section.behaviour === 'Interested'
                                ? '#10B981'
                                : section.behaviour === 'Comparing'
                                  ? '#F59E0B'
                                  : section.behaviour === 'Stalled'
                                    ? '#DC2626'
                                    : '#0F1F3D',
                          }}
                        >
                          {section.behaviour}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs" style={{ color: '#718096' }}>
                        <span className="flex items-center gap-1">
                          <Eye size={14} />
                          {timeAgo(section.lastViewedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap size={14} />
                          {section.viewCount} views
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Signal Summary */}
              <div className="mt-6 pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
                <p style={{ color: '#4A5568' }} className="text-sm">
                  <span className="font-semibold">Signal:</span> Client is engaged with Executive Summary but hasn't
                  reviewed pricing yet. Consider a gentle nudge.
                </p>
              </div>
            </div>

            {/* Panel 2: Follow-Up Coach */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <Zap size={20} style={{ color: '#0F1F3D' }} />
                <h2 className="text-lg font-semibold" style={{ color: '#0F1F3D' }}>
                  Follow-Up Coach
                </h2>
              </div>

              {/* Empty State for Draft */}
              {proposal.status === 'draft' && (
                <div
                  className="p-4 rounded-lg text-center"
                  style={{ backgroundColor: '#F3F4F6', borderLeft: `4px solid #C9A84C` }}
                >
                  <p style={{ color: '#4A5568' }} className="text-sm">
                    Share your proposal first to unlock follow-up suggestions.
                  </p>
                </div>
              )}

              {/* Warning Banner: Missing Email */}
              {proposal.status !== 'draft' && !proposal.client_email && (
                <div className="mb-4 p-4 rounded-lg flex gap-3" style={{ backgroundColor: '#FEF3C7', borderLeft: `4px solid #F59E0B` }}>
                  <AlertCircle size={18} style={{ color: '#D97706' }} className="flex-shrink-0 mt-0.5" />
                  <p style={{ color: '#92400E' }} className="text-sm">
                    Client email missing — messages can't be sent. Update the client email to proceed.
                  </p>
                </div>
              )}

              {proposal.status !== 'draft' && proposal.client_email && (
                <div className="space-y-4">
                  {/* Suggestion Cards */}
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => {
                        setSelectedSuggestion(suggestion);
                        setMessage(suggestion.message);
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedSuggestion?.id === suggestion.id
                          ? 'border-blue-500'
                          : ''
                      }`}
                      style={{
                        borderColor:
                          selectedSuggestion?.id === suggestion.id ? '#3B82F6' : '#E2E8F0',
                        backgroundColor:
                          selectedSuggestion?.id === suggestion.id ? '#F0F9FF' : '#FFFFFF',
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span
                          className="text-xs font-bold uppercase tracking-wide"
                          style={{ color: '#C9A84C' }}
                        >
                          Suggestion {suggestion.rank}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium text-white ${
                            suggestion.urgency === 'high'
                              ? ''
                              : suggestion.urgency === 'medium'
                                ? ''
                                : ''
                          }`}
                          style={{
                            backgroundColor:
                              suggestion.urgency === 'high'
                                ? '#DC2626'
                                : suggestion.urgency === 'medium'
                                  ? '#F59E0B'
                                  : '#10B981',
                          }}
                        >
                          {suggestion.urgency.charAt(0).toUpperCase() +
                            suggestion.urgency.slice(1)}
                        </span>
                      </div>
                      <p style={{ color: '#4A5568' }} className="text-sm mb-2">
                        {suggestion.message}
                      </p>
                      <p style={{ color: '#718096' }} className="text-xs">
                        Trigger: {suggestion.trigger_reason}
                      </p>
                    </button>
                  ))}

                  {/* Message Textarea */}
                  {selectedSuggestion && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E2E8F0' }}>
                      <label style={{ color: '#4A5568' }} className="block text-sm font-medium mb-2">
                        Customise your message:
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors text-sm resize-none"
                        style={{
                          borderColor: '#0F1F3D',
                          color: '#4A5568',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#C9A84C';
                          e.currentTarget.style.boxShadow =
                            '0 0 0 3px rgba(201, 168, 76, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#0F1F3D';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        rows={3}
                      />

                      {/* Send Button */}
                      <button
                        onClick={handleSendMessage}
                        disabled={
                          !message.trim() ||
                          sendingState === 'sending' ||
                          (sendingState === 'sent' && remainingFollowUps <= 0)
                        }
                        className="w-full mt-3 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor:
                            sendingState === 'sent'
                              ? '#10B981'
                              : sendingState === 'error'
                                ? '#DC2626'
                                : '#0F1F3D',
                          color: 'white',
                        }}
                      >
                        {sendingState === 'idle' && (
                          <>
                            <Send size={16} />
                            Send this message
                          </>
                        )}
                        {sendingState === 'sending' && 'Sending…'}
                        {sendingState === 'sent' && (
                          <>
                            <Check size={16} />
                            Sent ✓
                          </>
                        )}
                        {sendingState === 'error' && (
                          <>
                            <AlertCircle size={16} />
                            Retry
                          </>
                        )}
                      </button>

                      {/* Error Message */}
                      {sendingState === 'error' && (
                        <p style={{ color: '#DC2626' }} className="text-xs mt-2">
                          {errorMessage}
                        </p>
                      )}

                      {/* Remaining Follow-ups */}
                      {remainingFollowUps > 0 && (
                        <p style={{ color: '#718096' }} className="text-xs mt-2">
                          {remainingFollowUps} more follow-ups available
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
