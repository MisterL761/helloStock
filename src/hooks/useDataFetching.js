import { useState, useEffect } from 'react';

export const useDataFetching = (apiBase) => {
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
                fetch(`${apiBase}/received.php`, { credentials: 'include' }),
                fetch(`${apiBase}/installed.php`, { credentials: 'include' }),
                fetch(`${apiBase}/defective.php`, { credentials: 'include' }),
                fetch(`${apiBase}/inventory.php`, { credentials: 'include' }),
                fetch(`${apiBase}/tools_api.php`, { credentials: 'include' }),
                fetch(`${apiBase}/stats.php`, { credentials: 'include' })
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
    }, [apiBase]);

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