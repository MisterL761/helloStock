import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Tabs from './components/Tabs';
import ProductsReceived from './components/ProductsReceived';
import ProductsInstalled from './components/ProductsInstalled';
import ProductsDefective from './components/ProductsDefective';
import Inventory from './components/Inventory';
import Tools from './components/Tools';
import Orders from './components/Orders';
import AddProductModal from './components/AddProductModal';
import AddDefectiveProductModal from './components/AddDefectiveProductModal';
import AddArticleModal from './components/AddArticleModal';
import AddToolModal from './components/AddToolModal';
import EditProductModal from './components/EditProductModal';
import EditArticleModal from './components/EditArticleModal';
import EditToolModal from './components/EditToolModal';
import SidebarBackdrop from './components/SidebarBackdrop';
import SearchBar from './components/SearchBar';
import LoadingSpinner from './components/LoadingSpinner';
import { useDataFetching } from './hooks/useDataFetching';
import { filterBySearch, exportToCSV } from './utils/utilities';
import api from './utils/Apiclient';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('received');
    const [activeSidebar, setActiveSidebar] = useState('received');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const [showProductModal, setShowProductModal] = useState(false);
    const [showDefectiveProductModal, setShowDefectiveProductModal] = useState(false);
    const [showArticleModal, setShowArticleModal] = useState(false);
    const [showToolModal, setShowToolModal] = useState(false);
    const [editProductModalOpen, setEditProductModalOpen] = useState(false);
    const [editArticleModalOpen, setEditArticleModalOpen] = useState(false);
    const [editToolModalOpen, setEditToolModalOpen] = useState(false);

    const [currentProduct, setCurrentProduct] = useState(null);
    const [currentArticle, setCurrentArticle] = useState(null);
    const [currentTool, setCurrentTool] = useState(null);

    const {
        productsReceived,
        installedProducts,
        defectiveProducts,
        inventoryItems,
        toolsItems,
        stats,
        loading,
        refetch
    } = useDataFetching();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const data = await api.auth.check();
                if (data.success && data.data && data.data.user) {
                    setIsAuthenticated(true);
                    setUser(data.data.user);
                }
            } catch (error) {
                console.error('Erreur authentification:', error);
            }
        };
        checkAuth();
    }, []);

    const handleLoginSuccess = (userData) => {
        setIsAuthenticated(true);
        setUser(userData);
    };

    const handleLogout = async () => {
        try {
            await api.auth.logout();
            setIsAuthenticated(false);
            setUser(null);
        } catch (error) {
            console.error('Erreur déconnexion:', error);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        const mapping = { 'received': 'received', 'installed': 'installed', 'defective': 'defective', 'stock': 'inventory', 'tools': 'tools', 'orders': 'orders' };
        setActiveSidebar(mapping[tab]);
    };

    const handleNavigation = (section) => {
        setActiveSidebar(section);
        const mapping = { 'received': 'received', 'installed': 'installed', 'defective': 'defective', 'inventory': 'stock', 'tools': 'tools', 'orders': 'orders' };
        setActiveTab(mapping[section]);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const handleAddProduct = async (productData) => {
        await refetch();
        setShowProductModal(false);
    };

    const handleMarkAsInstalled = async (productId) => {
        try {
            const data = await api.productsInstalled.markAsInstalled(productId);
            if (data.success) {
                await refetch();
                alert('Produit marqué comme posé');
            } else {
                alert(`Erreur : ${data.message || 'Impossible de marquer comme posé'}`);
            }
        } catch (error) {
            alert('Erreur technique lors de l\'opération');
        }
    };

    const handleMarkAsDefective = async (productId) => {
        try {
            const data = await api.productsDefective.markAsDefective(productId);
            if (data.success) {
                await refetch();
                alert('Produit marqué comme défectueux');
            }
        } catch (error) {
            alert('Erreur lors du marquage en défectueux');
        }
    };

    const handleEditProduct = (product) => {
        setCurrentProduct(product);
        setEditProductModalOpen(true);
    };

    const handleSaveEditedProduct = async (updatedProduct) => {
        try {
            const data = await api.productsReceived.update(updatedProduct);
            if (data.success) {
                await refetch();
                setEditProductModalOpen(false);
                setCurrentProduct(null);
                alert('Produit modifié');
            }
        } catch (error) {
            alert('Erreur modification');
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!confirm('Supprimer ce produit ?')) return;
        try {
            const data = await api.productsReceived.delete(productId);
            if (data.success) {
                await refetch();
                alert('Produit supprimé');
            } else {
                alert(`Erreur: ${data.message}`);
            }
        } catch (error) {
            alert('Erreur suppression');
        }
    };

    const handleAddDefectiveProduct = async (productData) => {
        await refetch();
        setShowDefectiveProductModal(false);
    };

    const handleDeleteDefective = async (id) => {
        if (!confirm('Supprimer ce produit défectueux ?')) return;
        try {
            const data = await api.productsDefective.delete(id);
            if (data.success) {
                await refetch();
                alert('Supprimé');
            }
        } catch (error) {
            alert('Erreur');
        }
    };

    const handleDeleteInstalled = async (id) => {
        if (!confirm('Supprimer ce produit posé ?')) return;
        try {
            const data = await api.productsInstalled.delete(id);
            if (data.success) {
                await refetch();
                alert('Supprimé');
            }
        } catch (error) {
            alert('Erreur');
        }
    };

    const handleAddArticle = async (articleData) => {
        try {
            const data = await api.inventory.add(articleData);
            if (data.success) {
                await refetch();
                setShowArticleModal(false);
                alert('Article ajouté');
            }
        } catch (error) {
            alert('Erreur ajout');
        }
    };

    const handleEditArticle = (article) => {
        setCurrentArticle(article);
        setEditArticleModalOpen(true);
    };

    const handleSaveEditedArticle = async (updatedArticle) => {
        try {
            const data = await api.inventory.update(updatedArticle);
            if (data.success) {
                await refetch();
                setEditArticleModalOpen(false);
                setCurrentArticle(null);
                alert('Article modifié');
            }
        } catch (error) {
            alert('Erreur modification');
        }
    };

    const handleDeleteArticle = async (id) => {
        if (!confirm('Supprimer cet article ?')) return;
        try {
            const data = await api.inventory.delete(id);
            if (data.success) {
                await refetch();
                alert('Article supprimé');
            }
        } catch (error) {
            alert('Erreur suppression');
        }
    };

    const handleUpdateStock = async (id, quantity) => {
        try {
            const data = await api.inventory.update({ id, stock: quantity });
            if (data.success) await refetch();
        } catch (error) {
            console.error('Erreur mise à jour stock:', error);
        }
    };

    const handleBulkEdit = async (ids, updates) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/bulk_update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, updates }),
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                await refetch();
                alert('Modifications enregistrées');
            }
        } catch (error) {
            alert('Erreur');
        }
    };

    const handleAddTool = async (toolData) => {
        try {
            const data = await api.tools.add(toolData);
            if (data.success) {
                await refetch();
                setShowToolModal(false);
                alert('Outil ajouté');
            }
        } catch (error) {
            alert('Erreur ajout');
        }
    };

    const handleEditTool = (tool) => {
        setCurrentTool(tool);
        setEditToolModalOpen(true);
    };

    const handleSaveEditedTool = async (updatedTool) => {
        try {
            const data = await api.tools.update(updatedTool);
            if (data.success) {
                await refetch();
                setEditToolModalOpen(false);
                setCurrentTool(null);
                alert('Outil modifié');
            }
        } catch (error) {
            alert('Erreur modification');
        }
    };

    const handleDeleteTool = async (id) => {
        if (!confirm('Supprimer cet outil ?')) return;
        try {
            const data = await api.tools.delete(id);
            if (data.success) {
                await refetch();
                alert('Outil supprimé');
            }
        } catch (error) {
            alert('Erreur');
        }
    };

    const handleExport = (type) => {
        const dataMap = {
            'produits-recus': [productsReceived, 'produits_recus'],
            'produits-poses': [installedProducts, 'produits_poses'],
            'produits-defectueux': [defectiveProducts, 'produits_defectueux'],
            'inventaire': [inventoryItems, 'inventaire']
        };
        if (dataMap[type]) {
            const [data, filename] = dataMap[type];
            exportToCSV(data, filename);
        }
    };

    const filteredProductsReceived = filterBySearch(productsReceived, searchTerm, ['product', 'supplier', 'client', 'date', 'status', 'id']);
    const filteredInstalledProducts = filterBySearch(installedProducts, searchTerm, ['product', 'supplier', 'date', 'installedDate', 'id']);
    const filteredDefectiveProducts = filterBySearch(defectiveProducts, searchTerm, ['product', 'supplier', 'client', 'date', 'defectiveDate', 'id']);
    const filteredInventoryItems = filterBySearch(inventoryItems, searchTerm, ['material', 'supplier', 'category', 'status', 'id']);
    const filteredToolsItems = filterBySearch(toolsItems, searchTerm, ['name', 'supplier', 'id']);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setIsSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isAuthenticated) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            <SidebarBackdrop isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <Sidebar activeSidebar={activeSidebar} onNavigate={handleNavigation} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onLogout={handleLogout} user={user} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={handleLogout} user={user} />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 xl:p-8 bg-gray-50">
                    <div className="max-w-[1920px] mx-auto">
                        <Tabs activeTab={activeTab} onTabChange={handleTabChange} />
                        {loading && <LoadingSpinner />}
                        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} onClear={() => setSearchTerm('')} />

                        {!loading && activeTab === 'received' && <ProductsReceived products={filteredProductsReceived} onMarkAsInstalled={handleMarkAsInstalled} onMarkAsDefective={handleMarkAsDefective} onAddProduct={() => setShowProductModal(true)} onExport={handleExport} onEditProduct={handleEditProduct} onDeleteProduct={handleDeleteProduct} />}
                        {!loading && activeTab === 'installed' && <ProductsInstalled installedProducts={filteredInstalledProducts} onExport={handleExport} onDeleteInstalled={handleDeleteInstalled} />}
                        {!loading && activeTab === 'defective' && <ProductsDefective defectiveProducts={filteredDefectiveProducts} onExport={handleExport} onDeleteDefective={handleDeleteDefective} onAddDefectiveProduct={() => setShowDefectiveProductModal(true)} />}
                        {!loading && activeTab === 'stock' && <Inventory inventoryItems={filteredInventoryItems} stats={stats} onAddArticle={() => setShowArticleModal(true)} onExport={handleExport} onEditArticle={handleEditArticle} onDeleteArticle={handleDeleteArticle} onUpdateStock={handleUpdateStock} onBulkEdit={handleBulkEdit} />}
                        {!loading && activeTab === 'tools' && <Tools toolsItems={filteredToolsItems} onAddTool={() => setShowToolModal(true)} onEditTool={handleEditTool} onDeleteTool={handleDeleteTool} />}
                        {!loading && activeTab === 'orders' && <Orders inventoryItems={filteredInventoryItems} />}
                    </div>
                </main>
            </div>

            <AddProductModal isOpen={showProductModal} onClose={() => setShowProductModal(false)} onAdd={handleAddProduct} />
            <AddDefectiveProductModal isOpen={showDefectiveProductModal} onClose={() => setShowDefectiveProductModal(false)} onAdd={handleAddDefectiveProduct} />
            <AddArticleModal isOpen={showArticleModal} onClose={() => setShowArticleModal(false)} onAdd={handleAddArticle} />
            <AddToolModal isOpen={showToolModal} onClose={() => setShowToolModal(false)} onAdd={handleAddTool} />
            <EditProductModal isOpen={editProductModalOpen} onClose={() => { setEditProductModalOpen(false); setCurrentProduct(null); }} product={currentProduct} onSave={handleSaveEditedProduct} />
            <EditArticleModal isOpen={editArticleModalOpen} onClose={() => { setEditArticleModalOpen(false); setCurrentArticle(null); }} article={currentArticle} onSave={handleSaveEditedArticle} />
            <EditToolModal isOpen={editToolModalOpen} onClose={() => { setEditToolModalOpen(false); setCurrentTool(null); }} tool={currentTool} onSave={handleSaveEditedTool} />
        </div>
    );
}

export default App;
