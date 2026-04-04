import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Search, Filter, Truck, CheckCircle, ListChecks } from 'lucide-react';

const AdminSubscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/subscriptions');
            setSubscriptions(data);
        } catch (error) {
            console.error('Error fetching subscriptions', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const filteredSubscriptions = subscriptions.filter(sub => {
        const matchStatus = statusFilter === 'All' || sub.status === statusFilter;
        const searchTarget = `${sub.customer?.name} ${sub.customer?.email} ${sub.product?.name}`.toLowerCase();
        const matchSearch = searchTarget.includes(searchTerm.toLowerCase());
        return matchStatus && matchSearch;
    });

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/subscriptions/${id}/status`, { status });
            fetchSubscriptions();
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const generateOrders = async () => {
        try {
            setGenerating(true);
            const { data } = await api.post('/subscriptions/generate-orders');
            setMessage({ type: 'success', text: data.message });
            setTimeout(() => setMessage(null), 5000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to generate orders' });
            setTimeout(() => setMessage(null), 5000);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {message && (
                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <ListChecks className="h-5 w-5" />}
                    <p className="font-bold text-sm">{message.text}</p>
                </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-primary-600" />
                    Manage Subscriptions
                </h1>
                
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <button
                        onClick={generateOrders}
                        disabled={generating}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50"
                    >
                        {generating ? (
                            <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                            <ListChecks className="h-4 w-4" />
                        )}
                        Generate Today's Orders
                    </button>

                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Search by customer or product..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none w-full pl-10 pr-8 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Paused">Paused</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 font-semibold text-gray-600 text-sm">Customer</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Product</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Plan</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSubscriptions.map(sub => (
                                <tr key={sub._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{sub.customer?.name}</div>
                                        <div className="text-sm text-gray-500">{sub.customer?.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{sub.product?.name}</div>
                                        <div className="text-sm text-gray-500">Qty: {sub.quantity}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-gray-900">{sub.frequency}</div>
                                        {sub.frequency === 'Custom days' && (
                                            <div className="text-xs text-gray-500 mt-1 max-w-[120px] truncate" title={sub.customDays?.join(', ')}>
                                                {sub.customDays?.map(d => d.substring(0,3)).join(', ')}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-400 mt-1">Start: {new Date(sub.startDate).toLocaleDateString()}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            sub.status === 'Active' ? 'bg-green-100 text-green-800 border border-green-200' : 
                                            sub.status === 'Paused' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                                            'bg-red-100 text-red-800 border border-red-200'
                                        }`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <select
                                            value={sub.status}
                                            onChange={(e) => updateStatus(sub._id, e.target.value)}
                                            className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary-500"
                                        >
                                            <option value="Active">Mark Active</option>
                                            <option value="Paused">Mark Paused</option>
                                            <option value="Cancelled">Cancel</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {filteredSubscriptions.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        No subscriptions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminSubscriptions;
