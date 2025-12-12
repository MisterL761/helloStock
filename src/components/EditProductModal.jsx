import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import SupplierLogo from './SupplierLogo';

const API_BASE = import.meta.env.VITE_API_BASE || '/hello-stock/php';

const formatDateForAPI = (date) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        return date.split('/').reverse().join('-');
    }
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            throw new Error("Format de date invalide");
        }
        return d.toISOString().split('T')[0];
    } catch (e) {
        console.error("Erreur de conversion de date:", e);
        return new Date().toISOString().split('T')[0];
    }
};

const EditProductModal = ({ isOpen, onClose, product, onSave }) => {
    const [formData, setFormData] = useState({
        client: '',
        date: '',
        newPhotos: []
    });

    useEffect(() => {
        if (product) {
            setFormData({
                client: product.client || '',
                date: product.date ? formatDateForAPI(product.date) : new Date().toISOString().split('T')[0],
                newPhotos: []
            });
        }
    }, [product]);

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        setFormData({ ...formData, newPhotos: files });
    };

    const removeNewPhoto = (index) => {
        const newPhotos = formData.newPhotos.filter((_, i) => i !== index);
        setFormData({ ...formData, newPhotos: newPhotos });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.client) return;

        // Assurer que la date est au bon format
        const apiDate = formatDateForAPI(formData.date);

        try {
            // Si il y a de nouvelles photos, on utilise FormData, sinon JSON
            if (formData.newPhotos.length > 0) {
                const formDataToSend = new FormData();
                formDataToSend.append('id', product.id);
                formDataToSend.append('product', 'Produit reçu');
                formDataToSend.append('supplier', 'Fournisseur');
                formDataToSend.append('client', formData.client);
                formDataToSend.append('date', apiDate);
                formDataToSend.append('action', 'update_with_photos');

                // Ajouter les nouvelles photos
                if (formData.newPhotos.length > 0) {
                    formDataToSend.append('photo', formData.newPhotos[0]);
                    if (formData.newPhotos.length > 1) {
                        for (let i = 1; i < formData.newPhotos.length; i++) {
                            formDataToSend.append('additional_photos[]', formData.newPhotos[i]);
                        }
                    }
                }

                const response = await fetch(`${API_BASE}/received.php`, {
                    method: 'POST',
                    body: formDataToSend,
                    credentials: 'include'
                });

                const data = await response.json();
                if (data.success) {
                    onSave({
                        id: product.id,
                        product: 'Produit reçu',
                        supplier: 'Fournisseur',
                        client: formData.client,
                        date: apiDate,
                        photos_paths: data.photos_paths || []
                    });
                } else {
                    alert(`Erreur: ${data.message || "Échec de la modification"}`);
                }
            } else {

                onSave({
                    id: product.id,
                    product: 'Produit reçu',
                    supplier: 'Fournisseur',
                    client: formData.client,
                    date: apiDate
                });
            }
        } catch (err) {
            alert(`Erreur lors de la modification: ${err.message}`);
        }
    };

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800">Modifier la Réception</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                            <input
                                type="text"
                                value={formData.client}
                                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nom du client"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Photos existantes */}
                        {product.photos_paths && product.photos_paths.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Photos actuelles</label>
                                <div className="grid grid-cols-3 gap-2.5 mb-3" style={{ minWidth: "44px", minHeight: "44px" }}>
                                    {product.photos_paths.slice(0, 6).map((photo, index) => (
                                        <img
                                            key={index}
                                            src={`${API_BASE}/${photo}`}
                                            alt={`Photo ${index + 1}`}
                                            className="w-full h-16 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => window.open(`${API_BASE}/${photo}`, '_blank')}
                                        />
                                    ))}
                                    {product.photos_paths.length > 6 && (
                                        <div className="w-full h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                                            +{product.photos_paths.length - 6}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Photo existante (rétrocompatibilité) */}
                        {product.photo_path && !product.photos_paths && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Photo actuelle</label>
                                <img
                                    src={`${API_BASE}/${product.photo_path}`}
                                    alt="Photo actuelle"
                                    className="w-24 h-24 object-cover rounded border cursor-pointer hover:scale-105 transition-transform mb-3"
                                    onClick={() => window.open(`${API_BASE}/${product.photo_path}`, '_blank')}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ajouter de nouvelles photos</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Vous pouvez ajouter plusieurs nouvelles photos</p>
                        </div>

                        {/* Prévisualisation des nouvelles photos */}
                        {formData.newPhotos.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nouvelles photos sélectionnées ({formData.newPhotos.length})</label>
                                <div className="grid grid-cols-2 gap-2.5 max-h-32 overflow-y-auto" style={{ minWidth: "44px", minHeight: "44px" }}>
                                    {formData.newPhotos.map((photo, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={URL.createObjectURL(photo)}
                                                alt={`Aperçu ${index + 1}`}
                                                className="w-full h-16 object-cover rounded border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeNewPhoto(index)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                            <p className="text-xs text-gray-500 mt-1 truncate">{photo.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex space-x-3 mt-6">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                            Annuler
                        </button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProductModal;