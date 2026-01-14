import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useDataFetching = () => {
    const [productsReceived, setProductsReceived] = useState([]);
    const [installedProducts, setInstalledProducts] = useState([]);
    const [defectiveProducts, setDefectiveProducts] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [toolsItems, setToolsItems] = useState([]);
    const [stats, setStats] = useState({ total: 0, available: 0, lowStock: 0, outOfStock: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [recRes, instRes, defRes, invRes, toolsRes, statsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/received`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/installed`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/defective`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/inventory`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/tools`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/stats`, { credentials: 'include' })
            ]);

            const received = await recRes.json();
            const installed = await instRes.json();
            const defective = await defRes.json();
            const inventory = await invRes.json();
            const tools = await toolsRes.json();
            const statsData = await statsRes.json();

            setProductsReceived(received || []);
            setInstalledProducts(installed || []);
            setDefectiveProducts(defective || []);
            setInventoryItems(inventory || []);
            setToolsItems(tools || []);
            setStats({
                total: statsData.total_items || 0,
                available: statsData.available_items || 0,
                lowStock: statsData.low_stock_items || 0,
                outOfStock: statsData.out_of_stock_items || 0
            });
        } catch (error) {
            console.error('Erreur chargement données:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return {
        productsReceived,
        installedProducts,
        defectiveProducts,
        inventoryItems,
        toolsItems,
        stats,
        loading,
        refetch: fetchData
    };
};
