import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Package, Truck, Store, MapPin, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import api from '../services/api';

const StoreOrders = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // active, completed, cancelled

    const isManagement = user.role === 'Admin' || user.role === 'Manager';

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const { data: ordersData } = await api.get('/orders');
                // Sort by most recent
                const sortedOrders = ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrders(sortedOrders);

                if (isManagement) {
                    const { data: staffData } = await api.get('/auth/staff');
                    setStaffList(staffData.data);
                }
                
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [isManagement]);

    const handleAssign = async (orderId, staffId) => {
        try {
            const { data } = await api.put(`/orders/${orderId}/assign`, { staffId: staffId || null });
            // Update order locally
            setOrders(orders.map(o => o._id === orderId ? data : o));
        } catch (error) {
            console.error('Error assigning staff:', error);
            alert('Failed to assign staff to order.');
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const { data } = await api.put(`/orders/${orderId}/status`, { status: newStatus });
            // Update local
            setOrders(orders.map(o => o._id === orderId ? data : o));
        } catch (error) {
            console.error('Error changing status:', error);
            alert('Failed to update status.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const statusOptions = ['Pending', 'Packed', 'Ready to deliver', 'Pickup Ready', 'Out for delivery', 'Delivered', 'Cancelled'];

    const activeOrders = orders.filter(o => !['Delivered', 'Picked Up', 'Cancelled'].includes(o.status));
    const completedOrders = orders.filter(o => ['Delivered', 'Picked Up'].includes(o.status));
    const cancelledOrders = orders.filter(o => o.status === 'Cancelled');

    let filteredOrders = [];
    if (activeTab === 'active') filteredOrders = activeOrders;
    else if (activeTab === 'completed') filteredOrders = completedOrders;
    else if (activeTab === 'cancelled') filteredOrders = cancelledOrders;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-gray-200">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">POS & Orders</h1>
                    <p className="text-gray-500 font-medium mt-1">Manage and assign customer orders globally</p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                    <span className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 shadow-sm">
                        Total: {orders.length}
                    </span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 mb-8 bg-gray-100/50 p-1 rounded-2xl w-max">
                <button 
                    onClick={() => setActiveTab('active')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-white text-primary-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Active ({activeOrders.length})
                </button>
                <button 
                    onClick={() => setActiveTab('completed')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'completed' ? 'bg-white text-green-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Completed ({completedOrders.length})
                </button>
                <button 
                    onClick={() => setActiveTab('cancelled')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'cancelled' ? 'bg-white text-red-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Cancelled ({cancelledOrders.length})
                </button>
            </div>

            <div className="space-y-6">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-700">No {activeTab} Orders</h3>
                        <p className="text-gray-400">There are currently no orders in this category.</p>
                    </div>
                ) : (
                    filteredOrders.map(order => {
                        const isAssignedToMe = order.assignedTo?._id === user.id || order.assignedTo?._id === user._id;
                        const isLocked = ['Delivered', 'Picked Up', 'Cancelled'].includes(order.status);
                        const canEditStatus = (isManagement || isAssignedToMe) && !isLocked;
                        const canAssign = isManagement && !isLocked;

                        return (
                            <div key={order._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
                                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${order.orderType === 'Home Delivery' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {order.orderType === 'Home Delivery' ? <Truck className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-gray-900 font-mono">
                                                ORD-{(order._id || "").substring(order._id.length - 8).toUpperCase()}
                                            </div>
                                            <div className="text-xs text-gray-500 font-medium">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        
                                        {/* Status Changer */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Status:</span>
                                            <select 
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                disabled={!canEditStatus}
                                                className={`text-sm font-bold border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary-500 ${!canEditStatus ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-800 border-gray-300'}`}
                                            >
                                                <option value={order.status} disabled hidden>{order.status}</option>
                                                {statusOptions.map(st => (
                                                    <option key={st} value={st}>{st}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Assignment Changer (Admin/Manager only) */}
                                        <div className="flex items-center gap-2 border-l border-gray-200 pl-6">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Handler:</span>
                                            {isManagement ? (
                                                <select
                                                    value={order.assignedTo?._id || ''}
                                                    onChange={(e) => handleAssign(order._id, e.target.value)}
                                                    disabled={!canAssign}
                                                    className={`text-sm border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary-500 ${!canAssign ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'bg-white text-gray-800 border-gray-300'}`}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {staffList.map(staff => (
                                                        <option key={staff._id} value={staff._id}>{staff.name} (Staff)</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className={`text-sm px-3 py-1 rounded-lg font-bold ${isAssignedToMe ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {order.assignedTo ? order.assignedTo.name : 'Unassigned'}
                                                </span>
                                            )}
                                        </div>

                                    </div>
                                </div>

                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Customer & Shipping</h4>
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <p className="font-bold text-gray-800">{order.customer?.name || 'Unknown'}</p>
                                            <p className="text-sm text-gray-500 mb-3">{order.paymentMethod} • ₹{order.totalPrice.toFixed(2)}</p>
                                            
                                            {order.orderType === 'Home Delivery' && order.shippingAddress && (
                                                <div className="text-sm text-gray-600 flex gap-2">
                                                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                                    <span>{order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Items ({order.orderItems.length})</h4>
                                        <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                            {order.orderItems.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-gray-700">{item.quantity}x</span>
                                                        <span className="text-gray-600">{item.name}</span>
                                                    </div>
                                                    <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default StoreOrders;
