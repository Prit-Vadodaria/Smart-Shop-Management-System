import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Play, Pause, XCircle } from 'lucide-react';

const MySubscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/subscriptions/my-subscriptions');
            setSubscriptions(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch subscriptions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/subscriptions/${id}/status`, { status });
            // Refresh the list after status update
            fetchSubscriptions();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">{error}</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-primary-600" />
                My Auto-Delivery Subscriptions
            </h1>

            {subscriptions.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 border border-gray-100 text-center shadow-sm">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Subscriptions Yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        You don't have any active product subscriptions. Browse the shop and look for the calendar icon to set up auto-delivery for eligible products!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subscriptions.map(sub => (
                        <div key={sub._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden">
                                        {sub.product?.image && sub.product?.image !== 'no-photo.jpg' ? (
                                            <img src={sub.product.image} alt={sub.product?.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Calendar className="w-8 h-8 text-gray-400 m-auto mt-4" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{sub.product?.name}</h3>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            sub.status === 'Active' ? 'bg-green-100 text-green-800' : 
                                            sub.status === 'Paused' ? 'bg-yellow-100 text-yellow-800' : 
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {sub.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3 pt-4 border-t border-gray-100 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Frequency</span>
                                    <span className="font-medium text-gray-900">{sub.frequency}</span>
                                </div>
                                {sub.frequency === 'Custom days' && sub.customDays?.length > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Days</span>
                                        <span className="font-medium text-gray-900 line-clamp-1" title={sub.customDays.join(', ')}>
                                            {sub.customDays.map(d => d.substring(0,3)).join(', ')}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Quantity</span>
                                    <span className="font-medium text-gray-900">{sub.quantity} item(s)</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Started On</span>
                                    <span className="font-medium text-gray-900">{new Date(sub.startDate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 border-t border-gray-100 pt-4">
                                {sub.status !== 'Cancelled' && (
                                    <>
                                        {sub.status === 'Active' ? (
                                            <button 
                                                onClick={() => updateStatus(sub._id, 'Paused')}
                                                className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors"
                                            >
                                                <Pause className="h-4 w-4" /> Pause
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => updateStatus(sub._id, 'Active')}
                                                className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors"
                                            >
                                                <Play className="h-4 w-4" /> Resume
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to cancel this subscription?')) {
                                                    updateStatus(sub._id, 'Cancelled');
                                                }
                                            }}
                                            className="flex-none px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center justify-center transition-colors"
                                            title="Cancel Subscription"
                                        >
                                            <XCircle className="h-5 w-5" />
                                        </button>
                                    </>
                                )}
                                {sub.status === 'Cancelled' && (
                                    <div className="w-full text-center text-sm font-medium text-gray-400 py-2">
                                        Subscription ended
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MySubscriptions;
