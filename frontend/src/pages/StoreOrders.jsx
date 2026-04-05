import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Package, Truck, Store, MapPin, CheckCircle, Clock, Search, Filter, Trash2, Plus, ShoppingCart, User as UserIcon, X, CreditCard } from 'lucide-react';
import api from '../services/api';

const StoreOrders = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // active, completed, cancelled

    // POS State
    const [isPOSOpen, setIsPOSOpen] = useState(false);
    const [posCustomer, setPosCustomer] = useState(null);
    const [posCart, setPosCart] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [productResults, setProductResults] = useState([]);
    const [customerResults, setCustomerResults] = useState([]);
    const [paymentMode, setPaymentMode] = useState('Offline');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [isInitialPosLoading, setIsInitialPosLoading] = useState(false);
    const [allProducts, setAllProducts] = useState([]);
    const [allCustomers, setAllCustomers] = useState([]);

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

    // Fetch All Products and Customers when POS Opens
    useEffect(() => {
        if (!isPOSOpen) return;

        const fetchPosData = async () => {
            setIsInitialPosLoading(true);
            try {
                const [prodRes, custRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/customers')
                ]);
                // Product API returns { data: [...] }
                setAllProducts(prodRes.data.data || []);
                setProductResults(prodRes.data.data || []);
                // Customer API returns [...]
                setAllCustomers(custRes.data || []);
            } catch (error) {
                console.error('Error fetching POS data:', error);
            } finally {
                setIsInitialPosLoading(false);
            }
        };

        fetchPosData();
    }, [isPOSOpen]);

    // Client-side Product Filtering
    useEffect(() => {
        if (!productSearch) {
            setProductResults(allProducts);
            return;
        }
        const filtered = allProducts.filter(p =>
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.category.toLowerCase().includes(productSearch.toLowerCase())
        );
        setProductResults(filtered);
    }, [productSearch, allProducts]);

    // Client-side Customer Filtering
    useEffect(() => {
        if (!customerSearch) {
            setCustomerResults([]);
            return;
        }
        const filtered = allCustomers.filter(c =>
            c.user?.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
            c.user?.email?.toLowerCase().includes(customerSearch.toLowerCase())
        );
        setCustomerResults(filtered);
    }, [customerSearch, allCustomers]);


    const addToCart = (product) => {
        const exists = posCart.find(item => item.product === product._id);
        if (exists) {
            setPosCart(posCart.map(item => item.product === product._id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setPosCart([...posCart, {
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.image
            }]);
        }
        setProductSearch('');
    };

    const removeFromCart = (productId) => {
        setPosCart(posCart.filter(item => item.product !== productId));
    };

    const updateCartQty = (productId, qty) => {
        if (qty < 1) return;
        setPosCart(posCart.map(item => item.product === productId ? { ...item, quantity: parseInt(qty) } : item));
    };

    const handlePOSCheckout = async () => {
        if (!posCustomer) return alert('Please select a customer');
        if (posCart.length === 0) return alert('Cart is empty');

        setIsSubmitting(true);
        try {
            const itemsPrice = posCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
            const taxPrice = itemsPrice * 0.18; // 18% GST example
            const totalPrice = itemsPrice + taxPrice;

            const orderData = {
                orderItems: posCart,
                customerId: posCustomer.isGuest ? null : (posCustomer.user?._id || posCustomer._id),
                customerName: posCustomer.isGuest ? posCustomer.user.name : null,
                paymentMethod: paymentMode,
                orderType: 'Takeaway',
                itemsPrice,
                taxPrice,
                shippingPrice: 0,
                totalPrice,
                isPaid: true,
                isDelivered: true,
                shippingAddress: { // Added for validation compatibility
                    address: 'In-Store',
                    city: 'Store Location',
                    postalCode: '000000',
                    country: 'India'
                }
            };

            const { data } = await api.post('/orders', orderData);

            // Add the new order to the list immediately
            setOrders(prevOrders => [data, ...prevOrders]);

            // Show a professional receipt-style success message
            const orderId = data._id.toString().substring(data._id.toString().length - 8).toUpperCase();
            const customerNameDisplay = posCustomer.isGuest ? posCustomer.user.name : (posCustomer.user?.name || posCustomer.name);
            alert(`✅ Sale Completed Successfully!\nOrder ID: ORD-${orderId}\nCustomer: ${customerNameDisplay}\nTotal: ₹${totalPrice.toFixed(2)}`);

            // Reset POS
            setIsPOSOpen(false);
            setPosCart([]);
            setPosCustomer(null);
            setPaymentMode('Offline');

            // Switch to the relevant tab to show the new record
            setActiveTab('completed');
        } catch (error) {
            console.error('Error completing POS sale:', error);
            alert(error.response?.data?.message || 'Failed to complete checkout');
        } finally {
            setIsSubmitting(false);
        }
    };

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

    const deleteOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this order? This cannot be undone.')) return;
        try {
            await api.delete(`/orders/${orderId}`);
            setOrders(orders.filter(o => o._id !== orderId));
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Failed to delete order.');
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
                    {isManagement && (
                        <button
                            onClick={() => setIsPOSOpen(true)}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary-200 transition-all active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            New POS Sale
                        </button>
                    )}
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

                                        {isManagement && (
                                            <button
                                                onClick={() => deleteOrder(order._id)}
                                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                title="Permanently Delete Order"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}

                                    </div>
                                </div>

                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Customer & Shipping</h4>
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <div className="flex items-center gap-3 mt-1 mb-2">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {order.isPaid ? 'PAID' : 'UNPAID'}
                                                </span>
                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600">
                                                    {order.paymentMethod} Mode
                                                </span>
                                            </div>
                                            <p className="font-bold text-gray-800">{order.customer?.name || order.customerName || 'Walk-in Customer'}</p>
                                            <p className="text-sm text-gray-500 mb-2">Total: ₹{order.totalPrice.toFixed(2)}</p>
                                            
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

            {/* POS Modal */}
            {isPOSOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">

                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-primary-50/30">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                    <ShoppingCart className="h-7 w-7 text-primary-600" />
                                    POS Terminal
                                </h2>
                                <p className="text-sm text-gray-500 font-medium">Create a new sale for a customer</p>
                            </div>
                            <button
                                onClick={() => setIsPOSOpen(false)}
                                className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-red-500 transition-all shadow-sm border border-transparent hover:border-red-100"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

                            {/* Left Side: Search & Selection */}
                            <div className="flex-1 overflow-y-auto p-8 border-r border-gray-100 custom-scrollbar">

                                {/* Customer Selection */}
                                <div className="mb-8">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">1. Select Customer</label>

                                    {!posCustomer ? (
                                        <div className="relative">
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-focus-within:border-primary-200 transition-all">
                                                    <UserIcon className="h-4 w-4 text-gray-400 group-focus-within:text-primary-600" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={customerSearch}
                                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                                    placeholder="Search by name or email..."
                                                    className="w-full pl-16 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-700 shadow-inner"
                                                />
                                            </div>

                                            {isInitialPosLoading || isSearchingCustomers ? (
                                                <div className="p-8 text-center bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center gap-3">
                                                    <div className="h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-xs font-bold text-gray-500">Retrieving customers...</p>
                                                </div>
                                            ) : customerResults.length > 0 ? (
                                                <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                                    {customerResults.map(cust => (
                                                        <button
                                                            key={cust._id}
                                                            onClick={() => { setPosCustomer(cust); setCustomerSearch(''); setCustomerResults([]); }}
                                                            className="w-full px-6 py-4 text-left hover:bg-primary-50 transition-colors border-b border-gray-50 flex items-center justify-between group"
                                                        >
                                                            <div>
                                                                <p className="font-bold text-gray-800">{cust.user?.name || 'No Name'}</p>
                                                                <p className="text-xs text-gray-500">{cust.user?.email || 'No Email'}</p>
                                                            </div>
                                                            <Plus className="h-5 w-5 text-gray-300 group-hover:text-primary-600 transition-colors" />
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => { setPosCustomer({ isGuest: true, user: { name: customerSearch } }); setCustomerSearch(''); setCustomerResults([]); }}
                                                        className="w-full px-6 py-4 text-left bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold text-sm flex items-center gap-3 transition-colors"
                                                    >
                                                        <Plus className="h-4 w-4" /> Use "{customerSearch}" as Guest Name
                                                    </button>
                                                </div>
                                            ) : customerSearch.length >= 1 ? (
                                                <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                                    <div className="p-6 text-center text-gray-400 text-sm font-bold">
                                                        No customers found by that name.
                                                    </div>
                                                    <button
                                                        onClick={() => { setPosCustomer({ isGuest: true, user: { name: customerSearch } }); setCustomerSearch(''); setCustomerResults([]); }}
                                                        className="w-full px-6 py-4 text-left bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold text-sm flex items-center gap-3 transition-colors border-t border-gray-100"
                                                    >
                                                        <Plus className="h-4 w-4" /> Record as Guest: "{customerSearch}"
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <div className="bg-primary-50 border-2 border-primary-100 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-5">
                                                <div className="h-14 w-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                                                    {(posCustomer.user?.name || '?').charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 text-lg leading-tight">{posCustomer.user?.name || 'Walk-in'}</p>
                                                    {posCustomer.isGuest ? (
                                                        <p className="text-primary-600 font-bold text-xs uppercase tracking-widest mt-1">Guest Customer</p>
                                                    ) : (
                                                        <>
                                                            <p className="text-primary-600 font-bold text-sm">{posCustomer.user?.email || 'No Email'}</p>
                                                            <div className="flex gap-4 mt-1">
                                                                <span className="text-[10px] font-black text-primary-400 uppercase tracking-tighter">Phone: {posCustomer.phone || 'N/A'}</span>
                                                                <span className="text-[10px] font-black text-primary-400 uppercase tracking-tighter">ID: {posCustomer.customerId || 'N/A'}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setPosCustomer(null)}
                                                className="text-xs font-black text-primary-600 hover:text-red-600 uppercase tracking-widest px-4 py-2 hover:bg-white rounded-xl transition-all"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Product Selection */}
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">2. Add Products</label>
                                    <div className="mb-8">
                                        <div className="relative group mb-6">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-focus-within:border-primary-200 transition-all">
                                                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary-600" />
                                            </div>
                                            <input
                                                type="text"
                                                value={productSearch}
                                                onChange={(e) => setProductSearch(e.target.value)}
                                                placeholder="Search products by name..."
                                                className="w-full pl-16 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-700 shadow-inner"
                                            />
                                        </div>

                                        {isInitialPosLoading || isSearchingProducts ? (
                                            <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 flex flex-col items-center gap-4">
                                                <div className="h-8 w-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-sm font-bold text-gray-400">Loading products...</p>
                                            </div>
                                        ) : productResults.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {productResults.map(prod => (
                                                    <button
                                                        key={prod._id}
                                                        onClick={() => addToCart(prod)}
                                                        disabled={prod.countInStock === 0}
                                                        className="text-left bg-white p-4 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all flex items-center gap-4 disabled:opacity-50 group hover:translate-y-[-2px]"
                                                    >
                                                        <div className="h-14 w-14 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                                                            <img src={prod.image || '/no-photo.jpg'} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-gray-800 text-sm truncate">{prod.name}</p>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <span className="text-primary-600 font-black text-sm">₹{prod.price}</span>
                                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${prod.countInStock > 10 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                                    {prod.countInStock} Left
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Plus className="h-5 w-5 text-primary-200 group-hover:text-primary-600 transition-colors" />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 text-sm font-bold">
                                                No products available.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Cart & Checkout */}
                            <div className="w-full lg:w-96 bg-gray-50 overflow-y-auto p-8 border-t lg:border-t-0 border-gray-100 custom-scrollbar flex flex-col">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">3. Order Summary</label>

                                <div className="flex-1 space-y-4 mb-8">
                                    {posCart.length === 0 ? (
                                        <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                                            <ShoppingCart className="h-10 w-10 text-gray-300 mb-3" />
                                            <p className="text-sm font-bold text-gray-400 leading-tight">Your cart is empty.<br />Add products to start.</p>
                                        </div>
                                    ) : (
                                        posCart.map(item => (
                                            <div key={item.product} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-800 truncate">{item.name}</p>
                                                    <p className="text-xs text-primary-600 font-bold">₹{item.price}</p>
                                                </div>
                                                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1 border border-gray-100">
                                                    <button
                                                        onClick={() => updateCartQty(item.product, item.quantity - 1)}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white text-gray-500 hover:text-primary-600 transition-all font-bold"
                                                    >-</button>
                                                    <span className="text-sm font-black text-gray-900 w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateCartQty(item.product, item.quantity + 1)}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white text-gray-500 hover:text-primary-600 transition-all font-bold"
                                                    >+</button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.product)}
                                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Order Settings */}
                                <div className="space-y-4 mb-8 pt-6 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" /> Payment Mode
                                        </span>
                                        <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
                                            <button
                                                onClick={() => setPaymentMode('Cash')}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${paymentMode === 'Cash' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                            >Cash</button>
                                            <button
                                                onClick={() => setPaymentMode('UPI')}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${paymentMode === 'UPI' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                            >UPI</button>
                                        </div>
                                    </div>

                                </div>

                                {/* Totals & Actions */}
                                <div className="space-y-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-lg mt-auto">
                                    <div className="flex justify-between text-xs font-bold text-gray-400">
                                        <span>Subtotal</span>
                                        <span>₹{posCart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-gray-400">
                                        <span>Tax (18% GST)</span>
                                        <span>₹{(posCart.reduce((acc, i) => acc + (i.price * i.quantity), 0) * 0.18).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                        <span className="text-lg font-black text-gray-900">Total</span>
                                        <span className="text-2xl font-black text-primary-600">
                                            ₹{(posCart.reduce((acc, i) => acc + (i.price * i.quantity), 0) * 1.18).toFixed(2)}
                                        </span>
                                    </div>
                                    <button
                                        disabled={isSubmitting || posCart.length === 0 || !posCustomer}
                                        onClick={handlePOSCheckout}
                                        className="w-full mt-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? (
                                            <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                Checkout
                                                <ShoppingCart className="h-5 w-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreOrders;
