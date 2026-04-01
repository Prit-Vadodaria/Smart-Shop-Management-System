import React, { useState, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { CreditCard, CheckCircle, Loader2 } from 'lucide-react';
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
                paymentMethod: 'UPI',
                orderType: orderType || 'Takeaway',
                itemsPrice: cartTotalPrice,
                taxPrice: totalTaxAmount,
                shippingPrice: finalShippingFee,
                totalPrice: finalTotal
            };

            await api.post('/orders', orderData);
            
            // Clear cart and redirect
            clearCart();
            // Need a slight timeout to let the db register optionally, or directly navigate
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
                        <CreditCard className="h-10 w-10 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Payment Gateway</h2>
                    <p className="text-gray-500 mt-3 font-medium">Securely completing your transaction</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 shadow-inner">
                    <p className="text-center text-lg font-bold text-gray-700 italic">
                        "this is the payment gateway"
                    </p>
                    <div className="mt-6 flex justify-between items-center text-sm font-bold border-t border-gray-200 pt-4">
                        <span className="text-gray-500 uppercase tracking-widest">Amount to Pay</span>
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
                            Done
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
