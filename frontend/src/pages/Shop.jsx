import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShoppingCart, Search, Filter, ChevronDown, ArrowUpDown, CalendarClock } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import SubscriptionModal from '../components/SubscriptionModal';

const Shop = () => {
    const { addToCart } = React.useContext(CartContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortOption, setSortOption] = useState('name-az');
    const [subscriptionProduct, setSubscriptionProduct] = useState(null);

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

    // Extract unique categories for filter
    const categories = ['All', ...new Set(products.map(p => p.category))];

    // Sorting and Filtering Logic
    const sortedAndFilteredProducts = () => {
        let items = [...products];

        // 1. Filter by category
        if (categoryFilter !== 'All') {
            items = items.filter(p => p.category === categoryFilter);
        }

        // 2. Filter by search term
        if (searchTerm) {
            items = items.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 3. Sort items
        items.sort((a, b) => {
            if (sortOption === 'price-low-high') {
                return a.price - b.price;
            } else if (sortOption === 'price-high-low') {
                return b.price - a.price;
            } else if (sortOption === 'name-az') {
                return a.name.localeCompare(b.name);
            } else if (sortOption === 'name-za') {
                return b.name.localeCompare(a.name);
            }
            return 0;
        });

        return items;
    };

    const filteredProducts = sortedAndFilteredProducts();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Browse Products</h1>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Search grocery items..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>

                    {/* Category Filter */}
                    <div className="relative w-full sm:w-44">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="appearance-none w-full pl-10 pr-8 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm transition-all cursor-pointer text-sm font-medium text-gray-700"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Sort */}
                    <div className="relative w-full sm:w-44">
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="appearance-none w-full pl-10 pr-8 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm transition-all cursor-pointer text-sm font-medium text-gray-700"
                        >
                            <option value="name-az">A - Z</option>
                            <option value="name-za">Z - A</option>
                            <option value="price-low-high">Price: Low to High</option>
                            <option value="price-high-low">Price: High to Low</option>
                        </select>
                        <ArrowUpDown className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                        <div key={product._id} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                            <div className="relative w-full h-52 bg-gray-50 overflow-hidden">
                                {(product.image && product.image !== 'no-photo.jpg') || product.imageUrl ? (
                                    <img src={product.image || product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out bg-gray-100">
                                        <ShoppingCart className="h-12 w-12 text-gray-300" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            <div className="p-5 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">{product.name}</h3>
                                    <span className="bg-primary-50 text-primary-700 text-[10px] uppercase px-2 py-1 rounded-full font-bold tracking-wider shadow-sm border border-primary-100 whitespace-nowrap ml-2">
                                        {product.category}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed flex-grow">{product.description}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                    <span className="text-2xl font-black text-gray-900 tracking-tight">₹{product.price}</span>
                                    <div className="flex gap-2">
                                        {product.isSubscriptionEligible && (
                                            <button 
                                                onClick={() => setSubscriptionProduct(product)}
                                                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl p-2.5 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
                                                title="Subscribe to this product"
                                            >
                                                <CalendarClock className="h-5 w-5" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => addToCart(product)}
                                            className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl p-2.5 shadow-md shadow-primary-500/30 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
                                        >
                                            <ShoppingCart className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                             <ShoppingCart className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                             <p className="text-gray-500 font-medium text-lg">No grocery items found matching your filters.</p>
                             <button onClick={() => {setSearchTerm(''); setCategoryFilter('All');}} className="mt-4 text-primary-600 font-bold hover:underline">Clear all filters</button>
                        </div>
                    )}
                </div>
            )}
            
            {subscriptionProduct && (
                <SubscriptionModal 
                    product={subscriptionProduct} 
                    onClose={() => setSubscriptionProduct(null)} 
                />
            )}
        </div>
    );
};

export default Shop;
