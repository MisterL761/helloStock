import React from 'react';
import { Package, X, ChevronLeft, ChevronRight, Warehouse, CheckCheck, AlertCircle, ToolCase, Drill, ClipboardList, LogOut } from 'lucide-react';

const Sidebar = ({ activeSidebar, onNavigate, isOpen, onClose, onLogout, user, isCollapsed, onToggleCollapse }) => {
    const sidebarClasses = `bg-[rgb(96,41,253)] border-r border-purple-700 flex-shrink-0 flex flex-col transition-all duration-300 relative
                            ${isOpen ? (isCollapsed ? 'w-20' : 'w-64') : 'w-0 md:' + (isCollapsed ? 'w-20' : 'w-64')} 
                            ${isOpen ? 'fixed inset-y-0 z-40 shadow-lg md:relative md:shadow-none' : 'hidden md:flex'}`;

    const NavItem = ({ icon: Icon, label, id, active }) => (
        <li className="mb-2">
            <button
                onClick={() => {
                    onNavigate(id);
                    onClose();
                }}
                className={`flex items-center py-3 px-3 rounded-lg w-full transition-all ${
                    active ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/80'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? label : ''}
            >
                <Icon size={20} className={isCollapsed ? '' : 'mr-3'} />
                {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
            </button>
        </li>
    );

    return (
        <div className={sidebarClasses}>
            <button
                onClick={onToggleCollapse}
                className="hidden md:flex absolute -right-4 top-1/2 transform -translate-y-1/2 items-center justify-center w-8 h-8 rounded-full bg-white text-[rgb(96,41,253)] hover:bg-gray-100 transition-all duration-300 shadow-lg z-50"
                title={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
            >
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            <div className="p-3 md:p-4 border-b border-white/20 flex justify-between items-center">
                {!isCollapsed ? (
                    <>
                        <h1 className="text-lg font-bold text-white flex items-center">
                            <Package className="mr-2" size={24} /> Hello Stock
                        </h1>
                        <button onClick={onClose} className="md:hidden text-white/80 hover:text-white">
                            <X size={20} />
                        </button>
                    </>
                ) : (
                    <Package className="text-white mx-auto" size={24} />
                )}
            </div>

            <nav className="p-3 md:p-4 flex-1 overflow-y-auto">
                <div className="mb-8">
                    <ul>
                        <NavItem icon={Warehouse} label="Produits Reçus" id="received" active={activeSidebar === 'received'} />
                        <NavItem icon={CheckCheck} label="Produits Posés" id="installed" active={activeSidebar === 'installed'} />
                        <NavItem icon={AlertCircle} label="Produits Défectueux" id="defective" active={activeSidebar === 'defective'} />
                        <NavItem icon={ToolCase} label="Consommable" id="inventory" active={activeSidebar === 'inventory'} />
                        <NavItem icon={Drill} label="Outils" id="tools" active={activeSidebar === 'tools'} />
                        <NavItem icon={ClipboardList} label="Commande" id="orders" active={activeSidebar === 'orders'} />
                    </ul>
                </div>
            </nav>

            <div className="p-3 md:p-4 border-t border-white/20">
                {!isCollapsed ? (
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-sm font-medium text-white">{user ? user.username : 'Utilisateur'}</p>
                            <p className="text-xs text-white/70">{user && user.role ? user.role : 'Utilisateur'}</p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="p-2.5 rounded-full hover:bg-white/10 text-white"
                            style={{ minWidth: "44px", minHeight: "44px" }}
                            title="Déconnexion"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onLogout}
                        className="p-2.5 rounded-full hover:bg-white/10 text-white mx-auto block"
                        style={{ minWidth: "44px", minHeight: "44px" }}
                        title="Déconnexion"
                    >
                        <LogOut size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Sidebar;