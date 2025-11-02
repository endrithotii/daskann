import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { calculateTimeRemaining } from '../lib/discussionUtils';
import { ArrowLeft, UserPlus, X, Briefcase, Users as UsersIcon } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Department {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
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
  const [enableLikes, setEnableLikes] = useState(false);
  const [creatorParticipates, setCreatorParticipates] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [usersFromDepartments, setUsersFromDepartments] = useState<string[]>([]);
  const [usersFromRoles, setUsersFromRoles] = useState<string[]>([]);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [showDepartmentSelect, setShowDepartmentSelect] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [notifyBefore, setNotifyBefore] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsersFromDepartments();
  }, [selectedDepartments]);

  useEffect(() => {
    fetchUsersFromRoles();
  }, [selectedRoles]);

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
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchUsersFromDepartments = async () => {
    if (selectedDepartments.length === 0) {
      setUsersFromDepartments([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_departments')
        .select('user_id')
        .in('department_id', selectedDepartments.map(d => d.id));

      if (error) throw error;
      const userIds = data?.map(du => du.user_id) || [];
      setUsersFromDepartments(userIds);
    } catch (error) {
      console.error('Error fetching users from departments:', error);
    }
  };

  const fetchUsersFromRoles = async () => {
    if (selectedRoles.length === 0) {
      setUsersFromRoles([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role_id', selectedRoles.map(r => r.id));

      if (error) throw error;
      const userIds = data?.map(ru => ru.user_id) || [];
      setUsersFromRoles(userIds);
    } catch (error) {
      console.error('Error fetching users from roles:', error);
    }
  };

  const handleAddDepartment = (dept: Department) => {
    if (!selectedDepartments.find((d) => d.id === dept.id)) {
      setSelectedDepartments([...selectedDepartments, dept]);
    }
  };

  const handleRemoveDepartment = (deptId: string) => {
    setSelectedDepartments(selectedDepartments.filter((d) => d.id !== deptId));
  };

  const handleAddRole = (role: Role) => {
    if (!selectedRoles.find((r) => r.id === role.id)) {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleRemoveRole = (roleId: string) => {
    setSelectedRoles(selectedRoles.filter((r) => r.id !== roleId));
  };

  const getTotalParticipantCount = () => {
    const allUserIds = new Set([
      ...selectedUsers.map(u => u.id),
      ...usersFromDepartments,
      ...usersFromRoles
    ]);
    return allUserIds.size + (creatorParticipates ? 1 : 0);
  };

  const getAvailableUsers = () => {
    const assignedUserIds = new Set([...usersFromDepartments, ...usersFromRoles]);
    return users.filter(user => !assignedUserIds.has(user.id) && !selectedUsers.find(u => u.id === user.id));
  };

  const getNotificationOptions = () => {
    if (!deadline) return [];

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMinutes = (deadlineDate.getTime() - now.getTime()) / (1000 * 60);

    const options = [
      { value: 15, label: '15 minutes before' },
      { value: 30, label: '30 minutes before' },
      { value: 60, label: '1 hour before' },
      { value: 120, label: '2 hours before' },
      { value: 300, label: '5 hours before' },
      { value: 1440, label: '1 day before' }
    ];

    return options.filter(opt => opt.value < diffMinutes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const totalSelections = selectedUsers.length + selectedDepartments.length + selectedRoles.length;
      const minParticipants = creatorParticipates ? 1 : 2;
      if (totalSelections === 0 || (totalSelections < minParticipants && selectedDepartments.length === 0 && selectedRoles.length === 0)) {
        setError(`Please select at least ${minParticipants} participant${minParticipants > 1 ? 's' : ''}, department${minParticipants > 1 ? 's' : ''}, or role${minParticipants > 1 ? 's' : ''}`);
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
            is_anonymous: isAnonymous,
            enable_likes: enableLikes,
            status: 'open',
          },
        ])
        .select()
        .single();

      if (discussionError) throw discussionError;

      // Get all users from selected departments
      let departmentUserIds: string[] = [];
      if (selectedDepartments.length > 0) {
        const { data: deptUsers, error: deptError } = await supabase
          .from('user_departments')
          .select('user_id')
          .in('department_id', selectedDepartments.map(d => d.id));

        if (deptError) throw deptError;
        departmentUserIds = deptUsers?.map(du => du.user_id) || [];

        // Insert discussion_departments associations
        const deptInserts = selectedDepartments.map(dept => ({
          discussion_id: discussion.id,
          department_id: dept.id
        }));
        await supabase.from('discussion_departments').insert(deptInserts);
      }

      // Get all users from selected roles
      let roleUserIds: string[] = [];
      if (selectedRoles.length > 0) {
        const { data: roleUsers, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('role_id', selectedRoles.map(r => r.id));

        if (roleError) throw roleError;
        roleUserIds = roleUsers?.map(ru => ru.user_id) || [];

        // Insert discussion_roles associations
        const roleInserts = selectedRoles.map(role => ({
          discussion_id: discussion.id,
          role_id: role.id
        }));
        await supabase.from('discussion_roles').insert(roleInserts);
      }

      // Combine all user IDs and remove duplicates
      const allUserIds = [...new Set([
        ...selectedUsers.map(u => u.id),
        ...departmentUserIds,
        ...roleUserIds
      ])];

      const participantInserts = allUserIds.map((userId) => ({
        discussion_id: discussion.id,
        user_id: userId,
        responded: false,
      }));

      if (creatorParticipates) {
        participantInserts.push({
          discussion_id: discussion.id,
          user_id: currentUser?.id || '',
          responded: false,
        });
      }

      const { error: participantsError } = await supabase
        .from('discussion_participants')
        .insert(participantInserts);

      if (participantsError) throw participantsError;

      const timeRemaining = calculateTimeRemaining(deadline);
      const urgencyText = urgency.toUpperCase();

      const notificationInserts = allUserIds.map((userId) => ({
        user_id: userId,
        discussion_id: discussion.id,
        message: `${currentUser?.name} invited you to "${title}" - ${timeRemaining} to respond | Urgency: ${urgencyText}`,
        read: false,
      }));

      if (notificationInserts.length > 0) {
        await supabase.from('notifications').insert(notificationInserts);
      }

      if (notifyBefore > 0 && deadline) {
        const deadlineDate = new Date(deadline);
        const notifyAt = new Date(deadlineDate.getTime() - notifyBefore * 60 * 1000);

        const scheduledNotificationInserts = allUserIds.map((userId) => ({
          discussion_id: discussion.id,
          user_id: userId,
          notify_at: notifyAt.toISOString(),
          sent: false,
        }));

        if (creatorParticipates) {
          scheduledNotificationInserts.push({
            discussion_id: discussion.id,
            user_id: currentUser?.id || '',
            notify_at: notifyAt.toISOString(),
            sent: false,
          });
        }

        const { error: scheduledError } = await supabase
          .from('scheduled_notifications')
          .insert(scheduledNotificationInserts);

        if (scheduledError) {
          console.error('Error scheduling notifications:', scheduledError);
        }
      }

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

          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Allow anonymous responses</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={enableLikes}
                onChange={(e) => setEnableLikes(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable likes for comments</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={creatorParticipates}
                onChange={(e) => setCreatorParticipates(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">I want to participate in this discussion</span>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Assign Participants
              </label>
              <div className="text-sm font-semibold text-gray-900">
                Participants: {getTotalParticipantCount()}
              </div>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  setShowDepartmentSelect(!showDepartmentSelect);
                  setShowRoleSelect(false);
                  setShowUserSelect(false);
                }}
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition ${
                  showDepartmentSelect ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
                }`}
              >
                <Briefcase className="w-6 h-6 mb-2 text-green-600" />
                <span className="text-sm font-medium text-gray-700">By Department</span>
                {selectedDepartments.length > 0 && (
                  <span className="text-xs text-green-600 mt-1">{selectedDepartments.length} selected</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRoleSelect(!showRoleSelect);
                  setShowDepartmentSelect(false);
                  setShowUserSelect(false);
                }}
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition ${
                  showRoleSelect ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                }`}
              >
                <UsersIcon className="w-6 h-6 mb-2 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">By Role</span>
                {selectedRoles.length > 0 && (
                  <span className="text-xs text-purple-600 mt-1">{selectedRoles.length} selected</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUserSelect(!showUserSelect);
                  setShowDepartmentSelect(false);
                  setShowRoleSelect(false);
                }}
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition ${
                  showUserSelect ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <UserPlus className="w-6 h-6 mb-2 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Individual</span>
                {selectedUsers.length > 0 && (
                  <span className="text-xs text-blue-600 mt-1">{selectedUsers.length} selected</span>
                )}
              </button>
            </div>

            <div className="space-y-4">
              {showDepartmentSelect && (
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">SELECTED DEPARTMENTS</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedDepartments.map((dept) => (
                      <div
                        key={dept.id}
                        className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full"
                      >
                        <Briefcase className="w-3 h-3" />
                        <span className="text-sm">{dept.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDepartment(dept.id)}
                          className="hover:bg-green-100 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs font-medium text-gray-600 mb-2">AVAILABLE DEPARTMENTS</div>
                  <div className="border border-gray-300 rounded max-h-48 overflow-y-auto">
                    {departments.filter((dept) => !selectedDepartments.find((d) => d.id === dept.id)).map((dept) => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => handleAddDepartment(dept)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="font-medium text-sm">{dept.name}</div>
                      </button>
                    ))}
                    {departments.filter((dept) => !selectedDepartments.find((d) => d.id === dept.id)).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center">No more departments available</div>
                    )}
                  </div>
                </div>
              )}

              {showRoleSelect && (
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">SELECTED ROLES</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedRoles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center space-x-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full"
                      >
                        <UsersIcon className="w-3 h-3" />
                        <span className="text-sm">{role.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRole(role.id)}
                          className="hover:bg-purple-100 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs font-medium text-gray-600 mb-2">AVAILABLE ROLES</div>
                  <div className="border border-gray-300 rounded max-h-48 overflow-y-auto">
                    {roles.filter((role) => !selectedRoles.find((r) => r.id === role.id)).map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleAddRole(role)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="font-medium text-sm">{role.name}</div>
                      </button>
                    ))}
                    {roles.filter((role) => !selectedRoles.find((r) => r.id === role.id)).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center">No more roles available</div>
                    )}
                  </div>
                </div>
              )}

              {showUserSelect && (
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">SELECTED INDIVIDUAL USERS</div>
                  <div className="flex flex-wrap gap-2 mb-3">
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
                  <div className="text-xs font-medium text-gray-600 mb-2">AVAILABLE USERS</div>
                  <div className="border border-gray-300 rounded max-h-48 overflow-y-auto">
                    {getAvailableUsers().map((user) => (
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
                    {getAvailableUsers().length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center">
                        {usersFromDepartments.length > 0 || usersFromRoles.length > 0
                          ? 'All users are already assigned via departments or roles'
                          : 'No more users available'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {deadline && getNotificationOptions().length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notify Participants Before Deadline (Optional)
              </label>
              <select
                value={notifyBefore}
                onChange={(e) => setNotifyBefore(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>No notification</option>
                {getNotificationOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Participants will receive a reminder notification at the selected time before the deadline
              </p>
            </div>
          )}

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
