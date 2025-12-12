import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import SupplierLogo from './SupplierLogo';

const API_BASE = import.meta.env.VITE_API_BASE || '/hello-stock/php';

const AddToolModal = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        name: '',
        supplier: '',
        quantity: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.name && formData.supplier && formData.quantity) {
            onAdd({
                name: formData.name,
                supplier: formData.supplier,
                quantity: parseInt(formData.quantity)
            });
            setFormData({ name: '', supplier: '', quantity: '' });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800">Ajouter un Outil</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'Outil *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur *</label>
                            <input
                                type="text"
                                value={formData.supplier}
                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nom du fournisseur"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
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
                            Ajouter
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddToolModal;