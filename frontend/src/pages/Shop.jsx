import React, { useState, useEffect } from 'react';
import api from '../shared/services/api';
import { getProductImageUrl, hasProductImage } from '../shared/utils/productImage';
import { ShoppingCart, Search, Filter, ChevronDown, ArrowUpDown, CalendarClock, CheckCircle } from 'lucide-react';
import { CartContext } from '../context/CartContext';

const Shop = () => {
    const { addToCart } = React.useContext(CartContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortOption, setSortOption] = useState('name-az');
    const [quantities, setQuantities] = useState({});
    const [addedStates, setAddedStates] = useState({});
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await api.get('/products');
                setProducts(data.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching products', error);
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const categories = ['All', ...new Set(products.map(p => p.category))];

    const sortedAndFilteredProducts = () => {
        let items = [...products];
        if (categoryFilter !== 'All') {
            items = items.filter(p => p.category === categoryFilter);
        }
        if (searchTerm) {
            items = items.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        items.sort((a, b) => {
            if (sortOption === 'price-low-high') return a.price - b.price;
            if (sortOption === 'price-high-low') return b.price - a.price;
            if (sortOption === 'name-az') return a.name.localeCompare(b.name);
            if (sortOption === 'name-za') return b.name.localeCompare(a.name);
            if (sortOption === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            return 0;
        });
        return items;
    };

    const handleIncrement = (productId) => {
        const product = products.find(p => p._id === productId);
        if (!product) return;
        const currentQty = quantities[productId] || 1;
        if (currentQty < product.countInStock) {
            setQuantities({ ...quantities, [productId]: currentQty + 1 });
        }
    };

    const handleDecrement = (productId) => {
        const currentQty = quantities[productId] || 1;
        if (currentQty > 1) {
            setQuantities({ ...quantities, [productId]: currentQty - 1 });
        }
    };

    const handleAddToCart = (product) => {
        const qty = quantities[product._id] || 1;
        addToCart(product, qty);
        
        // Show success state on button
        setAddedStates(prev => ({ ...prev, [product._id]: true }));
        
        // Trigger Toast notification
        setToastMessage(`Added ${qty} ${product.name} to cart!`);
        
        // Reset button state and quantity after 1.5 seconds
        setTimeout(() => {
            setAddedStates(prev => ({ ...prev, [product._id]: false }));
            setQuantities(prev => ({ ...prev, [product._id]: 1 }));
        }, 1500);
    };

    const filteredProducts = sortedAndFilteredProducts();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Grocery Market</h1>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Search fresh items..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    </div>

                    <div className="relative w-full sm:w-44">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="appearance-none w-full pl-10 pr-8 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm transition-all cursor-pointer text-sm font-medium text-gray-700"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <Filter className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                        <ChevronDown className="absolute right-3.5 top-3.5 h-3 w-3 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative w-full sm:w-48">
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="appearance-none w-full pl-10 pr-8 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm transition-all cursor-pointer text-sm font-medium text-gray-700"
                        >
                            <option value="name-az">Name: A to Z</option>
                            <option value="name-za">Name: Z to A</option>
                            <option value="price-low-high">Price: Low to High</option>
                            <option value="price-high-low">Price: High to Low</option>
                            <option value="newest">Newest First</option>
                        </select>
                        <ArrowUpDown className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                        <ChevronDown className="absolute right-3.5 top-3.5 h-3 w-3 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Results count summary */}
            {!loading && (
                <div className="mb-6 flex justify-between items-center text-sm text-gray-500 font-medium bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
                    <div>
                        {searchTerm || categoryFilter !== 'All' ? (
                            <span>Showing <strong className="text-gray-900">{filteredProducts.length}</strong> filtered product{filteredProducts.length !== 1 ? 's' : ''}</span>
                        ) : (
                            <span>Showing <strong className="text-gray-900">{filteredProducts.length}</strong> of <strong className="text-gray-900">{products.length}</strong> products</span>
                        )}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {filteredProducts.map(product => {
                        const stock = product.countInStock || 0;
                        const isOutOfStock = stock <= 0;
                        const isLowStock = stock > 0 && stock <= (product.minStockThreshold || 5);
                        const qty = quantities[product._id] || 1;

                        return (
                            <div key={product._id} className={`bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col ${isOutOfStock ? 'opacity-70 grayscale-[20%]' : ''}`}>
                                <div className="relative w-full h-56 overflow-hidden bg-gray-50">
                                    {hasProductImage(product.image || product.imageUrl) ? (
                                        <img src={getProductImageUrl(product.image || product.imageUrl)} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                            <ShoppingCart className="h-12 w-12 text-gray-200" />
                                        </div>
                                    )}
                                    {isOutOfStock ? (
                                        <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm z-10">
                                            Out of Stock
                                        </div>
                                    ) : isLowStock ? (
                                        <div className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm animate-pulse z-10">
                                            Low in Stock ({stock} left)
                                        </div>
                                    ) : (
                                        <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm z-10">
                                            In Stock
                                        </div>
                                    )}
                                    {product.isSubscriptionEligible && (
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-primary-50 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                                            <CalendarClock className="h-3.5 w-3.5 text-primary-600" />
                                            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Subscription Ready</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 mb-1 block">{product.category}</span>
                                        {product.isSubscriptionEligible && <CheckCircle className="h-4 w-4 text-green-500" title="Eligible for subscription" />}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">{product.name}</h3>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed flex-grow">{product.description}</p>
                                    
                                    {/* Tax & Unit information */}
                                    <div className="flex items-center justify-between mb-4 text-xs font-semibold text-gray-400">
                                        <span>₹{product.price} / unit</span>
                                        {product.taxPercentage > 0 && (
                                            <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-100">
                                                Tax: {product.taxPercentage}% included
                                            </span>
                                        )}
                                    </div>

                                    {/* Compact Quantity Selector */}
                                    {!isOutOfStock && (
                                        <div className="flex items-center justify-between mb-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                                            <span className="text-xs font-bold text-gray-500 ml-2">Quantity</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    disabled={qty <= 1}
                                                    onClick={() => handleDecrement(product._id)}
                                                    className="w-8 h-8 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700 transition-colors disabled:opacity-40"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center text-sm font-extrabold text-gray-900">{qty}</span>
                                                <button
                                                    type="button"
                                                    disabled={qty >= stock}
                                                    onClick={() => handleIncrement(product._id)}
                                                    className="w-8 h-8 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700 transition-colors disabled:opacity-40"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-5 border-t border-gray-50 mt-auto">
                                        <span className="text-2xl font-black text-gray-900 tracking-tight">₹{product.price * qty}</span>
                                        <button 
                                            disabled={isOutOfStock || addedStates[product._id]}
                                            onClick={() => handleAddToCart(product)}
                                            className={`rounded-2xl px-5 py-3 shadow-lg transition-all duration-300 flex items-center gap-2 group/btn ${
                                                isOutOfStock 
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                                                    : addedStates[product._id]
                                                        ? 'bg-emerald-500 text-white shadow-emerald-100'
                                                        : 'bg-gray-900 hover:bg-primary-600 text-white shadow-gray-200 hover:scale-105 active:scale-95'
                                            }`}
                                        >
                                            <span className="text-sm font-bold">
                                                {isOutOfStock ? 'Out of Stock' : addedStates[product._id] ? '✓ Added' : 'Add to Cart'}
                                            </span>
                                            {!isOutOfStock && !addedStates[product._id] && (
                                                <ShoppingCart className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {filteredProducts.length === 0 && !loading && (
                <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Search className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No items found</h3>
                    <p className="text-gray-500 mb-6">Try adjusting your search or filters.</p>
                    <button onClick={() => {setSearchTerm(''); setCategoryFilter('All');}} className="text-primary-600 font-bold hover:underline">Reset all filters</button>
                </div>
            )}
            {/* Custom Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
            )}
        </div>
    );
};

export default Shop;
