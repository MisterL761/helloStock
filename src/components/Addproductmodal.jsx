import React, { useState } from 'react';
import { X, Loader } from 'lucide-react';
import api from '../utils/Apiclient';

const compressImage = async (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1280;
                const MAX_HEIGHT = 1280;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    const newFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    resolve(newFile);
                }, 'image/jpeg', 0.7);
            };
        };
    });
};

const formatDateForAPI = (date) => {
    if (!date) return new Date().toISOString().split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return date.split('/').reverse().join('-');
    try {
        return new Date(date).toISOString().split('T')[0];
    } catch {
        return new Date().toISOString().split('T')[0];
    }
};

const AddProductModal = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        client: '',
        photos: [],
        date: new Date().toISOString().split('T')[0]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [processingImages, setProcessingImages] = useState(false);

    const handlePhotoChange = async (e) => {
        setProcessingImages(true);
        const files = Array.from(e.target.files);
        const compressedFiles = await Promise.all(files.map(file => compressImage(file)));
        setFormData(prev => ({ ...prev, photos: [...prev.photos, ...compressedFiles] }));
        setProcessingImages(false);
    };

    const removePhoto = (index) => {
        const newPhotos = formData.photos.filter((_, i) => i !== index);
        setFormData({ ...formData, photos: newPhotos });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.client || isSubmitting) return;

        setIsSubmitting(true);
        const apiDate = formatDateForAPI(formData.date);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('client', formData.client);
            formDataToSend.append('date', apiDate);

            if (formData.photos.length > 0) {
                formDataToSend.append('photo', formData.photos[0]);
                if (formData.photos.length > 1) {
                    for (let i = 1; i < formData.photos.length; i++) {
                        formDataToSend.append('additional_photos[]', formData.photos[i]);
                    }
                }
            }

            const data = await api.productsReceived.add(formDataToSend);

            if (data.success) {
                onAdd({
                    id: data.id,
                    product: 'Commande',
                    supplier: 'Dépôt',
                    client: formData.client,
                    photo_path: data.photo_path || null,
                    photos_paths: data.photos_paths || [],
                    date: new Date(apiDate).toLocaleDateString('fr-FR'),
                    status: 'Reçu'
                });
                setFormData({ client: '', photos: [], date: new Date().toISOString().split('T')[0] });
                onClose();
            } else {
                alert(`Erreur: ${data.message || "Erreur inconnue"}`);
            }
        } catch (err) {
            alert(`Erreur lors de l'ajout: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800">Ajouter une Réception</h3>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Photos de la Commande</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {processingImages && <p className="text-xs text-blue-600 mt-1">Traitement des images...</p>}
                        </div>

                        {formData.photos.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                {formData.photos.map((photo, index) => (
                                    <div key={index} className="relative">
                                        <img src={URL.createObjectURL(photo)} alt="Aperçu" className="w-full h-16 object-cover rounded border" />
                                        <button type="button" onClick={() => removePhoto(index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex space-x-3 mt-6">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Annuler</button>
                        <button type="submit" disabled={isSubmitting || processingImages} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex justify-center items-center">
                            {isSubmitting ? <Loader className="animate-spin h-5 w-5" /> : 'Ajouter'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProductModal;
