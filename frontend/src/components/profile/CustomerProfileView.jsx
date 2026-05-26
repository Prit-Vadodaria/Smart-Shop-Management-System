import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus, Edit, Trash2, MapPin, CheckCircle, Shield } from 'lucide-react';
import api from '../../shared/services/api';
import { AuthContext } from '../../shared/context/AuthContext.jsx';

const CustomerProfileView = ({ user }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '' });
    const [addresses, setAddresses] = useState([]);
    
    // Address Form State
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addressForm, setAddressForm] = useState({
        tag: 'Home', addressLine1: '', addressLine2: '',
        city: '', state: '', pincode: '', landmark: '', isDefaultDelivery: false
    });

    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/customers/profile');
            if(data.success !== false) { // data could be profile object itself based on old controller, let's handle both
                const pData = data.data || data; 
                setProfile(pData);
                setAddresses(pData.addresses || []);
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

    const { updateUser } = useContext(AuthContext);
    // after updating profile, sync auth context and refetch profile
    const handleUpdateInfo = async (e) => {
      e.preventDefault();
      // Ensure phone field has a valid value for backend validation
      const payload = {
        ...formData,
        phone: formData.phone && formData.phone.trim() !== '' ? formData.phone : 'Not provided',
      };
      try {
        const response = await api.put('/customers/profile', payload);
        if (!response.data.success) {
          throw new Error(response.data.message || 'Error updating profile');
        }
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        setIsEditingInfo(false);
        // Update global auth context user name
        updateUser(prev => ({ ...prev, name: payload.name }));
        fetchProfile();
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } catch (err) {
        setMessage({ text: err.message || 'Error updating profile', type: 'error' });
      }
    };

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAddressId) {
                await api.put(`/customers/address/${editingAddressId}`, addressForm);
                setMessage({ text: 'Address updated!', type: 'success' });
            } else {
                await api.post('/customers/address', addressForm);
                setMessage({ text: 'Address added!', type: 'success' });
            }
            setShowAddressForm(false);
            setEditingAddressId(null);
            fetchProfile();
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Error saving address', type: 'error' });
        }
    };

    const handleDeleteAddress = async (id) => {
        if(!window.confirm("Are you sure you want to delete this address?")) return;
        try {
            await api.delete(`/customers/address/${id}`);
            setMessage({ text: 'Address deleted', type: 'success' });
            fetchProfile();
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: 'Error deleting address', type: 'error' });
        }
    };

    const handleSetDefaultDelivery = async (id) => {
        try {
            await api.put(`/customers/address/${id}/default-delivery`);
            setMessage({ text: 'Default delivery address updated', type: 'success' });
            fetchProfile();
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: 'Error setting default delivery', type: 'error' });
        }
    };

    const openAddressForm = (addr = null) => {
        if (addr) {
            setEditingAddressId(addr._id);
            setAddressForm({
                tag: addr.tag || 'Home',
                addressLine1: addr.addressLine1 || '',
                addressLine2: addr.addressLine2 || '',
                city: addr.city || '',
                state: addr.state || '',
                pincode: addr.pincode || '',
                landmark: addr.landmark || '',
                isDefaultDelivery: addr.isDefaultDelivery || false
            });
        } else {
            setEditingAddressId(null);
            setAddressForm({
                tag: 'Home', fullName: '', phoneNumber: '', addressLine1: '', addressLine2: '',
                city: '', state: '', pincode: '', landmark: '', isDefaultDelivery: false
            });
        }
        setShowAddressForm(true);
    };

    if (loading) return <div className="flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary-600" /></div>;

    return (
        <div className="space-y-6">
            {message.text && (
                <div className={`p-4 rounded-xl mb-4 text-sm font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                    {message.text}
                </div>
            )}

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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" className="w-full border-gray-200 bg-gray-50 text-gray-500 rounded-xl p-2.5 border cursor-not-allowed" value={profile?.user?.email || user.email} disabled />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input type="text" className="w-full border-gray-300 rounded-xl p-2.5 border focus:ring-primary-500 focus:border-primary-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="10-digit number" />
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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800">Address Book</h2>
                    {!showAddressForm && (
                        <button onClick={() => openAddressForm()} className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
                            <Plus className="w-4 h-4" /> Add Address
                        </button>
                    )}
                </div>
                <div className="p-6">
                    {showAddressForm ? (
                        <form onSubmit={handleAddressSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4">{editingAddressId ? 'Edit Address' : 'New Address'}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
                                    <select className="w-full border-gray-300 rounded-xl p-2.5 border" value={addressForm.tag} onChange={e => setAddressForm({...addressForm, tag: e.target.value})}>
                                        <option value="Home">Home</option>
                                        <option value="Office">Office</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>

                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1*</label>
                                    <input type="text" required className="w-full border-gray-300 rounded-xl p-2.5 border" value={addressForm.addressLine1} onChange={e => setAddressForm({...addressForm, addressLine1: e.target.value})} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                                    <input type="text" className="w-full border-gray-300 rounded-xl p-2.5 border" value={addressForm.addressLine2} onChange={e => setAddressForm({...addressForm, addressLine2: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City*</label>
                                    <input type="text" required className="w-full border-gray-300 rounded-xl p-2.5 border" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State*</label>
                                    <input type="text" required className="w-full border-gray-300 rounded-xl p-2.5 border" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode*</label>
                                    <input type="text" required className="w-full border-gray-300 rounded-xl p-2.5 border" value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                                    <input type="text" className="w-full border-gray-300 rounded-xl p-2.5 border" value={addressForm.landmark} onChange={e => setAddressForm({...addressForm, landmark: e.target.value})} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="isDefaultDelivery" checked={addressForm.isDefaultDelivery} onChange={e => setAddressForm({...addressForm, isDefaultDelivery: e.target.checked})} className="rounded text-primary-600 focus:ring-primary-500" />
                                    <label htmlFor="isDefaultDelivery" className="text-sm font-medium text-gray-700">Set as Default Delivery</label>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="btn-primary py-2 px-6 rounded-xl">Save Address</button>
                                <button type="button" onClick={() => setShowAddressForm(false)} className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 py-2 px-6 rounded-xl font-bold transition-colors">Cancel</button>
                            </div>
                        </form>
                    ) : addresses.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                            <p>No addresses saved yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {addresses.map(addr => (
                                <div key={addr._id} className={`p-4 rounded-2xl border-2 ${addr.isDefaultDelivery ? 'border-primary-500 bg-primary-50/30' : 'border-gray-100 bg-white'} shadow-sm relative group`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">{addr.tag}</span>
                                            {addr.isDefaultDelivery && <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-full">Default Delivery</span>}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openAddressForm(addr)} className="text-gray-400 hover:text-primary-600"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteAddress(addr._id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <p className="font-bold text-gray-900">{profile?.user?.name || user?.name}</p>
                                    <p className="text-gray-600 text-sm mt-1">{addr.addressLine1}</p>
                                    {addr.addressLine2 && <p className="text-gray-600 text-sm">{addr.addressLine2}</p>}
                                    <p className="text-gray-600 text-sm">{addr.city}, {addr.state} {addr.pincode}</p>
                                    <p className="text-gray-500 text-sm mt-2">Phone: {profile?.phone || user?.phone}</p>
                                    
                                    <div className="mt-4 flex gap-3 text-sm">
                                        {!addr.isDefaultDelivery && <button onClick={() => handleSetDefaultDelivery(addr._id)} className="text-primary-600 hover:underline">Make Default Delivery</button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerProfileView;
