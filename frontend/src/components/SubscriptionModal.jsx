import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import api from '../services/api';

const SubscriptionModal = ({ product, onClose }) => {
  const [frequency, setFrequency] = useState('Daily');
  const [quantity, setQuantity] = useState(product.minSubscriptionQuantity || 1);
  const [startDate, setStartDate] = useState('');
  const [customDays, setCustomDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day) => {
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter(d => d !== day));
    } else {
      setCustomDays([...customDays, day]);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!startDate) {
      setError('Please select a start date');
      return;
    }

    if (frequency === 'Custom days' && customDays.length === 0) {
      setError('Please select at least one day for Custom days frequency');
      return;
    }

    if (quantity < (product.minSubscriptionQuantity || 1)) {
        setError(`Minimum quantity is ${product.minSubscriptionQuantity || 1}`);
        return;
    }

    try {
      setLoading(true);
      await api.post('/subscriptions', {
        product: product._id,
        quantity,
        frequency,
        customDays: frequency === 'Custom days' ? customDays : [],
        startDate,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            Subscribe
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {success ? (
             <div className="text-center py-8">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               </div>
               <h4 className="text-xl font-bold text-gray-900 mb-2">Subscription Active!</h4>
               <p className="text-gray-500">Your subscription for {product.name} has been created successfully.</p>
             </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-5">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                   {product.image && product.image !== 'no-photo.jpg' ? (
                       <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                   ) : (
                       <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center"><Calendar className="h-5 w-5 text-gray-400" /></div>
                   )}
                   <div>
                       <p className="font-bold text-gray-900">{product.name}</p>
                       <p className="text-sm text-gray-500">₹{product.price} / item</p>
                   </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity per delivery</label>
                <input
                  type="number"
                  min={product.minSubscriptionQuantity || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Daily', 'Alternate days', 'Custom days'].map((freq) => (
                    <button
                      type="button"
                      key={freq}
                      onClick={() => setFrequency(freq)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        frequency === freq
                          ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {frequency === 'Custom days' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Days</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          customDays.includes(day)
                            ? 'bg-primary-100 text-primary-700 border border-primary-200'
                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 mt-6 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-primary-500/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400"
                >
                  {loading ? 'Processing...' : 'Confirm Subscription'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
