import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { CreditCard, CheckCircle, Loader2, ShoppingBag, MapPin } from 'lucide-react';
import api from '../shared/services/api';
import { useRealtimeEvent } from '../shared/realtime/useRealtimeEvent.js';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clearCart } = useContext(CartContext);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Online');
    
    // Address state
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('new');
    const [shippingAddress, setShippingAddress] = useState({
        addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', saveToProfile: false
    });
    const [loadingAddresses, setLoadingAddresses] = useState(true);

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const { data } = await api.get('/customers/profile');
                const pData = data.data || data;
                if (pData?.addresses?.length > 0) {
                    setAddresses(pData.addresses);
                    const defaultAddr = pData.addresses.find(a => a.isDefaultDelivery) || pData.addresses[0];
                    setSelectedAddressId(defaultAddr._id);
                }
            } catch (err) {
                console.error("Failed to load addresses", err);
            } finally {
                setLoadingAddresses(false);
            }
        };
        fetchAddresses();
    }, []);

    useRealtimeEvent(
      (event) => ['customer:changed', 'auth:changed', 'settings:changed'].includes(event.event),
      () => {
        const fetchAddresses = async () => {
          try {
            const { data } = await api.get('/customers/profile');
            const pData = data.data || data;
            if (pData?.addresses?.length > 0) {
              setAddresses(pData.addresses);
              const defaultAddr = pData.addresses.find(a => a.isDefaultDelivery) || pData.addresses[0];
              setSelectedAddressId(defaultAddr._id);
            }
          } catch (err) {
            console.error('Failed to load addresses', err);
          } finally {
            setLoadingAddresses(false);
          }
        };
        fetchAddresses();
      }
    );

    if (!location.state) {
        return (
            <div className="max-w-md mx-auto mt-20 text-center p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Access</h2>
                <p className="text-gray-500 mb-8">You cannot access this page directly.</p>
                <Link to="/shop" className="btn-primary px-8 py-3 rounded-xl">Back to Shop</Link>
            </div>
        );
    }

    const { orderType, cartItems, cartTotalPrice, totalTaxAmount, finalShippingFee, finalTotal } = location.state;

    const handleDone = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            let finalShipping = {};
            
            // Skip address handling for Takeaway orders
            if (orderType !== 'Takeaway') {
                if (selectedAddressId !== 'new') {
                    const selected = addresses.find(a => a._id === selectedAddressId);
                    finalShipping = {
                        address: selected.addressLine1 + (selected.addressLine2 ? ', ' + selected.addressLine2 : ''),
                        city: selected.city,
                        postalCode: selected.pincode,
                        country: 'India'
                    };
                } else {
                    if (!shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.pincode) {
                        throw new Error("Please fill in all required address fields.");
                    }
                    finalShipping = {
                        address: shippingAddress.addressLine1 + (shippingAddress.addressLine2 ? ', ' + shippingAddress.addressLine2 : ''),
                        city: shippingAddress.city,
                        postalCode: shippingAddress.pincode,
                        country: 'India'
                    };
                    if (shippingAddress.saveToProfile) {
                        await api.post('/customers/address', {
                            tag: 'Home',
                            addressLine1: shippingAddress.addressLine1,
                            addressLine2: shippingAddress.addressLine2,
                            city: shippingAddress.city,
                            state: shippingAddress.state || 'N/A',
                            pincode: shippingAddress.pincode
                        });
                    }
                }
            }

            const orderData = {
                orderItems: cartItems.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    image: item.image || item.imageUrl || '',
                    price: item.price,
                    product: item._id
                })),
                shippingAddress: finalShipping,
                paymentMethod: paymentMethod === 'Online' ? 'UPI' : 'Cash on Delivery',
                orderType: orderType || 'Takeaway',
                orderChannel: orderType === 'Home Delivery' ? 'Online Order' : 'Takeaway Order',
                itemsPrice: cartTotalPrice,
                taxPrice: totalTaxAmount,
                shippingPrice: finalShippingFee,
                totalPrice: finalTotal,
                isPaid: paymentMethod === 'Online'
            };

            await api.post('/orders', orderData);
            
            clearCart();
            setIsProcessing(false);
            navigate('/my-orders');
        } catch (err) {
            console.error('Checkout error:', err);
            setError(err.message || err.response?.data?.message || 'Failed to process payment and place order.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-start justify-center bg-gray-50 px-4 py-12">
            <div className="max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left Column: Address Selection */}
        {orderType !== 'Takeaway' && (
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="text-primary-600" /> Delivery Address
        </h2>
            
            {loadingAddresses ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6 text-primary-600" /></div>
            ) : (
                <div className="space-y-4 mb-6">
                    {addresses.map(addr => (
                        <label key={addr._id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === addr._id ? 'border-primary-600 bg-primary-50' : 'border-gray-100 hover:border-gray-300'}`}
                        >
                            <input type="radio" className="mt-1" name="addressSelect" value={addr._id} checked={selectedAddressId === addr._id} onChange={(e) => setSelectedAddressId(e.target.value)} />
                            <div>
                                <div className="flex gap-2 items-center mb-1">
                                    <span className="font-bold text-gray-900">{addr.tag}</span>
                                    {addr.isDefaultDelivery && <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Default</span>}
                                </div>
                                <p className="text-sm text-gray-600">{addr.addressLine1}, {addr.city} - {addr.pincode}</p>
                            </div>
                        </label>
                    ))}
                    <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === 'new' ? 'border-primary-600 bg-primary-50' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                        <input type="radio" className="mt-1" name="addressSelect" value="new" checked={selectedAddressId === 'new'} onChange={() => setSelectedAddressId('new')} />
                        <span className="font-bold text-gray-900">Enter New Address</span>
                    </label>
                </div>
            )}

            {selectedAddressId === 'new' && (
                <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Address Line 1*</label>
                        <input type="text" className="w-full border-gray-300 rounded-lg p-2 border" value={shippingAddress.addressLine1} onChange={e => setShippingAddress({...shippingAddress, addressLine1: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Address Line 2</label>
                        <input type="text" className="w-full border-gray-300 rounded-lg p-2 border" value={shippingAddress.addressLine2} onChange={e => setShippingAddress({...shippingAddress, addressLine2: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City*</label>
                            <input type="text" className="w-full border-gray-300 rounded-lg p-2 border" value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">State</label>
                            <input type="text" className="w-full border-gray-300 rounded-lg p-2 border" value={shippingAddress.state} onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Pincode*</label>
                        <input type="text" className="w-full border-gray-300 rounded-lg p-2 border" value={shippingAddress.pincode} onChange={e => setShippingAddress({...shippingAddress, pincode: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="saveAddress" checked={shippingAddress.saveToProfile} onChange={e => setShippingAddress({...shippingAddress, saveToProfile: e.target.checked})} className="rounded text-primary-600" />
                        <label htmlFor="saveAddress" className="text-sm font-medium text-gray-700">Save to Address Book</label>
                    </div>
                </div>
            )}
        </div>
        )}

                {/* Right Column: Payment & Summary */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                    <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                        <CreditCard className="text-primary-600" /> Payment
                    </h2>

                    <div className="space-y-4 mb-8">
                        <div className="grid grid-cols-1 gap-3">
                            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'Online' ? 'border-primary-600 bg-primary-50 shadow-sm' : 'border-gray-100 bg-gray-50'}`}>
                                <input type="radio" className="hidden" name="paymentMethod" value="Online" checked={paymentMethod === 'Online'} onChange={(e) => setPaymentMethod(e.target.value)} />
                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'Online' ? 'border-primary-600' : 'border-gray-300'}`}>
                                    {paymentMethod === 'Online' && <div className="h-2.5 w-2.5 rounded-full bg-primary-600"></div>}
                                </div>
                                <div className="font-bold text-gray-900">Online Payment</div>
                            </label>

                            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'CoD' ? 'border-primary-600 bg-primary-50 shadow-sm' : 'border-gray-100 bg-gray-50'}`}>
                                <input type="radio" className="hidden" name="paymentMethod" value="CoD" checked={paymentMethod === 'CoD'} onChange={(e) => setPaymentMethod(e.target.value)} />
                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'CoD' ? 'border-primary-600' : 'border-gray-300'}`}>
                                    {paymentMethod === 'CoD' && <div className="h-2.5 w-2.5 rounded-full bg-primary-600"></div>}
                                </div>
                                <div className="font-bold text-gray-900">Cash on Delivery</div>
                            </label>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                        <div className="flex justify-between items-center mb-2 text-gray-600 text-sm">
                            <span>Subtotal</span>
                            <span>₹{cartTotalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2 text-gray-600 text-sm">
                            <span>Shipping</span>
                            <span>₹{finalShippingFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4 text-gray-600 text-sm">
                            <span>Tax</span>
                            <span>₹{totalTaxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-black pt-4 border-t border-gray-200">
                            <span className="text-gray-900 uppercase">Grand Total</span>
                            <span className="text-primary-700">₹{finalTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <button 
                        onClick={handleDone} 
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl py-4 font-black text-lg shadow-xl shadow-primary-500/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                    >
                        {isProcessing ? (
                            <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                        ) : (
                            <><CheckCircle className="h-5 w-5" /> Place Order</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
