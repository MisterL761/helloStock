import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const ActionButtons = ({ onEdit, onDelete }) => {
    return (
        <div className="flex space-x-1 lg:space-x-2">
            <button
                onClick={onEdit}
                className="text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600 rounded p-1 lg:p-1.5 xl:p-2 transition-colors"
                title="Modifier"
            >
                <Edit size={16} className="lg:w-[18px] lg:h-[18px] xl:w-5 xl:h-5" />
            </button>
            <button
                onClick={onDelete}
                className="text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded p-1 lg:p-1.5 xl:p-2 transition-colors"
                title="Supprimer"
            >
                <Trash2 size={16} className="lg:w-[18px] lg:h-[18px] xl:w-5 xl:h-5" />
            </button>
        </div>
    );
};

export default ActionButtons;
