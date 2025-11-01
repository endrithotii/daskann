import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Users as UsersIcon, UserPlus, Briefcase } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  user_roles?: Array<{
    roles: {
      key: string;
    };
  }>;
}

interface Role {
  id: string;
  key: string;
}

interface Team {
  id: string;
  name: string;
  department_id: string | null;
}

interface Department {
  id: string;
  name: string;
}

export const AdminDashboard = ({ onBack }: { onBack: () => void }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'teams'>('users');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedUserForTeam, setSelectedUserForTeam] = useState<string>('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes, teamsRes, deptsRes] = await Promise.all([
        supabase.from('users').select(`
          *,
          user_roles(
            roles(key)
          )
        `).order('created_at', { ascending: false }),
        supabase.from('roles').select('*'),
        supabase.from('teams').select('*'),
        supabase.from('departments').select('*'),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (teamsRes.error) throw teamsRes.error;
      if (deptsRes.error) throw deptsRes.error;

      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
      setTeams(teamsRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      setError('Please select both user and role');
      return;
    }

    setError('');
    setMessage('');

    try {
      await supabase.from('user_roles').delete().eq('user_id', selectedUser);

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([{ user_id: selectedUser, role_id: selectedRole }]);

      if (insertError) throw insertError;

      setMessage('Role assigned successfully!');
      setSelectedUser(null);
      setSelectedRole('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to assign role');
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const { error } = await supabase
        .from('departments')
        .insert([{ name: newDepartmentName }]);

      if (error) throw error;

      setMessage('Department created successfully!');
      setNewDepartmentName('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create department');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const { error } = await supabase
        .from('teams')
        .insert([{ name: newTeamName, department_id: null }]);

      if (error) throw error;

      setMessage('Team created successfully!');
      setNewTeamName('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    }
  };

  const handleAddUserToTeam = async () => {
    if (!selectedUserForTeam || !selectedTeamId) {
      setError('Please select both user and team');
      return;
    }

    setError('');
    setMessage('');

    try {
      const { error } = await supabase
        .from('org_memberships')
        .insert([{ user_id: selectedUserForTeam, team_id: selectedTeamId }]);

      if (error) throw error;

      setMessage('User added to team successfully!');
      setSelectedUserForTeam('');
      setSelectedTeamId('');
    } catch (err: any) {
      setError(err.message || 'Failed to add user to team');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Users & Roles
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'teams'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Teams & Departments
            </button>
          </div>
        </div>

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Assign Role to User</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={selectedUser || ''}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.key}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAssignRole}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Assign Role
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <UsersIcon className="w-5 h-5" />
                  <span>All Users ({users.length})</span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {user.user_roles?.[0]?.roles?.key || 'No Role'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Department</h2>
                <form onSubmit={handleCreateDepartment} className="space-y-4">
                  <input
                    type="text"
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    placeholder="Department name"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Create Department
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Team</h2>
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Team name"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Create Team
                  </button>
                </form>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add User to Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={selectedUserForTeam}
                  onChange={(e) => setSelectedUserForTeam(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAddUserToTeam}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Add to Team
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Briefcase className="w-5 h-5" />
                  <span>Departments ({departments.length})</span>
                </h3>
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <div key={dept.id} className="p-3 border border-gray-200 rounded">
                      {dept.name}
                    </div>
                  ))}
                  {departments.length === 0 && (
                    <p className="text-gray-500 text-sm">No departments yet</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <UserPlus className="w-5 h-5" />
                  <span>Teams ({teams.length})</span>
                </h3>
                <div className="space-y-2">
                  {teams.map((team) => (
                    <div key={team.id} className="p-3 border border-gray-200 rounded">
                      {team.name}
                    </div>
                  ))}
                  {teams.length === 0 && (
                    <p className="text-gray-500 text-sm">No teams yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
