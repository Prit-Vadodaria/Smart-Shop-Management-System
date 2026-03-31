import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';
import api from '../services/api';

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, cartTotalPrice, cartTotalCount } = useContext(CartContext);
    const [settings, setSettings] = useState({ shippingPercentage: 5, freeShippingThreshold: 500 });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings');
                setSettings(data.data);
            } catch (err) {
                console.error('Error fetching settings', err);
            }
        };
        fetchSettings();
    }, []);

    // Calculate individual item-level tax summation
    const totalTaxAmount = cartItems.reduce((acc, item) => {
        const itemTax = (item.price * item.quantity) * (item.taxPercentage / 100);
        return acc + itemTax;
    }, 0);

    // Dynamic Shipping Logic (Percentage-based + Free Threshold)
    const baseShippingAmount = cartTotalPrice * (settings.shippingPercentage / 100);
    const finalShippingFee = cartTotalPrice > settings.freeShippingThreshold ? 0 : baseShippingAmount;

    const finalTotal = cartTotalPrice + totalTaxAmount + finalShippingFee;

    if (cartItems.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <div className="bg-white rounded-3xl shadow-xl p-12 border border-gray-100 backdrop-blur-lg">
                    <div className="bg-primary-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="h-12 w-12 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">Looks like you haven't added any grocery items to your cart yet. Head back to the shop to find the best deals!</p>
                    <Link to="/shop" className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-lg shadow-lg shadow-primary-500/30">
                        <ArrowLeft className="h-5 w-5" /> Back to Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/shop')} className="p-2 bg-white rounded-full border border-gray-200 text-gray-500 hover:text-primary-600 transition-colors shadow-sm">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Shopping Cart ({cartTotalCount})</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items List */}
                <div className="lg:col-span-2 space-y-4">
                    {cartItems.map((item) => (
                        <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
                            <div className="h-24 w-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                                {(item.image || item.imageUrl) ? (
                                    <img src={item.image || item.imageUrl} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                        <ShoppingBag className="h-8 w-8 text-gray-300" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-grow">
                                <span className="text-[10px] font-bold uppercase text-primary-600 tracking-widest">{item.category}</span>
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{item.name}</h3>
                                <p className="text-gray-400 text-sm line-clamp-1">{item.description}</p>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                                <div className="text-lg font-black text-gray-900">₹{item.price}</div>
                                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-100">
                                    <button 
                                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                        className="p-1 text-gray-500 hover:text-primary-600 hover:bg-white rounded transition-all"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="font-bold text-gray-700 w-8 text-center">{item.quantity}</span>
                                    <button 
                                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                        className="p-1 text-gray-500 hover:text-primary-600 hover:bg-white rounded transition-all"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => removeFromCart(item._id)}
                                    className="text-red-400 hover:text-red-600 transition-colors flex items-center gap-1 text-xs font-bold"
                                >
                                    <Trash2 className="h-4 w-4" /> Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 sticky top-24">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
                        
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-gray-500 font-medium">
                                <span>Subtotal</span>
                                <span>₹{cartTotalPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 font-medium">
                                <span>Combined Tax</span>
                                <span>₹{totalTaxAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 font-medium">
                                <span>Shipping ({settings.shippingPercentage}%)</span>
                                {finalShippingFee === 0 ? (
                                    <span className="text-green-600 font-bold uppercase text-xs">Free</span>
                                ) : (
                                    <span>₹{finalShippingFee.toFixed(2)}</span>
                                )}
                            </div>
                            {finalShippingFee > 0 && cartTotalPrice < settings.freeShippingThreshold && (
                                <p className="text-[10px] text-primary-600 font-medium bg-primary-50 p-2 rounded-lg">
                                    Add ₹{(settings.freeShippingThreshold - cartTotalPrice).toFixed(2)} more for FREE shipping!
                                </p>
                            )}
                            <div className="border-t border-dashed border-gray-200 pt-4 mt-4 flex justify-between">
                                <span className="text-xl font-bold text-gray-900">Final Total</span>
                                <span className="text-2xl font-black text-primary-600">₹{finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <button className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-2xl py-4 font-bold text-lg shadow-xl shadow-primary-500/30 transition-all hover:scale-[1.02] active:scale-95 mb-4">
                            Proceed to Checkout
                        </button>
                        
                        <p className="text-center text-[10px] text-gray-400">Secure 256-bit SSL encrypted checkout</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
