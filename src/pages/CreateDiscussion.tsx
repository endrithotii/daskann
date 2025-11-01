import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { calculateTimeRemaining } from '../lib/discussionUtils';
import { ArrowLeft, UserPlus, X } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

export const CreateDiscussion = ({ onBack, onCreated, onSuccess }: {
  onBack: () => void;
  onCreated: (id: string) => void;
  onSuccess?: () => void;
}) => {
  const { user: currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .neq('id', currentUser?.id || '')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddUser = (user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setShowUserSelect(false);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (selectedUsers.length < 2) {
        setError('Please select at least 2 participants');
        setLoading(false);
        return;
      }

      const { data: discussion, error: discussionError } = await supabase
        .from('discussions')
        .insert([
          {
            owner_id: currentUser?.id,
            title,
            prompt,
            start_date: startDate || new Date().toISOString(),
            deadline_at: deadline || null,
            urgency,
            allow_anonymous: isAnonymous,
            status: 'open',
          },
        ])
        .select()
        .single();

      if (discussionError) throw discussionError;

      const participantInserts = selectedUsers.map((user) => ({
        discussion_id: discussion.id,
        user_id: user.id,
        responded: false,
      }));

      const { error: participantsError } = await supabase
        .from('discussion_participants')
        .insert(participantInserts);

      if (participantsError) throw participantsError;

      const timeRemaining = calculateTimeRemaining(deadline);
      const urgencyText = urgency.toUpperCase();

      const notificationInserts = selectedUsers.map((user) => ({
        user_id: user.id,
        discussion_id: discussion.id,
        message: `${currentUser?.name} invited you to "${title}" - ${timeRemaining} to respond | Urgency: ${urgencyText}`,
        read: false,
      }));

      await supabase.from('notifications').insert(notificationInserts);

      if (onSuccess) {
        onSuccess();
      } else {
        onCreated(discussion.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create discussion');
    } finally {
      setLoading(false);
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Discussion</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discussion Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What would you like to discuss?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt / Question
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide details or ask a specific question..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to start immediately
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline (Optional)
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Allow anonymous responses</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Participants
            </label>
            {error && (
              <div className="mb-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {error}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full"
                >
                  <span className="text-sm">{user.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(user.id)}
                    className="hover:bg-blue-100 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            {showUserSelect ? (
              <div className="border border-gray-300 rounded max-h-48 overflow-y-auto">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleAddUser(user)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowUserSelect(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span className="text-sm">Add Participant</span>
              </button>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Discussion'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
