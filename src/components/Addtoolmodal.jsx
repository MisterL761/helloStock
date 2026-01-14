import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import SupplierLogo from './SupplierLogo';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_BASE = API_BASE_URL.replace('/api', '');

const EditArticleModal = ({ isOpen, onClose, article, onSave }) => {
    const [formData, setFormData] = useState({
        material: '',
        supplier: 'Wurth',
        category: '',
        stock: '',
        threshold: '',
        price: ''
    });

    // Initialiser le formulaire lorsque l'article change
    useEffect(() => {
        if (article) {
            setFormData({
                material: article.material || '',
                supplier: article.supplier || 'Wurth',
                category: article.category || '',
                stock: article.stock || '',
                threshold: article.threshold || '',
                price: article.price || ''
            });
        }
    }, [article]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.material || !formData.supplier || !formData.category || !formData.stock || !formData.threshold) {
            return;
        }

        onSave({
            id: article.id,
            material: formData.material,
            supplier: formData.supplier,
            category: formData.category,
            stock: parseInt(formData.stock),
            threshold: parseInt(formData.threshold),
            price: formData.price ? parseFloat(formData.price) : null
        });
    };

    if (!isOpen || !article) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800">Modifier l'Article</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Matériel *</label>
                            <input
                                type="text"
                                value={formData.material}
                                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur *</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'Wurth', logo: './logos/wurth.webp' },
                                    { value: 'Rekka', logo: './logos/reca.jpeg' },
                                    { value: 'yess', logo: './logos/yess.png' },
                                    { value: 'trenois', logo: './logos/trenois.jpg' },
                                    { value: 'pointp', logo: './logos/pointp.png' },
                                    { value: 'boschat', logo: './logos/boschat.jpeg' },
                                    { value: 'berner', logo: './logos/berner.jpg' },
                                    { value: 'somfy', logo: './logos/somfy.png' }
                                ].map((supplier) => (
                                    <button
                                        key={supplier.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, supplier: supplier.value })}
                                        className={`p-3 border-2 rounded-lg transition-all flex items-center justify-center ${
                                            formData.supplier === supplier.value
                                                ? 'border-blue-500 bg-blue-50 scale-105'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        title={supplier.value}
                                    >
                                        <img
                                            src={supplier.logo}
                                            alt={supplier.value}
                                            className="h-10 w-auto object-contain"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="40"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="12" fill="%23666"%3E' + supplier.value + '%3C/text%3E%3C/svg%3E';
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: Visserie, Fixation, Plâtrerie..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actuel *</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Seuil Minimum *</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.threshold}
                                onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Prix optionnel"
                            />
                        </div>
                    </div>
                    <div className="flex space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditArticleModal;

