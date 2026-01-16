import React, { useState } from 'react';
import { Plus, AlertCircle, Trash2 } from 'lucide-react';
import PhotoViewer from './PhotoViewer';
import StatusBadge from './StatusBadge';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_BASE = API_BASE_URL.replace('/api', '');

const ProductsDefective = ({ defectiveProducts, onExport, onDeleteDefective, onAddDefectiveProduct }) => {
    const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
    const [currentPhotos, setCurrentPhotos] = useState([]);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const openPhotoViewer = (photos, initialIndex = 0) => {
        setCurrentPhotos(photos);
        setCurrentPhotoIndex(initialIndex);
        setPhotoViewerOpen(true);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6">
            <div className="flex justify-between items-center mb-4 md:mb-6 flex-wrap gap-2.5" style={{ minWidth: "44px", minHeight: "44px" }}>
                <h3 className="text-lg font-semibold text-gray-800">Produits Défectueux</h3>
                <div className="flex space-x-3">
                    <button onClick={onAddDefectiveProduct} className="bg-red-600 hover:bg-red-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center text-sm">
                        <Plus className="mr-1 md:mr-2" size={18} />
                        <span className="hidden md:inline">Ajouter Défectueux</span>
                        <span className="inline md:hidden">+</span>
                    </button>
                </div>
            </div>
            {defectiveProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <AlertCircle size={48} className="mx-auto mb-3 md:mb-4 opacity-50" />
                    <p>Aucun produit défectueux pour le moment</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photos</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Réception</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Signalement</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {defectiveProducts.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.client}</td>
                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.photos_paths && item.photos_paths.length > 0 ? (
                                        <div className="flex items-center space-x-1">
                                            {item.photos_paths.slice(0, 3).map((photo, index) => (
                                                <img
                                                    key={index}
                                                    src={`${API_BASE}/${photo}`}
                                                    alt={`Photo ${index + 1}`}
                                                    className="w-12 h-12 object-cover rounded cursor-pointer hover:scale-105 transition-transform border"
                                                    onClick={() => openPhotoViewer(item.photos_paths, index)}
                                                />
                                            ))}
                                            {item.photos_paths.length > 3 && (
                                                <button
                                                    onClick={() => openPhotoViewer(item.photos_paths, 3)}
                                                    className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500 hover:bg-gray-200 transition-colors border cursor-pointer"
                                                >
                                                    +{item.photos_paths.length - 3}
                                                </button>
                                            )}
                                        </div>
                                    ) : item.photo_path ? (
                                        <img
                                            src={`${API_BASE}/${item.photo_path}`}
                                            alt="Photo commande"
                                            className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform border"
                                            onClick={() => openPhotoViewer([item.photo_path], 0)}
                                        />
                                    ) : (
                                        <span className="text-gray-400 italic">Aucune photo</span>
                                    )}
                                </td>
                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                            {item.defectiveDate}
                                        </span>
                                </td>
                                <td className="px-4 md:px-6 py-4 whitespace-nowrap"><StatusBadge status="Défectueux" /></td>
                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button onClick={() => onDeleteDefective(item.id)} className="text-red-600 hover:text-red-800" title="Supprimer">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            <PhotoViewer
                isOpen={photoViewerOpen}
                onClose={() => setPhotoViewerOpen(false)}
                photos={currentPhotos}
                initialIndex={currentPhotoIndex}
                apiBase={API_BASE}
            />
        </div>
    );
};

export default ProductsDefective;