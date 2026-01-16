import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, CheckCircle } from 'lucide-react';
import SupplierLogo from './SupplierLogo';
import StatusBadge from './StatusBadge';
import api from '../utils/Apiclient';

const Orders = ({ inventoryItems, onToggleOrder }) => {
    const [orderedItems, setOrderedItems] = useState(new Set());
    const [orderedQuantities, setOrderedQuantities] = useState({});

    const itemsToOrder = inventoryItems.filter(item => item.status === 'Faible Stock' || item.status === 'Rupture');
    const rekkaItems = itemsToOrder.filter(item => item.supplier === 'Rekka');
    const wurthItems = itemsToOrder.filter(item => item.supplier === 'Wurth');
    const yessItems = itemsToOrder.filter(item => item.supplier === 'yess');
    const trenoisItems = itemsToOrder.filter(item => item.supplier === 'trenois');
    const pointpItems = itemsToOrder.filter(item => item.supplier === 'pointp');
    const boschatItems = itemsToOrder.filter(item => item.supplier === 'boschat');
    const bernerItems = itemsToOrder.filter(item => item.supplier === 'berner');

    useEffect(() => {
        loadExistingOrders();
    }, [inventoryItems]);

    const loadExistingOrders = async () => {
        try {
            const orders = await api.orders.getAll();

            if (Array.isArray(orders)) {
                const orderedSet = new Set();
                const quantities = {};

                orders.forEach(order => {
                    if (order.is_ordered) {
                        orderedSet.add(order.inventory_id);
                        quantities[order.inventory_id] = order.ordered_quantity;
                    }
                });

                setOrderedItems(orderedSet);
                setOrderedQuantities(quantities);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des commandes:', error);
        }
    };

    const handleToggleOrder = async (inventoryId, suggestedQty) => {
        const isCurrentlyOrdered = orderedItems.has(inventoryId);

        try {
            if (!isCurrentlyOrdered) {
                const data = await api.orders.update({
                    inventory_id: inventoryId,
                    is_ordered: true,
                    ordered_quantity: suggestedQty
                });
                if (data.success) {
                    setOrderedItems(prev => new Set([...prev, inventoryId]));
                    setOrderedQuantities(prev => ({ ...prev, [inventoryId]: suggestedQty }));
                }
            } else {
                const data = await api.orders.update({
                    inventory_id: inventoryId,
                    is_ordered: false
                });
                if (data.success) {
                    setOrderedItems(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(inventoryId);
                        return newSet;
                    });
                    setOrderedQuantities(prev => {
                        const newQuantities = { ...prev };
                        delete newQuantities[inventoryId];
                        return newQuantities;
                    });
                }
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la commande:', error);
            alert('Erreur lors de la mise à jour de la commande');
        }
    };

    const SupplierSection = ({ supplier, items }) => (
        <div className="mb-8">
            <div className="flex items-center mb-3 md:mb-4">
                <h4 className="text-lg font-semibold text-gray-800">{supplier}</h4>
                <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {items.length} article{items.length > 1 ? 's' : ''}
                </span>
                <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    {items.filter(item => orderedItems.has(item.id)).length} commandé{items.filter(item => orderedItems.has(item.id)).length > 1 ? 's' : ''}
                </span>
            </div>
            {items.length === 0 ? (
                <p className="text-gray-500 text-sm italic">Aucun article à commander</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commandé</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matériel</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seuil</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qté Suggérée</th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item) => {
                            const suggestedQty = item.status === 'Rupture' ? item.threshold * 2 : item.threshold - item.stock + 10;
                            const isOrdered = orderedItems.has(item.id);
                            const orderedQty = orderedQuantities[item.id] || suggestedQty;

                            return (
                                <tr key={item.id} className={isOrdered ? 'bg-green-50' : ''}>
                                    <td className="px-2 md:px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <input
                                            type="checkbox"
                                            checked={isOrdered}
                                            onChange={() => handleToggleOrder(item.id, suggestedQty)}
                                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.material}
                                        {isOrdered && (
                                            <div className="text-xs text-green-600 font-medium">
                                                ✓ Commandé ({orderedQty} unités)
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.stock}</td>
                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.threshold}</td>
                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{suggestedQty}</td>
                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap"><StatusBadge status={item.status} /></td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <div className="flex justify-between items-center mb-4 md:mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Prochaines Commandes</h3>
                    <div className="flex items-center space-x-4 mt-2">
                        <span className="ml-3 px-3 py-1 text-sm bg-gray-100 rounded-full text-gray-600">
                            Total: {itemsToOrder.length} articles
                        </span>
                        <span className="ml-3 px-3 py-1 bg-green-100 rounded-full text-sm text-green-600 font-medium">
                            Commandés: {orderedItems.size} articles
                        </span>
                        <span className="ml-3 px-3 py-1 bg-red-100 rounded-full text-sm text-red-600 font-medium">
                            Restants: {itemsToOrder.length - orderedItems.size} articles
                        </span>
                    </div>
                </div>
            </div>
            {itemsToOrder.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <CheckCircle size={48} className="mx-auto mb-3 md:mb-4 text-green-500 opacity-50" />
                    <p className="text-lg font-medium">Aucune commande nécessaire</p>
                    <p className="text-sm mt-2">Tous les articles sont en stock suffisant</p>
                </div>
            ) : (
                <div>
                    <SupplierSection supplier="Rekka" items={rekkaItems} />
                    <SupplierSection supplier="Wurth" items={wurthItems} />
                    <SupplierSection supplier="yess" items={yessItems} />
                    <SupplierSection supplier="trenois" items={trenoisItems} />
                    <SupplierSection supplier="pointp" items={pointpItems} />
                    <SupplierSection supplier="boschat" items={boschatItems} />
                    <SupplierSection supplier="berner" items={bernerItems} />
                </div>
            )}
        </div>
    );
};

export default Orders;