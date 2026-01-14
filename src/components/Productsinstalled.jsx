import React, { useState } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import PhotoViewer from './PhotoViewer';

const API_BASE = import.meta.env.VITE_API_BASE || '/hello-stock/php';

// Fonction pour formater la date et l'heure
const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

const ProductsInstalled = ({ installedProducts, onExport, onDeleteInstalled }) => {
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
            <div className="flex justify-between items-center mb-4 md:mb-6 flex-wrap gap-2.5"
                 style={{minWidth: "44px", minHeight: "44px"}}>
                <h3 className="text-lg font-semibold text-gray-800">Produits Posés</h3>
            </div>
            {installedProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Upload size={48} className="mx-auto mb-3 md:mb-4 opacity-50"/>
                    <p>Aucun produit posé pour le moment</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photos</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date & Heure
                            </th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {installedProducts.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.client || 'N/A'}</td>
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
                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.product}</td>
                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span
                                        className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {/* Utilisation de formatDateTime sur installed_date */}
                                        {formatDateTime(item.installed_date)}
                                    </span>
                                </td>
                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button onClick={() => onDeleteInstalled(item.id)}
                                            className="text-red-600 hover:text-red-800" title="Supprimer">
                                        <Trash2 size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Photo Viewer Modal */}
            <PhotoViewer
                isOpen={photoViewerOpen}
                onClose={() => setPhotoViewerOpen(false)}
                photos={currentPhotos}
                initialIndex={currentPhotoIndex}
                apiBase={API_BASE}
            />
        </div>
    );
}
export default ProductsInstalled;