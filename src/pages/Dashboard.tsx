import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { checkAndCloseDiscussion, isDiscussionActive } from '../lib/discussionUtils';
import { NotificationDropdown } from '../components/NotificationDropdown';
import { Plus, MessageSquare, LogOut, Clock, AlertCircle, Users, Shield, CheckCircle, Archive } from 'lucide-react';

interface Discussion {
  id: string;
  owner_id: string;
  title: string;
  prompt: string;
  start_date: string;
  deadline_at: string | null;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'closed';
  results_summary: string | null;
  created_at: string;
  participant_count?: number;
  response_count?: number;
  user_responded?: boolean;
}

export const Dashboard = ({ onCreateDiscussion, onViewDiscussion, onAdminPanel }: {
  onCreateDiscussion: () => void;
  onViewDiscussion: (id: string) => void;
  onAdminPanel?: () => void;
}) => {
  const { user, signOut, isAdmin } = useAuth();
  const [pendingDiscussions, setPendingDiscussions] = useState<Discussion[]>([]);
  const [activeDiscussions, setActiveDiscussions] = useState<Discussion[]>([]);
  const [pastDiscussions, setPastDiscussions] = useState<Discussion[]>([]);
  const [scheduledDiscussions, setScheduledDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'past' | 'scheduled'>('active');
  const [showPendingSection, setShowPendingSection] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDiscussions();
    }
  }, [user]);

  const fetchDiscussions = async () => {
    if (!user) return;

    try {
      const { data: ownedDiscussions, error: ownedError } = await supabase
        .from('discussions')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (ownedError) throw ownedError;

      const { data: participantData, error: participantError } = await supabase
        .from('discussion_participants')
        .select('discussion_id, responded')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      const participantMap = new Map(participantData.map((p) => [p.discussion_id, p.responded]));
      const participantDiscussionIds = Array.from(participantMap.keys());

      let participatedDiscussions: any[] = [];
      if (participantDiscussionIds.length > 0) {
        const { data, error } = await supabase
          .from('discussions')
          .select('*')
          .in('id', participantDiscussionIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        participatedDiscussions = data || [];
      }

      const allDiscussions = [...(ownedDiscussions || []), ...participatedDiscussions];
      const uniqueDiscussions = Array.from(
        new Map(allDiscussions.map((d) => [d.id, d])).values()
      );

      for (const discussion of uniqueDiscussions) {
        if (discussion.status === 'open') {
          await checkAndCloseDiscussion(discussion.id);
        }
      }

      const { data: refreshedDiscussions } = await supabase
        .from('discussions')
        .select('*')
        .in('id', uniqueDiscussions.map((d) => d.id));

      const discussionsWithCounts = await Promise.all(
        (refreshedDiscussions || []).map(async (discussion) => {
          const [{ count: participantCount }, { count: responseCount }] = await Promise.all([
            supabase
              .from('discussion_participants')
              .select('*', { count: 'exact', head: true })
              .eq('discussion_id', discussion.id),
            supabase
              .from('responses')
              .select('*', { count: 'exact', head: true })
              .eq('discussion_id', discussion.id),
          ]);

          return {
            ...discussion,
            participant_count: participantCount || 0,
            response_count: responseCount || 0,
            user_responded: participantMap.get(discussion.id) || false,
          };
        })
      );

      const pending: Discussion[] = [];
      const active: Discussion[] = [];
      const past: Discussion[] = [];
      const scheduled: Discussion[] = [];

      discussionsWithCounts.forEach((d) => {
        if (!isDiscussionActive(d.start_date)) {
          if (d.owner_id === user.id) {
            scheduled.push(d);
          }
        } else if (d.status === 'closed') {
          past.push(d);
        } else if (d.user_responded || d.owner_id === user.id) {
          active.push(d);
        } else {
          pending.push(d);
        }
      });

      setPendingDiscussions(pending);
      setActiveDiscussions(active);
      setPastDiscussions(past);
      setScheduledDiscussions(scheduled);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (diff < 0) return 'Expired';
    if (days > 0) return `${days}d left`;
    return `${hours}h left`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Consensus Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              {isAdmin && onAdminPanel && (
                <button
                  onClick={onAdminPanel}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                  title="Admin Panel"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                </button>
              )}
              {user && <NotificationDropdown userId={user.id} />}
              <button
                onClick={signOut}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Discussions</h2>
          <button
            onClick={onCreateDiscussion}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            <span>New Discussion</span>
          </button>
        </div>

        <div className="mb-6">
          <div className="flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-3 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'active'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Active ({activeDiscussions.length + pendingDiscussions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-3 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'past'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Past ({pastDiscussions.length})</span>
            </button>
            {scheduledDiscussions.length > 0 && (
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`px-4 py-3 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'scheduled'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Scheduled ({scheduledDiscussions.length})</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-600">Loading...</div>
          </div>
        ) : (() => {
            if (activeTab === 'active') {
              const hasPending = pendingDiscussions.length > 0;
              const hasActive = activeDiscussions.length > 0;

              if (!hasPending && !hasActive) {
                return (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No discussions yet</h3>
                    <p className="text-gray-600 mb-4">Create your first discussion to get started</p>
                    <button
                      onClick={onCreateDiscussion}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Create Discussion
                    </button>
                  </div>
                );
              }

              const renderDiscussionCard = (discussion: Discussion) => {
              const isScheduled = !isDiscussionActive(discussion.start_date);
              return (
                <div
                  key={discussion.id}
                  onClick={() => !isScheduled && onViewDiscussion(discussion.id)}
                  className={`rounded-lg shadow hover:shadow-md transition p-6 ${
                    isScheduled
                      ? 'bg-gray-100 cursor-not-allowed opacity-60'
                      : 'bg-white cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={`text-lg font-semibold line-clamp-2 flex-1 ${
                      isScheduled ? 'text-gray-600' : 'text-gray-900'
                    }`}>
                      {discussion.title}
                      {isScheduled && <span className="ml-2 text-xs">(Scheduled)</span>}
                    </h3>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getUrgencyColor(
                        discussion.urgency
                      )}`}
                    >
                      {discussion.urgency.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{discussion.prompt}</p>

                  {discussion.status === 'closed' && discussion.results_summary && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                      {discussion.results_summary}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {discussion.response_count}/{discussion.participant_count}
                        </span>
                      </div>
                      {discussion.deadline_at && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDeadline(discussion.deadline_at)}</span>
                        </div>
                      )}
                    </div>
                    {discussion.status === 'closed' && (
                      <Archive className="w-4 h-4 text-gray-400" />
                    )}
                    {discussion.deadline_at &&
                      new Date(discussion.deadline_at) < new Date() &&
                      discussion.status === 'open' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-6">
                {hasPending && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        <span>Pending Response ({pendingDiscussions.length})</span>
                      </h3>
                      <button
                        onClick={() => setShowPendingSection(!showPendingSection)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {showPendingSection ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {showPendingSection && (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                        {pendingDiscussions.map(renderDiscussionCard)}
                      </div>
                    )}
                  </div>
                )}

                {hasActive && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Active Discussions ({activeDiscussions.length})</span>
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {activeDiscussions.map(renderDiscussionCard)}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          const currentDiscussions =
            activeTab === 'past' ? pastDiscussions : scheduledDiscussions;

          return currentDiscussions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab} discussions
              </h3>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentDiscussions.map((discussion) => {
                const isScheduled = !isDiscussionActive(discussion.start_date);
                return (
                  <div
                    key={discussion.id}
                    onClick={() => !isScheduled && onViewDiscussion(discussion.id)}
                    className={`rounded-lg shadow hover:shadow-md transition p-6 ${
                      isScheduled
                        ? 'bg-gray-100 cursor-not-allowed opacity-60'
                        : 'bg-white cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className={`text-lg font-semibold line-clamp-2 flex-1 ${
                        isScheduled ? 'text-gray-600' : 'text-gray-900'
                      }`}>
                        {discussion.title}
                        {isScheduled && <span className="ml-2 text-xs">(Scheduled)</span>}
                      </h3>
                      <span
                        className={`ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getUrgencyColor(
                          discussion.urgency
                        )}`}
                      >
                        {discussion.urgency.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{discussion.prompt}</p>

                    {discussion.status === 'closed' && discussion.results_summary && (
                      <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm font-semibold text-green-900 mb-1">Final Results:</p>
                        <p className="text-xs text-green-800">{discussion.results_summary}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>
                            {discussion.response_count}/{discussion.participant_count}
                          </span>
                        </div>
                        {discussion.deadline_at && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDeadline(discussion.deadline_at)}</span>
                          </div>
                        )}
                      </div>
                      {discussion.status === 'closed' && (
                        <Archive className="w-4 h-4 text-gray-400" />
                      )}
                      {discussion.deadline_at &&
                        new Date(discussion.deadline_at) < new Date() &&
                        discussion.status === 'open' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </main>
    </div>
  );
};
