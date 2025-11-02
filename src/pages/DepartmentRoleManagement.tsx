import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Plus, X, Edit2, Users, Briefcase, Shield } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserDepartment {
  user_id: string;
  department_id: string;
  users: {
    name: string;
    email: string;
  };
}

interface UserRole {
  user_id: string;
  role_id: string;
  users: {
    name: string;
    email: string;
  };
}

export const DepartmentRoleManagement = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'departments' | 'roles'>('departments');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [assigningTo, setAssigningTo] = useState<{ type: 'department' | 'role'; id: string; name: string } | null>(null);

  const [departmentForm, setDepartmentForm] = useState({ name: '', description: '' });
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userDepartments, setUserDepartments] = useState<UserDepartment[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDepartments();
    fetchRoles();
    fetchUsers();
    fetchUserDepartments();
    fetchUserRoles();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (err: any) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchUserDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('user_departments')
        .select('user_id, department_id, users(name, email)');

      if (error) throw error;
      setUserDepartments(data || []);
    } catch (err: any) {
      console.error('Error fetching user departments:', err);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role_id, users(name, email)');

      if (error) throw error;
      setUserRoles(data || []);
    } catch (err: any) {
      console.error('Error fetching user roles:', err);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('departments')
        .insert({
          name: departmentForm.name,
          description: departmentForm.description
        });

      if (error) throw error;

      setSuccess('Department created successfully!');
      setDepartmentForm({ name: '', description: '' });
      setShowDepartmentModal(false);
      fetchDepartments();
    } catch (err: any) {
      setError(err.message || 'Failed to create department');
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editingDepartment) return;

    try {
      const { error } = await supabase
        .from('departments')
        .update({
          name: departmentForm.name,
          description: departmentForm.description
        })
        .eq('id', editingDepartment.id);

      if (error) throw error;

      setSuccess('Department updated successfully!');
      setDepartmentForm({ name: '', description: '' });
      setEditingDepartment(null);
      setShowDepartmentModal(false);
      fetchDepartments();
    } catch (err: any) {
      setError(err.message || 'Failed to update department');
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department? This will remove all user assignments.')) return;

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Department deleted successfully!');
      fetchDepartments();
      fetchUserDepartments();
    } catch (err: any) {
      setError(err.message || 'Failed to delete department');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('roles')
        .insert({
          name: roleForm.name,
          description: roleForm.description
        });

      if (error) throw error;

      setSuccess('Role created successfully!');
      setRoleForm({ name: '', description: '' });
      setShowRoleModal(false);
      fetchRoles();
    } catch (err: any) {
      setError(err.message || 'Failed to create role');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editingRole) return;

    try {
      const { error } = await supabase
        .from('roles')
        .update({
          name: roleForm.name,
          description: roleForm.description
        })
        .eq('id', editingRole.id);

      if (error) throw error;

      setSuccess('Role updated successfully!');
      setRoleForm({ name: '', description: '' });
      setEditingRole(null);
      setShowRoleModal(false);
      fetchRoles();
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role? This will remove all user assignments.')) return;

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Role deleted successfully!');
      fetchRoles();
      fetchUserRoles();
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
    }
  };

  const handleAssignUsers = async () => {
    if (!assigningTo || selectedUsers.length === 0) return;

    setError('');
    setSuccess('');

    try {
      if (assigningTo.type === 'department') {
        const inserts = selectedUsers.map(userId => ({
          user_id: userId,
          department_id: assigningTo.id
        }));

        const { error } = await supabase
          .from('user_departments')
          .insert(inserts);

        if (error) throw error;
        fetchUserDepartments();
      } else {
        const inserts = selectedUsers.map(userId => ({
          user_id: userId,
          role_id: assigningTo.id
        }));

        const { error } = await supabase
          .from('user_roles')
          .insert(inserts);

        if (error) throw error;
        fetchUserRoles();
      }

      setSuccess(`Users assigned to ${assigningTo.name} successfully!`);
      setSelectedUsers([]);
      setAssigningTo(null);
      setShowAssignModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to assign users');
    }
  };

  const handleRemoveUserFromDepartment = async (userId: string, departmentId: string) => {
    try {
      const { error } = await supabase
        .from('user_departments')
        .delete()
        .eq('user_id', userId)
        .eq('department_id', departmentId);

      if (error) throw error;

      setSuccess('User removed from department!');
      fetchUserDepartments();
    } catch (err: any) {
      setError(err.message || 'Failed to remove user');
    }
  };

  const handleRemoveUserFromRole = async (userId: string, roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) throw error;

      setSuccess('User removed from role!');
      fetchUserRoles();
    } catch (err: any) {
      setError(err.message || 'Failed to remove user');
    }
  };

  const openEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    setDepartmentForm({ name: dept.name, description: dept.description });
    setShowDepartmentModal(true);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, description: role.description });
    setShowRoleModal(true);
  };

  const openAssignModal = (type: 'department' | 'role', id: string, name: string) => {
    setAssigningTo({ type, id, name });
    setSelectedUsers([]);
    setShowAssignModal(true);
  };

  const getUsersInDepartment = (departmentId: string) => {
    return userDepartments.filter(ud => ud.department_id === departmentId);
  };

  const getUsersInRole = (roleId: string) => {
    return userRoles.filter(ur => ur.role_id === roleId);
  };

  const getAvailableUsers = () => {
    if (!assigningTo) return users;

    if (assigningTo.type === 'department') {
      const assignedUserIds = userDepartments
        .filter(ud => ud.department_id === assigningTo.id)
        .map(ud => ud.user_id);
      return users.filter(u => !assignedUserIds.includes(u.id));
    } else {
      const assignedUserIds = userRoles
        .filter(ur => ur.role_id === assigningTo.id)
        .map(ur => ur.user_id);
      return users.filter(u => !assignedUserIds.includes(u.id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Department & Role Management</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('departments')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'departments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>Departments</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Roles</span>
              </div>
            </button>
          </div>
        </div>

        {activeTab === 'departments' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Departments</h2>
              <button
                onClick={() => {
                  setEditingDepartment(null);
                  setDepartmentForm({ name: '', description: '' });
                  setShowDepartmentModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                <span>Create Department</span>
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {departments.map(dept => (
                <div key={dept.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{dept.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditDepartment(dept)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Users ({getUsersInDepartment(dept.id).length})
                      </h4>
                      <button
                        onClick={() => openAssignModal('department', dept.id, dept.name)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        + Add Users
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {getUsersInDepartment(dept.id).map(ud => (
                        <div
                          key={`${ud.user_id}-${ud.department_id}`}
                          className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                        >
                          <div>
                            <div className="font-medium text-gray-900">{ud.users.name}</div>
                            <div className="text-xs text-gray-500">{ud.users.email}</div>
                          </div>
                          <button
                            onClick={() => handleRemoveUserFromDepartment(ud.user_id, dept.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {getUsersInDepartment(dept.id).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-2">No users assigned</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {departments.length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-500">
                  No departments created yet
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Roles</h2>
              <button
                onClick={() => {
                  setEditingRole(null);
                  setRoleForm({ name: '', description: '' });
                  setShowRoleModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                <span>Create Role</span>
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {roles.map(role => (
                <div key={role.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditRole(role)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Users ({getUsersInRole(role.id).length})
                      </h4>
                      <button
                        onClick={() => openAssignModal('role', role.id, role.name)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        + Add Users
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {getUsersInRole(role.id).map(ur => (
                        <div
                          key={`${ur.user_id}-${ur.role_id}`}
                          className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                        >
                          <div>
                            <div className="font-medium text-gray-900">{ur.users.name}</div>
                            <div className="text-xs text-gray-500">{ur.users.email}</div>
                          </div>
                          <button
                            onClick={() => handleRemoveUserFromRole(ur.user_id, role.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {getUsersInRole(role.id).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-2">No users assigned</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {roles.length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-500">
                  No roles created yet
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showDepartmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingDepartment ? 'Edit Department' : 'Create Department'}
            </h2>
            <form onSubmit={editingDepartment ? handleUpdateDepartment : handleCreateDepartment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={departmentForm.description}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowDepartmentModal(false);
                    setEditingDepartment(null);
                    setDepartmentForm({ name: '', description: '' });
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingDepartment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingRole ? 'Edit Role' : 'Create Role'}
            </h2>
            <form onSubmit={editingRole ? handleUpdateRole : handleCreateRole}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleModal(false);
                    setEditingRole(null);
                    setRoleForm({ name: '', description: '' });
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && assigningTo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Assign Users to {assigningTo.name}
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {getAvailableUsers().map(user => (
                <label
                  key={user.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </label>
              ))}
              {getAvailableUsers().length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  All users are already assigned
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningTo(null);
                  setSelectedUsers([]);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignUsers}
                disabled={selectedUsers.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Assign ({selectedUsers.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
