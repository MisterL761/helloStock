import React from 'react';
import { Search, ChevronRight, X, LogOut } from 'lucide-react';

const Header = ({ searchTerm, onSearchChange, onMenuToggle, onLogout, user }) => {
    return (
        <header className="bg-white border-b border-gray-200 p-4 xl:px-8 xl:py-5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <button onClick={onMenuToggle} className="md:hidden text-gray-600 hover:bg-gray-100 p-2.5 rounded-lg" style={{ minWidth: "44px", minHeight: "44px" }}>
                    <ChevronRight size={24} />
                </button>
                <h2 className="text-lg md:text-xl xl:text-2xl font-semibold text-gray-800">Gestion</h2>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4 xl:space-x-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 pr-4 py-2 xl:py-2.5 text-sm xl:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40 md:w-64 xl:w-80"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                <div className="hidden md:flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-800">{user ? user.username : 'Utilisateur'}</p>
                            <p className="text-xs text-gray-500">{user && user.role ? user.role : 'Utilisateur'}</p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="p-2.5 rounded-full hover:bg-gray-100 text-gray-600"
                            style={{ minWidth: "44px", minHeight: "44px" }}
                            title="Déconnexion"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;