import React, { useState, useEffect } from 'react';
import { Package, Truck, Store, Clock, CalendarDays, ExternalLink, ChevronRight, CheckCircle, MapPin } from 'lucide-react';
import api from '../services/api';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/orders/myorders');
            const sortedOrders = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(sortedOrders);
            setIsLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch orders');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCancel = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        
        try {
            await api.put(`/orders/${orderId}/cancel`);
            fetchOrders();
            alert('Order cancelled successfully.');
        } catch (err) {
            console.error('Error cancelling order:', err);
            alert(err.response?.data?.message || 'Failed to cancel order.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto mt-10 p-4 bg-red-50 text-red-600 rounded-lg text-center font-medium shadow-sm">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center justify-center gap-4 mb-10">
                <div className="bg-primary-50 h-16 w-16 rounded-2xl flex items-center justify-center shadow-inner border border-primary-100">
                    <Package className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Orders</h1>
                    <p className="text-gray-500 font-medium">Track and view your past purchases</p>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-xl p-16 text-center border border-gray-100 mt-10">
                    <div className="bg-gray-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="h-10 w-10 text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">No orders yet</h2>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">Looks like you haven't placed any orders. Start exploring our shop to find something great!</p>
                    <a href="/shop" className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-lg font-bold shadow-lg shadow-primary-500/30">
                        Start Shopping
                    </a>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order._id} className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-all group">
                            <div className="bg-gray-50/80 px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-gray-400 tracking-widest uppercase">Order ID</span>
                                        <span className="text-sm font-bold text-gray-700 font-mono bg-white px-2 py-0.5 rounded border border-gray-200">#{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                                        <CalendarDays className="h-4 w-4" />
                                        {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${
                                        order.status === 'Delivered' || order.status === 'Picked Up' ? 'bg-green-100 text-green-700 border border-green-200' :
                                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700 border border-red-200' :
                                        order.status === 'Out for delivery' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                        'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                    }`}>
                                        {order.status === 'Delivered' || order.status === 'Picked Up' ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                        {order.status}
                                    </span>
                                    <div className="text-xl font-black text-gray-900 tracking-tight">
                                        ₹{order.totalPrice.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 w-max">
                                    {order.orderType === 'Home Delivery' ? (
                                        <>
                                            <Truck className="h-5 w-5 text-blue-600" />
                                            <span className="font-bold text-blue-800 text-sm">Home Delivery</span>
                                        </>
                                    ) : (
                                        <>
                                            <Store className="h-5 w-5 text-purple-600" />
                                            <span className="font-bold text-purple-800 text-sm">Take Away</span>
                                        </>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">Items</h4>
                                        <div className="space-y-3">
                                            {order.orderItems.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                                        {item.image ? (
                                                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <Package className="h-full w-full p-2 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-800 truncate">{item.name}</p>
                                                        <p className="text-xs text-gray-500 font-medium font-mono">Qty: {item.quantity}</p>
                                                    </div>
                                                    <div className="text-sm font-bold text-gray-900">
                                                        ₹{(item.price * item.quantity).toFixed(2)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {order.orderType === 'Home Delivery' && order.shippingAddress && (
                                        <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 h-full">
                                            <h4 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3">
                                                <MapPin className="h-4 w-4 text-gray-400" /> Shipping Details
                                            </h4>
                                            <div className="text-sm text-gray-600 font-medium leading-relaxed">
                                                <p>{order.shippingAddress.address}</p>
                                                <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                                                <p>{order.shippingAddress.country}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {['Pending', 'Packed'].includes(order.status) && (
                                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                        <button 
                                            onClick={() => handleCancel(order._id)}
                                            className="px-6 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-bold transition-all border border-red-100"
                                        >
                                            Cancel Order
                                        </button>
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

export default MyOrders;
