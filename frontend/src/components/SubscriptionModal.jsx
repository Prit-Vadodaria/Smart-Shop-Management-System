import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import api from '../services/api';

const SubscriptionModal = ({ products = [], onClose }) => {
  // If products is just a single object, wrap it in array
  const items = Array.isArray(products) ? products : [products];
  const [frequency, setFrequency] = useState('Daily');
  const [quantities, setQuantities] = useState(
    items.reduce((acc, p) => ({ ...acc, [p._id]: p.minSubscriptionQuantity || 1 }), {})
  );
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

    const invalidQty = items.find(p => quantities[p._id] < (p.minSubscriptionQuantity || 1));
    if (invalidQty) {
        setError(`Minimum quantity for ${invalidQty.name} is ${invalidQty.minSubscriptionQuantity || 1}`);
        return;
    }

    try {
      setLoading(true);
      await api.post('/subscriptions/bulk', {
        items: items.map(p => ({
            product: p._id,
            quantity: quantities[p._id]
        })),
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
                <p className="text-gray-500">Your subscriptions for {items.length} item(s) have been created successfully.</p>
              </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-5">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {items.length === 1 ? 'Product' : `Products (${items.length})`}
                </label>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {items.map(p => (
                        <div key={p._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            {p.image && p.image !== 'no-photo.jpg' ? (
                                <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg" />
                            ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center"><Calendar className="h-4 w-4 text-gray-400" /></div>
                            )}
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-[10px] text-gray-500">₹{p.price}/item</p>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[10px] text-gray-400">Qty:</label>
                                        <input
                                            type="number"
                                            min={p.minSubscriptionQuantity || 1}
                                            value={quantities[p._id]}
                                            onChange={(e) => setQuantities({ ...quantities, [p._id]: Number(e.target.value) })}
                                            className="w-12 px-1 py-0.5 text-xs border border-gray-200 rounded text-center"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
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
