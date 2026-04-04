import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Search, Filter, Truck, CheckCircle, ListChecks, Package } from 'lucide-react';

const AdminSubscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Active');
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
        const productsStr = sub.items?.map(i => i.product?.name).join(' ') || '';
        const searchTarget = `${sub.customer?.name} ${sub.customer?.email} ${productsStr}`.toLowerCase();
        const matchSearch = searchTarget.includes(searchTerm.toLowerCase());
        return matchStatus && matchSearch;
    });

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/subscriptions/${id}/settings`, { status });
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
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
                    <Calendar className="h-8 w-8 text-primary-600" />
                    Subscription Management
                </h1>
                
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <button
                        onClick={generateOrders}
                        disabled={generating}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50"
                    >
                        {generating ? (
                            <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                            <Truck className="h-4 w-4" />
                        )}
                        Generate Today's Shipments
                    </button>

                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Search customer or item..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white shadow-sm text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="p-5 font-black uppercase tracking-widest text-[10px] text-gray-400">Customer Details</th>
                                <th className="p-5 font-black uppercase tracking-widest text-[10px] text-gray-400">Items / List</th>
                                <th className="p-5 font-black uppercase tracking-widest text-[10px] text-gray-400">Schedule</th>
                                <th className="p-5 font-black uppercase tracking-widest text-[10px] text-gray-400">Status</th>
                                <th className="p-5 font-black uppercase tracking-widest text-[10px] text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredSubscriptions.map(sub => (
                                <tr key={sub._id} className="hover:bg-gray-50/20 transition-all group">
                                    <td className="p-5">
                                        <div className="font-bold text-gray-900 leading-tight">{sub.customer?.name}</div>
                                        <div className="text-xs text-gray-400 mt-1">{sub.customer?.email}</div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-wrap gap-1.5">
                                            {sub.items?.map((item, idx) => (
                                                <span key={idx} className="bg-white border border-gray-100 text-[10px] font-bold text-gray-700 px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                                                    <Package className="h-2.5 w-2.5 text-primary-500" />
                                                    {item.product?.name} ({item.quantity})
                                                </span>
                                            ))}
                                            {(!sub.items || sub.items.length === 0) && <span className="text-xs text-gray-300 italic">No items</span>}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{sub.type} Deliveries</span>
                                            {sub.type === 'Monthly' && (
                                                <div className="flex gap-1 mt-1 flex-wrap max-w-[150px]">
                                                    {sub.customDates?.map(d => (
                                                        <span key={d} className="bg-primary-50 text-primary-700 text-[9px] font-black w-4 h-4 flex items-center justify-center rounded">
                                                            {d}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Starts: {new Date(sub.startDate).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                            sub.status === 'Active' ? 'bg-green-100 text-green-700 border border-green-200' : 
                                            sub.status === 'Paused' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
                                            'bg-red-100 text-red-700 border border-red-200'
                                        }`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right">
                                        <select
                                            value={sub.status}
                                            onChange={(e) => updateStatus(sub._id, e.target.value)}
                                            className="text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 cursor-pointer shadow-sm hover:border-primary-300 transition-all outline-none"
                                        >
                                            <option value="Active">Mark Active</option>
                                            <option value="Paused">Mark Paused</option>
                                            <option value="Cancelled">Cancel</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredSubscriptions.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ListChecks className="h-8 w-8 text-gray-200" />
                        </div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No matching schedules found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSubscriptions;
