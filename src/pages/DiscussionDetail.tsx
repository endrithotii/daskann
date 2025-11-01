import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { checkAndCloseDiscussion } from '../lib/discussionUtils';
import { ArrowLeft, Clock, AlertCircle, Send, Eye, EyeOff, Users } from 'lucide-react';

interface Discussion {
  id: string;
  owner_id: string;
  title: string;
  prompt: string;
  deadline_at: string | null;
  urgency: 'low' | 'medium' | 'high';
  allow_anonymous: boolean;
  status: 'open' | 'closed';
  created_at: string;
}

interface Response {
  id: string;
  user_id: string;
  text: string;
  is_anonymous: boolean;
  created_at: string;
  users?: {
    name: string;
  };
}

export const DiscussionDetail = ({ discussionId, onBack, onViewResults }: {
  discussionId: string;
  onBack: () => void;
  onViewResults: (id: string) => void;
}) => {
  const { user } = useAuth();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [myResponse, setMyResponse] = useState('');
  const [submitAsAnonymous, setSubmitAsAnonymous] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (discussionId && user) {
      fetchDiscussion();
      fetchResponses();
      checkIfResponded();
    }
  }, [discussionId, user]);

  const fetchDiscussion = async () => {
    try {
      const { data, error } = await supabase
        .from('discussions')
        .select('*')
        .eq('id', discussionId)
        .single();

      if (error) throw error;
      setDiscussion(data);
    } catch (error) {
      console.error('Error fetching discussion:', error);
      setError('Failed to load discussion');
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('responses')
        .select(`
          *,
          users(name)
        `)
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  const checkIfResponded = async () => {
    try {
      const { data, error } = await supabase
        .from('responses')
        .select('id')
        .eq('discussion_id', discussionId)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setHasResponded(!!data);
    } catch (error) {
      console.error('Error checking response:', error);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (!myResponse.trim()) {
        setError('Please enter a response');
        setSubmitting(false);
        return;
      }

      if (discussion?.deadline_at) {
        const deadline = new Date(discussion.deadline_at);
        if (deadline < new Date()) {
          setError('The deadline for this discussion has passed');
          setSubmitting(false);
          return;
        }
      }

      const { error: responseError } = await supabase
        .from('responses')
        .insert([
          {
            discussion_id: discussionId,
            user_id: user?.id,
            text: myResponse,
            is_anonymous: submitAsAnonymous,
          },
        ]);

      if (responseError) throw responseError;

      await supabase
        .from('discussion_participants')
        .update({ responded: true })
        .eq('discussion_id', discussionId)
        .eq('user_id', user?.id);

      await checkAndCloseDiscussion(discussionId);

      setSuccess('Response submitted successfully!');
      setMyResponse('');
      setHasResponded(true);
      fetchResponses();
      fetchDiscussion();
    } catch (err: any) {
      setError(err.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const isDeadlinePassed = discussion?.deadline_at && new Date(discussion.deadline_at) < new Date();
  const canRespond = discussion?.status === 'open' && !hasResponded && !isDeadlinePassed;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Discussion not found</div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 flex-1">{discussion.title}</h1>
            <span className={`px-3 py-1 rounded text-sm font-medium ${getUrgencyColor(discussion.urgency)}`}>
              {discussion.urgency.toUpperCase()}
            </span>
          </div>

          <p className="text-gray-700 mb-6 whitespace-pre-wrap">{discussion.prompt}</p>

          <div className="flex items-center space-x-6 text-sm text-gray-600">
            {discussion.deadline_at && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>
                  Deadline: {new Date(discussion.deadline_at).toLocaleString()}
                  {isDeadlinePassed && <span className="text-red-600 ml-2">(Expired)</span>}
                </span>
              </div>
            )}
            {discussion.allow_anonymous && (
              <div className="flex items-center space-x-2">
                <EyeOff className="w-4 h-4" />
                <span>Anonymous responses allowed</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>{responses.length} responses</span>
            </div>
          </div>

          {isDeadlinePassed && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">The deadline for this discussion has passed</span>
            </div>
          )}

          {discussion.status === 'closed' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <span className="text-sm text-blue-800">This discussion is closed</span>
              <button
                onClick={() => onViewResults(discussionId)}
                className="ml-4 text-blue-600 hover:underline"
              >
                View Results
              </button>
            </div>
          )}
        </div>

        {canRespond && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Response</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmitResponse} className="space-y-4">
              <textarea
                value={myResponse}
                onChange={(e) => setMyResponse(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your response here..."
                required
              />

              {discussion.allow_anonymous && (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={submitAsAnonymous}
                    onChange={(e) => setSubmitAsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Submit anonymously</span>
                </label>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Submit Response'}</span>
              </button>
            </form>
          </div>
        )}

        {hasResponded && !canRespond && discussion.status === 'open' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded text-center">
              <p className="text-green-800">You have already submitted your response</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Responses ({responses.length})
          </h2>

          {responses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No responses yet</p>
          ) : (
            <div className="space-y-4">
              {responses.map((response) => (
                <div key={response.id} className="border border-gray-200 rounded p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    {response.is_anonymous ? (
                      <>
                        <EyeOff className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-500">Anonymous</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {response.users?.name || 'Unknown'}
                        </span>
                      </>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(response.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{response.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
