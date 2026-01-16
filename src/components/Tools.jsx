import React, { useState, useEffect } from 'react';
import { Plus, Search, Drill, Edit, Trash2 } from 'lucide-react';
import ActionButtons from './ActionButtons';
import SupplierLogo from './SupplierLogo';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_BASE = API_BASE_URL.replace('/api', '');

const Tools = ({ toolsItems, onAddTool, onEditTool, onDeleteTool }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <div className="flex justify-between items-center mb-4 md:mb-6 flex-wrap gap-2.5" style={{ minWidth: "44px", minHeight: "44px" }}>
                <h3 className="text-lg font-semibold text-gray-800">Outils </h3>
                <div className="flex space-x-3">
                    <button onClick={onAddTool} className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center text-sm">
                        <Plus className="mr-1 md:mr-2" size={18} /> <span className="hidden md:inline">Ajouter Outil</span> <span className="inline md:hidden">+</span>
                    </button>
                </div>
            </div>
            {toolsItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Search size={48} className="mx-auto mb-3 md:mb-4 opacity-50" />
                    <p>Aucun outil enregistré</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {toolsItems.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.supplier}</td>
                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                                <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex space-x-2">
                                        <button onClick={() => onEditTool(item)} className="text-yellow-600 hover:text-yellow-800" title="Modifier">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => onDeleteTool(item.id)} className="text-red-600 hover:text-red-800" title="Supprimer">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Tools;