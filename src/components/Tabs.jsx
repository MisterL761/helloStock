import React from 'react';

const Tabs = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'received', label: 'Reçus' },
        { id: 'installed', label: 'Posés' },
        { id: 'defective', label: 'Défectueux' },
        { id: 'stock', label: 'Inventaire' },
        { id: 'tools', label: 'Outils' },
        { id: 'orders', label: 'Commandes' }
    ];

    return (
        <div className="md:hidden flex overflow-x-auto bg-gray-50 border-b border-gray-200 mb-4 md:mb-6 -mx-4 md:-mx-6 px-4 md:px-6">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-4 md:px-6 py-3 font-medium whitespace-nowrap transition-all ${
                        activeTab === tab.id
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default Tabs;