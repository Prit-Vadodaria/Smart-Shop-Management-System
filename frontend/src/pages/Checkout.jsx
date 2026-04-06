import React, { useState, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { CreditCard, CheckCircle, Loader2, ShoppingBag } from 'lucide-react';
import api from '../services/api';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clearCart } = useContext(CartContext);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    // If no state is passed, it means they accessed checkout directly without cart
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

    const [paymentMethod, setPaymentMethod] = useState('Online');

    const handleDone = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            const orderData = {
                orderItems: cartItems.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    image: item.image || item.imageUrl || '',
                    price: item.price,
                    product: item._id
                })),
                shippingAddress: {
                    address: '123 Mock Address Lane',
                    city: 'Test City',
                    postalCode: '100000',
                    country: 'India'
                },
                paymentMethod: paymentMethod === 'Online' ? 'UPI' : 'Cash on Delivery',
                orderType: orderType || 'Takeaway',
                itemsPrice: cartTotalPrice,
                taxPrice: totalTaxAmount,
                shippingPrice: finalShippingFee,
                totalPrice: finalTotal,
                isPaid: paymentMethod === 'Online' // Mark as paid if online
            };

            await api.post('/orders', orderData);
            
            clearCart();
            navigate('/my-orders');
        } catch (err) {
            console.error('Checkout error:', err);
            setError(err.response?.data?.message || 'Failed to process payment and place order.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 backdrop-blur-lg transform transition-all">
                <div className="text-center mb-10">
                    <div className="bg-primary-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary-100">
                        {paymentMethod === 'Online' ? <CreditCard className="h-10 w-10 text-primary-600" /> : <ShoppingBag className="h-10 w-10 text-primary-600" />}
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Checkout</h2>
                    <p className="text-gray-500 mt-3 font-medium">Finalize your order details</p>
                </div>

                <div className="space-y-4 mb-8">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Select Payment Method</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'Online' ? 'border-primary-600 bg-primary-50 shadow-md' : 'border-gray-100 bg-gray-50 hover:bg-white'}`}>
                            <input type="radio" className="hidden" name="paymentMethod" value="Online" checked={paymentMethod === 'Online'} onChange={(e) => setPaymentMethod(e.target.value)} />
                            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'Online' ? 'border-primary-600' : 'border-gray-300'}`}>
                                {paymentMethod === 'Online' && <div className="h-3 w-3 rounded-full bg-primary-600"></div>}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Online Payment</p>
                                <p className="text-xs text-gray-500">Instant confirmation & paid status</p>
                            </div>
                        </label>

                        <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'CoD' ? 'border-primary-600 bg-primary-50 shadow-md' : 'border-gray-100 bg-gray-50 hover:bg-white'}`}>
                            <input type="radio" className="hidden" name="paymentMethod" value="CoD" checked={paymentMethod === 'CoD'} onChange={(e) => setPaymentMethod(e.target.value)} />
                            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'CoD' ? 'border-primary-600' : 'border-gray-300'}`}>
                                {paymentMethod === 'CoD' && <div className="h-3 w-3 rounded-full bg-primary-600"></div>}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Cash on Delivery</p>
                                <p className="text-xs text-gray-500">Pay when your order arrives</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 shadow-inner">
                    <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-gray-500 uppercase tracking-widest">Grand Total</span>
                        <span className="text-2xl text-primary-700">₹{finalTotal.toFixed(2)}</span>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm font-medium border border-red-100">
                        {error}
                    </div>
                )}

                <button 
                    onClick={handleDone} 
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl py-4 font-black text-xl shadow-xl shadow-primary-500/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="h-6 w-6 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="h-6 w-6" />
                            Place Order
                        </>
                    )}
                </button>
                
                <p className="text-center text-xs text-gray-400 mt-6 font-medium">
                    By clicking "Done", you agree to our mocked Terms of Service.
                </p>
            </div>
        </div>
    );
};

export default Checkout;
