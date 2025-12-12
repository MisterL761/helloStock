import React, { useState } from 'react';
import { Package, Lock, User, AlertCircle } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/auth.php?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                // Sauvegarder les informations utilisateur dans localStorage
                localStorage.setItem('user', JSON.stringify(result.data.user));
                onLoginSuccess(result.data.user);
            } else {
                setError(result.message || 'Erreur de connexion');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                {/* Logo et Titre */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                        <Package className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">StockFlow Pro</h1>
                    <p className="text-gray-500">Connectez-vous à votre compte</p>
                </div>

                {/* Message d'erreur */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                        <AlertCircle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Champ Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom d'utilisateur
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Entrez votre nom d'utilisateur"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Champ Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Entrez votre mot de passe"
                                required
                            />
                        </div>
                    </div>

                    {/* Bouton de connexion */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                            loading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {loading ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                </form>

                {/* Info compte par défaut */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 font-semibold mb-2">Comptes de test :</p>
                    <div className="text-xs text-blue-700 space-y-1">
                        <p><strong>Admin:</strong> admin / admin123</p>
                        <p><strong>User:</strong> userstock / admin123</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;