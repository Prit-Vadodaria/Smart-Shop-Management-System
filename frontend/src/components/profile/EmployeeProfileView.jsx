import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Shield, Settings, Briefcase, ListTodo, UserCog } from 'lucide-react';
import api from '../../shared/services/api';

const EmployeeProfileView = ({ user }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '' });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/auth/profile');
            if(data.success !== false) {
                const pData = data.data || data;
                setProfile(pData);
                setFormData({
                    name: pData.user?.name || user.name,
                    phone: pData.phone || ''
                });
            }
        } catch (err) {
            console.error("Failed to load profile", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateInfo = async (e) => {
        e.preventDefault();
        try {
            await api.put('/auth/profile', formData);
            setMessage('Profile updated successfully!');
            setIsEditingInfo(false);
            fetchProfile();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error updating profile');
        }
    };

    if (loading) return <div className="flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary-600" /></div>;

    return (
        <div className="space-y-6">
            {message && <div className="bg-blue-50 text-blue-700 p-4 rounded-xl mb-4">{message}</div>}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
                    <button onClick={() => setIsEditingInfo(!isEditingInfo)} className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                        {isEditingInfo ? 'Cancel' : 'Edit'}
                    </button>
                </div>
                <div className="p-6">
                    {isEditingInfo ? (
                        <form onSubmit={handleUpdateInfo} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input type="text" className="w-full border-gray-300 rounded-xl p-2.5 border focus:ring-primary-500 focus:border-primary-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input type="text" className="w-full border-gray-300 rounded-xl p-2.5 border focus:ring-primary-500 focus:border-primary-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="10-digit number" />
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-xs text-gray-500 italic">Note: Email addresses can only be changed by an Administrator.</p>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary py-2 px-6 rounded-xl">Save Changes</button>
                        </form>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-gray-500">Full Name</p>
                                <p className="font-semibold text-gray-900">{formData.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-semibold text-gray-900">{profile?.user?.email || user.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-semibold text-gray-900">{formData.phone || 'Not set'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">System Role</p>
                                <p className="font-semibold text-gray-900 capitalize">{profile?.user?.role || user.role}</p>
                            </div>
                            {user.role === 'employee' && (
                                <div>
                                    <p className="text-sm text-gray-500">Position</p>
                                    <p className="font-semibold text-gray-900 capitalize">{profile?.user?.employeeType || user.employeeType}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800">Security</h2>
                </div>
                <div className="p-6 flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-gray-900">Password</p>
                        <p className="text-sm text-gray-500">Keep your account secure by using a strong password.</p>
                    </div>
                    <Link to="/change-password" className="flex items-center gap-2 text-primary-600 font-semibold hover:bg-primary-50 px-4 py-2 rounded-xl transition-colors">
                        <Shield className="w-4 h-4" /> Change Password
                    </Link>
                </div>
            </div>

            {/* Role specific sections */}
            {user.role === 'admin' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                        <UserCog className="text-primary-600 w-5 h-5" />
                        <h2 className="text-xl font-bold text-gray-800">Admin Controls</h2>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-gray-600 mb-4">Manage employee permissions, roles, and store information.</p>
                        <div className="flex gap-4">
                            <Link to="/employees" className="btn-primary py-2 px-6 rounded-xl text-sm">Manage Employees</Link>
                        </div>
                    </div>
                </div>
            )}

            {user.role === 'employee' && user.employeeType === 'manager' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                        <Briefcase className="text-primary-600 w-5 h-5" />
                        <h2 className="text-xl font-bold text-gray-800">Manager Dashboard Shortcuts</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <Link to="/store-orders" className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-center">
                            <span className="block font-bold text-gray-900">Orders</span>
                            <span className="text-xs text-gray-500">Manage store orders</span>
                        </Link>
                        <Link to="/products" className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-center">
                            <span className="block font-bold text-gray-900">Inventory</span>
                            <span className="text-xs text-gray-500">Update products</span>
                        </Link>
                    </div>
                </div>
            )}

            {user.role === 'employee' && user.employeeType === 'staff' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                        <ListTodo className="text-primary-600 w-5 h-5" />
                        <h2 className="text-xl font-bold text-gray-800">Assigned Tasks</h2>
                    </div>
                    <div className="p-6">
                        {profile?.assignedTasks?.length > 0 ? (
                            <ul className="list-disc pl-5 text-gray-700">
                                {profile.assignedTasks.map((task, idx) => (
                                    <li key={idx} className="mb-2">{task}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic">No assigned tasks currently.</p>
                        )}
                        <div className="mt-6">
                            <Link to="/store-orders" className="btn-primary py-2 px-6 rounded-xl text-sm inline-block">View Orders Desk</Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeProfileView;
