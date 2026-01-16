import React, { useState } from 'react';
import { Plus, Search, Upload } from 'lucide-react';
import PhotoViewer from './PhotoViewer';
import StatusBadge from './StatusBadge';
import ActionButtons from './ActionButtons';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_BASE = API_BASE_URL.replace('/api', '');

const ProductsReceived = ({ products, onMarkAsInstalled, onMarkAsDefective, onAddProduct, onExport, onEditProduct, onDeleteProduct }) => {
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
                <h3 className="text-lg font-semibold text-gray-800">Produits Reçus</h3>
                <div className="flex space-x-3">
                    <button onClick={onAddProduct} className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center text-sm">
                        <Plus className="mr-1 md:mr-2" size={18} /> <span className="hidden md:inline">Ajouter</span> <span className="inline md:hidden">+</span>
                    </button>
                </div>
            </div>
            {products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Search size={48} className="mx-auto mb-3 md:mb-4 opacity-50" />
                    <p>Aucun résultat trouvé</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photos</th>
                                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {products.map((item) => (
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
                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap"><StatusBadge status={item.status} /></td>
                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => onMarkAsInstalled(item.id)} className="bg-green-600 hover:bg-green-700 text-white px-2 md:px-3 py-1.5 rounded-lg flex items-center text-sm">
                                                <Upload className="mr-1" size={16} /> <span className="hidden md:inline">Posé</span>
                                            </button>
                                            <ActionButtons onEdit={() => onEditProduct(item)} onDelete={() => onDeleteProduct(item.id)} />
                                        </div>
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

export default ProductsReceived;
