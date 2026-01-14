import React from 'react';

const LoadingSpinner = ({ message = "Chargement des données..." }) => {
    return (
        <div className="flex justify-center items-center p-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-gray-600">{message}</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;