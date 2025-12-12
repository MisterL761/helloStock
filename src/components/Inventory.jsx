import React, { useState, useEffect } from 'react';
import { Plus, Download, Package, DollarSign, AlertTriangle, Search, Edit, Trash2, Box, CheckCircle, XCircle } from 'lucide-react';
import StatsCard from './StatsCard';
import SupplierLogo from './SupplierLogo';
import ActionButtons from './ActionButtons';
import StatusBadge from './StatusBadge';

const API_BASE = import.meta.env.VITE_API_BASE || '/hello-stock/php';

const Inventory = ({ inventoryItems, stats, onAddArticle, onExport, onEditArticle, onDeleteArticle, onUpdateStock, onBulkEdit }) => {
    const [supplierFilter, setSupplierFilter] = useState('');

    // Extraire les fournisseurs uniques pour le filtre
    const uniqueSuppliers = [...new Set(inventoryItems.map(item => item.supplier))].filter(Boolean);

    // Filtrer les articles par fournisseur
    const filteredItems = supplierFilter ? inventoryItems.filter(item => item.supplier === supplierFilter) : inventoryItems;

    // Fonction d'impression
    const handlePrint = () => {
        const isWurthFilter = supplierFilter === 'Wurth';
        const itemsToPrint = isWurthFilter ? inventoryItems.filter(i => i.supplier === 'Wurth') : filteredItems;

        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
      <html>
        <head>
          <title>Inventaire - ${isWurthFilter ? 'Wurth' : supplierFilter ? supplierFilter : 'Tout'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #1f2937; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .status { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .Disponible { background: #d1fae5; color: #065f46; }
            .Faible { background: #fef3c7; color: #92400e; }
            .Rupture { background: #fee2e2; color: #991b1b; }
            @media print {
              body { margin: 10mm; }
              @page { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <h1>Inventaire - ${isWurthFilter ? 'Wurth' : supplierFilter ? supplierFilter : 'Tous les fournisseurs'}</h1>
          <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
          <p><strong>Total articles :</strong> ${itemsToPrint.length}</p>
          <table>
            <thead>
              <tr>
                <th>Matériel</th>
                <th>Fournisseur</th>
                <th>Catégorie</th>
                <th>Stock</th>
                <th>Seuil</th>
                <th>Prix (€)</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${itemsToPrint.map(item => `
                <tr>
                  <td>${item.material}</td>
                  <td>${item.supplier}</td>
                  <td>${item.category}</td>
                  <td>${item.stock}</td>
                  <td>${item.threshold}</td>
                  <td>${item.price ? parseFloat(item.price).toFixed(2) + '€' : 'N/A'}</td>
                  <td><span class="status ${item.status === 'Disponible' ? 'Disponible' : item.status.includes('Faible') ? 'Faible' : 'Rupture'}">${item.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 xl:p-8">
            <div className="flex justify-between items-center mb-4 md:mb-6 xl:mb-8 flex-wrap gap-2.5" style={{ minWidth: "44px", minHeight: "44px" }}>
                <h3 className="text-lg md:text-xl xl:text-2xl font-semibold text-gray-800">Inventaire</h3>
                <div className="flex space-x-3">
                    <button
                        onClick={onAddArticle}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 xl:px-6 py-2 xl:py-2.5 rounded-lg flex items-center text-sm xl:text-base"
                    >
                        <Plus className="mr-1 md:mr-2" size={18} />
                        <span className="hidden md:inline">Ajouter Article</span>
                        <span className="inline md:hidden">+</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 xl:px-6 py-2 xl:py-2.5 rounded-lg flex items-center text-sm xl:text-base"
                        title="Imprimer la liste"
                    >
                        <Download className="mr-1 md:mr-2" size={18} />
                        <span className="hidden md:inline">Imprimer</span>
                        <span className="inline md:hidden">Print</span>
                    </button>
                </div>
            </div>

            {/* Filtre par fournisseur */}
            <div className="mb-3 md:mb-4 xl:mb-6">
                <label className="block text-sm xl:text-base font-medium text-gray-700 mb-2">Filtrer par fournisseur</label>
                <select
                    value={supplierFilter}
                    onChange={(e) => setSupplierFilter(e.target.value)}
                    className="w-full md:w-64 xl:w-80 px-3 xl:px-4 py-2 xl:py-2.5 text-sm xl:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">Tous les fournisseurs</option>
                    {uniqueSuppliers.map(supplier => (
                        <option key={supplier} value={supplier}>{supplier}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4 xl:gap-6 mb-4 md:mb-6 xl:mb-8">
                <StatsCard title="Articles en Stock" value={stats.total} icon={Box} color="blue" />
                <StatsCard title="Disponible" value={stats.available} icon={CheckCircle} color="green" />
                <StatsCard title="Faible Stock" value={stats.lowStock} icon={AlertTriangle} color="yellow" />
                <StatsCard title="Rupture" value={stats.outOfStock} icon={XCircle} color="red" />
            </div>

            {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Search size={48} className="mx-auto mb-3 md:mb-4 opacity-50" />
                    <p>Aucun résultat trouvé</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-[11px] xl:text-base table-fixed">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="pl-1 pr-0 xl:px-8 py-1 xl:py-4 text-left text-[10px] xl:text-sm font-medium text-gray-500 uppercase w-[14%]">Matériel</th>
                            <th className="px-1 xl:px-8 py-1 xl:py-4 text-left text-[10px] xl:text-sm font-medium text-gray-500 uppercase w-[8%]">Frs.</th>
                            <th className="px-1 xl:px-8 py-1 xl:py-4 text-left text-[10px] xl:text-sm font-medium text-gray-500 uppercase w-[10%]">Cat.</th>
                            <th className="px-1 xl:px-8 py-1 xl:py-4 text-left text-[10px] xl:text-sm font-medium text-gray-500 uppercase w-[15%]">Stock</th>
                            <th className="px-1 xl:px-8 py-1 xl:py-4 text-left text-[10px] xl:text-sm font-medium text-gray-500 uppercase w-[8%]">Seuil</th>
                            <th className="px-1 xl:px-8 py-1 xl:py-4 text-left text-[10px] xl:text-sm font-medium text-gray-500 uppercase w-[10%]">Prix</th>
                            <th className="px-1 xl:px-8 py-1 xl:py-4 text-left text-[10px] xl:text-sm font-medium text-gray-500 uppercase w-[35%]">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredItems.map((item) => {
                            // Déterminer la couleur de fond selon le statut
                            const getRowBgColor = (status) => {
                                if (status === 'Rupture' || status.includes('Rupture')) {
                                    return 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500';
                                } else if (status === 'Faible Stock' || status.includes('Faible')) {
                                    return 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-500';
                                } else if (status === 'Disponible') {
                                    return 'bg-green-50 hover:bg-green-100 border-l-4 border-green-500';
                                }
                                return 'bg-white hover:bg-gray-50';
                            };

                            return (
                                <tr key={item.id} className={`transition-all duration-200 ${getRowBgColor(item.status)}`}>
                                    <td className="pl-1 pr-0 xl:px-8 py-1.5 xl:py-5">
                                        <div className="text-[11px] xl:text-base font-semibold text-gray-900 truncate">{item.material}</div>
                                    </td>
                                    <td className="px-1 xl:px-8 py-1.5 xl:py-5">
                                        <SupplierLogo supplier={item.supplier} className="h-5 xl:h-10 w-auto object-contain" />
                                    </td>
                                    <td className="px-1 xl:px-8 py-1.5 xl:py-5">
                                        <span className="text-[11px] xl:text-base text-gray-700 font-medium truncate">{item.category}</span>
                                    </td>
                                    <td className="px-1 xl:px-8 py-1.5 xl:py-5">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] xl:text-base font-bold text-gray-900">{item.stock}</span>
                                                <span className="text-[10px] xl:text-xs text-gray-500">/{item.threshold}</span>
                                            </div>
                                            {/* Barre de progression */}
                                            <div className="w-full bg-gray-200 rounded-full h-1 xl:h-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        item.stock === 0 ? 'bg-red-500' :
                                                            item.stock < item.threshold ? 'bg-yellow-500' :
                                                                'bg-green-500'
                                                    }`}
                                                    style={{ width: `${Math.min((item.stock / (item.threshold * 2)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-1 xl:px-8 py-1.5 xl:py-5">
                                        <span className="text-[11px] xl:text-base text-gray-700">{item.threshold}</span>
                                    </td>
                                    <td className="px-1 xl:px-8 py-1.5 xl:py-5">
                                        <span className="text-[11px] xl:text-base font-semibold text-gray-900">
                                            {item.price ? `${parseFloat(item.price).toFixed(2)}€` : 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-1 xl:px-8 py-1.5 xl:py-5">
                                        <ActionButtons
                                            onUpdateStock={() => onUpdateStock(item.id)}
                                            onEdit={() => onEditArticle(item.id)}
                                            onDelete={() => onDeleteArticle(item.id)}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Inventory;