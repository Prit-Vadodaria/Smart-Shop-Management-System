import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Play, Pause, Trash2, Plus, Search, Info, CheckCircle, ChevronRight, Settings } from 'lucide-react';

const MySubscriptions = () => {
    const [lists, setLists] = useState([]);
    const [eligibleProducts, setEligibleProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Daily');

    const fetchSubscriptionData = async () => {
        try {
            setLoading(true);
            // Fetch the 3 lists
            const { data: listsData } = await api.get('/subscriptions/my-lists');
            setLists(listsData);

            // Fetch all eligible products
            const { data: productsData } = await api.get('/products');
            setEligibleProducts(productsData.data.filter(p => p.isSubscriptionEligible));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch subscription data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptionData();
    }, []);

    const updateListItems = async (listId, newItems) => {
        try {
            const { data } = await api.put(`/subscriptions/${listId}/items`, { items: newItems });
            setLists(lists.map(l => l._id === listId ? data : l));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update items');
        }
    };

    const updateListSettings = async (listId, settings) => {
        try {
            const { data } = await api.put(`/subscriptions/${listId}/settings`, settings);
            setLists(lists.map(l => l._id === listId ? { ...l, ...data } : l));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update settings');
        }
    };

    const addItemToList = (list, product) => {
        const existing = list.items.find(i => i.product._id === product._id);
        if (existing) {
            alert('Item already in this list');
            return;
        }
        const newItems = [...list.items.map(i => ({ product: i.product._id, quantity: i.quantity })), { product: product._id, quantity: product.minSubscriptionQuantity || 1 }];
        updateListItems(list._id, newItems);
    };

    const removeItemFromList = (list, productId) => {
        const newItems = list.items
            .filter(i => i.product._id !== productId)
            .map(i => ({ product: i.product._id, quantity: i.quantity }));
        updateListItems(list._id, newItems);
    };

    const changeQuantity = (list, productId, delta) => {
        const newItems = list.items.map(i => {
            if (i.product._id === productId) {
                const newQty = Math.max(1, i.quantity + delta);
                return { product: i.product._id, quantity: newQty };
            }
            return { product: i.product._id, quantity: i.quantity };
        });
        updateListItems(list._id, newItems);
    };

    const toggleMonthlyDate = (list, day) => {
        let newDates = [...(list.customDates || [])];
        if (newDates.includes(day)) {
            newDates = newDates.filter(d => d !== day);
        } else {
            newDates.push(day);
        }
        updateListSettings(list._id, { customDates: newDates.sort((a, b) => a - b) });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const currentList = lists.find(l => l.type === activeTab);
    const filteredEligible = eligibleProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-primary-600" />
                        Subscription Management
                    </h1>
                    <p className="text-gray-500 mt-1">Configure your recurring delivery schedules.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar: Settings & Tabs */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-2 flex flex-col">
                            {['Daily', 'Alternate', 'Monthly'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setActiveTab(type)}
                                    className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                                        activeTab === type 
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' 
                                        : 'bg-transparent text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${activeTab === type ? 'bg-white/20' : 'bg-gray-100'}`}>
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-sm">{type === 'Daily' ? 'Daily Delivery' : type === 'Alternate' ? 'Every 2nd Day' : 'Specific Dates'}</p>
                                            <p className={`text-[10px] ${activeTab === type ? 'text-white/70' : 'text-gray-400'}`}>
                                                {lists.find(l => l.type === type)?.items?.length || 0} items in list
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className={`h-4 w-4 ${activeTab === type ? 'opacity-100' : 'opacity-0'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {currentList && (
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Settings className="h-4 w-4 text-primary-600" />
                                    List Settings
                                </h3>
                                <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-full ${
                                    currentList.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {currentList.status}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Commencement Date</label>
                                    <input 
                                        type="date"
                                        value={new Date(currentList.startDate).toISOString().split('T')[0]}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => updateListSettings(currentList._id, { startDate: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                    />
                                </div>

                                {currentList.type === 'Monthly' && (
                                    <div>
                                        <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Monthly Delivery Dates</label>
                                        <div className="grid grid-cols-7 gap-1">
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                <button
                                                    key={day}
                                                    onClick={() => toggleMonthlyDate(currentList, day)}
                                                    className={`h-7 w-7 rounded-lg text-[10px] font-bold transition-all ${
                                                        currentList.customDates?.includes(day)
                                                        ? 'bg-primary-600 text-white shadow-sm'
                                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-50 flex gap-2">
                                    {currentList.status === 'Active' ? (
                                        <button 
                                            onClick={() => updateListSettings(currentList._id, { status: 'Paused' })}
                                            className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-colors"
                                        >
                                            <Pause className="h-3.5 w-3.5" /> Pause List
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => updateListSettings(currentList._id, { status: 'Active' })}
                                            className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-colors"
                                        >
                                            <Play className="h-3.5 w-3.5" /> Resume List
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Content: Items in List + Catalog */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Items in Current List */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <h2 className="text-xl font-bold text-gray-900">Items in This Schedule</h2>
                            <span className="text-xs font-bold text-gray-400">{currentList?.items?.length || 0} items</span>
                        </div>
                        <div className="p-8">
                            {currentList?.items?.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                        <Plus className="h-6 w-6 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 font-medium">Your {currentList.type} list is empty.</p>
                                    <p className="text-sm text-gray-400 mt-1">Add items from the catalog below.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {currentList.items.map(item => (
                                        <div key={item.product._id} className="flex items-center gap-4 p-4 rounded-3xl border border-gray-100 hover:border-primary-100 transition-colors bg-gray-50/20">
                                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white shadow-sm flex-shrink-0">
                                                <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 truncate">{item.product.name}</h4>
                                                <p className="text-xs text-gray-400">₹{item.product.price} / unit</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
                                                    <button 
                                                        onClick={() => changeQuantity(currentList, item.product._id, -1)}
                                                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400 transition-colors"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                                                    <button 
                                                        onClick={() => changeQuantity(currentList, item.product._id, 1)}
                                                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400 transition-colors"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={() => removeItemFromList(currentList, item.product._id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Catalog for Adding */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-2">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Plus className="h-5 w-5 text-primary-600" />
                                Add More Items
                            </h2>
                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    placeholder="Search eligible products..."
                                    className="w-full pl-10 pr-4 py-2 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredEligible.map(product => {
                                const inList = currentList?.items?.some(i => i.product._id === product._id);
                                return (
                                    <div 
                                        key={product._id} 
                                        className={`p-4 rounded-3x l border transition-all ${
                                            inList 
                                            ? 'bg-primary-50/30 border-primary-100 opacity-80' 
                                            : 'bg-white border-gray-100 hover:shadow-lg hover:border-primary-200 shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm text-gray-900 truncate">{product.name}</h4>
                                                <p className="text-[10px] text-gray-400">₹{product.price} / item</p>
                                            </div>
                                            {inList ? (
                                                <div className="bg-primary-600 text-white rounded-full p-1.5 ring-4 ring-primary-100">
                                                    <Plus className="h-3 w-3 rotate-45" />
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => addItemToList(currentList, product)}
                                                    className="bg-white hover:bg-primary-600 hover:text-white text-primary-600 border border-primary-200 w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MySubscriptions;
