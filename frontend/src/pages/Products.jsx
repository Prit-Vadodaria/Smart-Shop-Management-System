import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, Plus, Search, Edit2, Trash2, X, Filter, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';


const defaultFormData = {
    name: '',
    brand: '',
    category: '',
    description: '',
    price: 0,
    taxPercentage: 0,
    countInStock: 0,
    minStockThreshold: 10,
    imageUrl: '',
    isSubscriptionEligible: false,
    minSubscriptionQuantity: 1
};

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState(defaultFormData);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/products');
            setProducts(data.data);
        } catch (error) {
            console.error('Error fetching products', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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
            items = items.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        // 3. Sort items
        if (sortConfig.key) {
            items.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return items;
    };

    const filteredProducts = sortedAndFilteredProducts();

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <div className="w-4 h-4 ml-1 opacity-20"><ArrowUp className="h-4 w-4" /></div>;
        return sortConfig.direction === 'asc' 
            ? <ArrowUp className="h-4 w-4 ml-1 text-primary-600" /> 
            : <ArrowDown className="h-4 w-4 ml-1 text-primary-600" />;
    };

    // Handlers
    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name || '',
                brand: product.brand || '',
                category: product.category || 'Groceries',
                description: product.description || '',
                price: product.price || 0,
                taxPercentage: product.taxPercentage || 0,
                countInStock: product.countInStock || 0,
                minStockThreshold: product.minStockThreshold || 10,
                imageUrl: product.image || product.imageUrl || '', // Backend schema uses 'image'
                isSubscriptionEligible: product.isSubscriptionEligible || false,
                minSubscriptionQuantity: product.minSubscriptionQuantity || 1
            });
        } else {
            setEditingProduct(null);
            setFormData(defaultFormData);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSubmit = { ...formData, image: formData.imageUrl };

            if (editingProduct) {
                await api.put(`/products/${editingProduct._id}`, dataToSubmit);
            } else {
                await api.post('/products', dataToSubmit);
            }

            closeModal();
            fetchProducts();
        } catch (error) {
            console.error('Error saving product', error);
            const errorMessage = error.response?.data?.message || 'Failed to save product. Check console.';
            alert(`Error: ${errorMessage}`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to permanently delete this product?')) {
            try {
                await api.delete(`/products/${id}`);
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product', error);
                alert('Failed to delete product. Check console.');
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>

                    <div className="relative">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="appearance-none w-full sm:w-48 pl-10 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all cursor-pointer text-sm font-medium text-gray-700"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>

                    <button onClick={() => openModal()} className="btn-primary flex justify-center items-center shadow-md whitespace-nowrap">
                        <Plus className="h-5 w-5 mr-1" /> Add Product
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th 
                                        onClick={() => requestSort('name')}
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-primary-600 transition-colors"
                                    >
                                        <div className="flex items-center">Product Name {getSortIcon('name')}</div>
                                    </th>
                                    <th 
                                        onClick={() => requestSort('category')}
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-primary-600 transition-colors"
                                    >
                                        <div className="flex items-center">Category {getSortIcon('category')}</div>
                                    </th>
                                    <th 
                                        onClick={() => requestSort('price')}
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-primary-600 transition-colors"
                                    >
                                        <div className="flex items-center">Price (₹) {getSortIcon('price')}</div>
                                    </th>
                                    <th 
                                        onClick={() => requestSort('countInStock')}
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-primary-600 transition-colors"
                                    >
                                        <div className="flex items-center">Stock {getSortIcon('countInStock')}</div>
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Sub Eligible</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProducts.map(product => (
                                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 mr-3">
                                                    {((product.image && product.image !== 'no-photo.jpg') || product.imageUrl) ? (
                                                        <img className="h-10 w-10 rounded-full object-cover border border-gray-200" src={product.image || product.imageUrl} alt={product.name} />
                                                    ) : (
                                                        <div className="bg-gray-100 h-10 w-10 rounded-full flex items-center justify-center">
                                                            <Package className="h-5 w-5 text-gray-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                            ₹{product.price}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-sm font-bold ${product.countInStock <= product.minStockThreshold ? 'text-red-600' : 'text-green-600'}`}>
                                                {product.countInStock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {product.isSubscriptionEligible ? (
                                                <span className="text-green-600 font-bold tabular-nums">Yes (Min: {product.minSubscriptionQuantity})</span>
                                            ) : (
                                                <span className="text-gray-400">No</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => openModal(product)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-md mr-2 transition-colors">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(product._id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-md transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredProducts.length === 0 && (
                            <div className="text-center py-10 text-gray-500">
                                No products found.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors bg-white hover:bg-gray-100 p-1.5 rounded-full shadow-sm">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Basic Info</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                        <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="Organic Apples" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                            <select name="category" required value={formData.category} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
                                                <option value="" disabled>Select Category</option>
                                                <option value="Groceries">Groceries</option>
                                                <option value="Dairy">Dairy</option>
                                                <option value="Bakery">Bakery</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                                            <input type="text" name="brand" required value={formData.brand} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="FarmFresh" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                        <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="/images/apples.png or http://..." />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea name="description" required value={formData.description} onChange={handleChange} rows="3" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="Product details..."></textarea>
                                    </div>
                                </div>

                                {/* Pricing & Inventory */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Pricing & Inventory</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                            <input type="number" name="price" min="0" step="0.01" required value={formData.price} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax (%)</label>
                                            <input type="number" name="taxPercentage" min="0" max="100" value={formData.taxPercentage} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Count</label>
                                            <input type="number" name="countInStock" min="0" required value={formData.countInStock} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Threshold</label>
                                            <input type="number" name="minStockThreshold" min="0" required value={formData.minStockThreshold} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                                        </div>
                                    </div>

                                    <div className="bg-primary-50 p-4 rounded-xl mt-4 border border-primary-100">
                                        <div className="flex items-center mb-3">
                                            <input type="checkbox" id="isSubscriptionEligible" name="isSubscriptionEligible" checked={formData.isSubscriptionEligible} onChange={handleChange} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                                            <label htmlFor="isSubscriptionEligible" className="ml-2 block text-sm font-bold text-primary-900 border-0">
                                                Eligible for Auto-Delivery
                                            </label>
                                        </div>

                                        {formData.isSubscriptionEligible && (
                                            <div>
                                                <label className="block text-xs font-semibold text-primary-700 mb-1">Minimum Subscription Quantity</label>
                                                <input type="number" name="minSubscriptionQuantity" min="1" value={formData.minSubscriptionQuantity} onChange={handleChange} className="w-full px-3 py-1.5 rounded border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 pt-5 border-t border-gray-100">
                                <button type="button" onClick={closeModal} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md shadow-primary-500/30 transition-all active:scale-95">
                                    {editingProduct ? 'Save Changes' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
