import React, { useState, useEffect, useContext } from 'react';
import api from '../shared/services/api';
import { AuthContext } from '../shared/context/AuthContext';
import {
  Users,
  UserPlus,
  Mail,
  Lock,
  KeyRound,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import PasswordStrength from '../components/PasswordStrength';
import { validatePassword } from '../shared/utils/passwordValidation';

const defaultForm = {
  name: '',
  email: '',
  password: '',
  employeeType: 'staff',
};

const Employees = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(null);

  const showToast = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/employees');
      setEmployees(data.data || []);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const validation = validatePassword(formData.password);
    if (!validation.valid) {
      showToast('error', validation.message);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/employees', formData);
      showToast('success', 'Employee account created successfully');
      setFormData(defaultForm);
      setShowCreateModal(false);
      fetchEmployees();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePositionChange = async (employee, employeeType) => {
    const id = employee._id || employee.id;
    try {
      await api.put(`/auth/employees/${id}/position`, { employeeType });
      showToast('success', `Position updated to ${employeeType}`);
      fetchEmployees();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update position');
    }
  };

  const handleToggleStatus = async (employee) => {
    const id = employee._id || employee.id;
    if (id === currentUser?.id) {
      showToast('error', 'You cannot deactivate your own account');
      return;
    }
    setStatusUpdating(id);
    try {
      await api.put(`/auth/employees/${id}/status`, {
        isActive: !employee.isActive,
      });
      showToast(
        'success',
        `Account ${employee.isActive ? 'deactivated' : 'activated'} successfully`
      );
      fetchEmployees();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  const openResetModal = (employee) => {
    setResetTarget(employee);
    setNewPassword('');
    setShowResetModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      showToast('error', validation.message);
      return;
    }
    const id = resetTarget._id || resetTarget.id;
    setSubmitting(true);
    try {
      await api.put(`/auth/employees/${id}/reset-password`, { newPassword });
      showToast('success', 'Password reset successfully');
      setShowResetModal(false);
      setResetTarget(null);
      setNewPassword('');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border backdrop-blur-sm ${
              message.type === 'success'
                ? 'bg-green-50/80 text-green-800 border-green-200'
                : 'bg-red-50/80 text-red-800 border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <p className="font-medium text-sm">{message.text}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
              <Users className="h-9 w-9 text-primary-600" />
              Employee Management
            </h1>
            <p className="mt-2 text-slate-500 text-sm max-w-xl">
              Create store team accounts as Manager or Staff. The system has one admin only
              (bootstrapped at setup); new accounts are always employees.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all"
          >
            <UserPlus className="h-5 w-5" />
            Add Employee
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Internal Employees
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{employees.length}</p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active
            </p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {employees.filter((e) => e.isActive).length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Inactive
            </p>
            <p className="text-3xl font-bold text-amber-600 mt-1">
              {employees.filter((e) => !e.isActive).length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">Team Directory</h2>
            <button
              type="button"
              onClick={fetchEmployees}
              className="text-slate-500 hover:text-primary-600 p-2 rounded-lg hover:bg-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {employees.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">No internal employees yet</p>
              <p className="text-sm mt-1">Create your first employee to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.map((emp) => {
                    const id = emp._id || emp.id;
                    const isSelf = id === currentUser?.id;
                    return (
                      <tr key={id} className="hover:bg-primary-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-900">{emp.name}</span>
                          {isSelf && (
                            <span className="ml-2 text-[10px] font-bold uppercase bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {emp.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={emp.employeeType || 'staff'}
                            onChange={(e) => handlePositionChange(emp, e.target.value)}
                            className={`text-xs font-bold capitalize rounded-lg border px-2 py-1 outline-none focus:ring-2 focus:ring-primary-500 ${
                              emp.employeeType === 'manager'
                                ? 'bg-violet-50 border-violet-200 text-violet-700'
                                : 'bg-sky-50 border-sky-200 text-sky-700'
                            }`}
                          >
                            <option value="manager">Manager</option>
                            <option value="staff">Staff</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                              emp.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {emp.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openResetModal(emp)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              Reset Password
                            </button>
                            <button
                              type="button"
                              disabled={isSelf || statusUpdating === id}
                              onClick={() => handleToggleStatus(emp)}
                              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                                emp.isActive ? 'bg-primary-600' : 'bg-slate-300'
                              }`}
                              title={
                                isSelf
                                  ? 'Cannot change your own status'
                                  : emp.isActive
                                    ? 'Deactivate'
                                    : 'Activate'
                              }
                            >
                              <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  emp.isActive ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary-600" />
                New Internal User
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="employee@shop.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Strong password"
                  />
                </div>
                <PasswordStrength password={formData.password} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Position</label>
                <select
                  value={formData.employeeType}
                  onChange={(e) => setFormData({ ...formData, employeeType: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none capitalize"
                >
                  <option value="staff">Staff — assigned orders &amp; cashier tasks</option>
                  <option value="manager">Manager — all orders, assign staff, customers</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary py-2.5 disabled:opacity-60"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetModal && resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary-600" />
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Set a new password for <strong className="text-slate-800">{resetTarget.name}</strong>{' '}
              ({resetTarget.email})
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Strong password"
                />
                <PasswordStrength password={newPassword} />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary py-2.5 disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
