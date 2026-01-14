
// Configuration
const API_BASE_URL = 'https://hello-fermetures.com/hello-stock/php';

/**
 * Fonction générique pour faire des requêtes à l'API
 */
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}/${endpoint}`;

    try {
        const response = await fetch(url, {
            credentials: 'include',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        // Récupérer le texte brut d'abord
        const text = await response.text();

        // Essayer de parser en JSON
        let result;
        try {
            result = JSON.parse(text);
        } catch (parseError) {
            console.error('Réponse non-JSON:', text);
            throw new Error(`Erreur serveur: Réponse invalide (${response.status})\n${text.substring(0, 200)}`);
        }

        // Vérifier le statut HTTP
        if (!response.ok) {
            throw new Error(result.message || `Erreur HTTP ${response.status}`);
        }

        return result;
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
};

/**
 * API d'authentification
 */
export const authAPI = {
    // Connexion
    login: async (username, password) => {
        return apiRequest('auth.php?action=login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    },

    // Déconnexion
    logout: async () => {
        return apiRequest('auth.php?action=logout', {
            method: 'POST',
        });
    },

    // Vérifier l'authentification
    check: async () => {
        return apiRequest('auth.php?action=check');
    },
};

/**
 * API des produits reçus
 */
export const productsReceivedAPI = {
    // Récupérer tous les produits reçus
    getAll: async () => {
        return apiRequest('api.php?action=products_received', {
            method: 'GET',
        });
    },

    // Ajouter un produit reçu
    add: async (productData) => {
        return apiRequest('api.php?action=products_received', {
            method: 'POST',
            body: JSON.stringify(productData),
        });
    },

    // Modifier un produit reçu
    update: async (productData) => {
        return apiRequest('api.php?action=products_received', {
            method: 'PUT',
            body: JSON.stringify(productData),
        });
    },

    // Supprimer un produit reçu
    delete: async (id) => {
        return apiRequest('api.php?action=products_received', {
            method: 'DELETE',
            body: JSON.stringify({ id }),
        });
    },
};

/**
 * API des produits posés
 */
export const productsInstalledAPI = {
    // Récupérer tous les produits posés
    getAll: async () => {
        return apiRequest('api.php?action=products_installed', {
            method: 'GET',
        });
    },

    // Marquer un produit comme posé
    markAsInstalled: async (product_id, installed_date) => {
        return apiRequest('api.php?action=products_installed', {
            method: 'POST',
            body: JSON.stringify({ product_id, installed_date }),
        });
    },
};

/**
 * API de l'inventaire
 */
export const inventoryAPI = {
    // Récupérer tous les articles d'inventaire
    getAll: async () => {
        return apiRequest('api.php?action=inventory', {
            method: 'GET',
        });
    },

    // Ajouter un article d'inventaire
    add: async (articleData) => {
        return apiRequest('api.php?action=inventory', {
            method: 'POST',
            body: JSON.stringify(articleData),
        });
    },

    // Modifier un article d'inventaire
    update: async (articleData) => {
        return apiRequest('api.php?action=inventory', {
            method: 'PUT',
            body: JSON.stringify(articleData),
        });
    },

    // Supprimer un article d'inventaire
    delete: async (id) => {
        return apiRequest('api.php?action=inventory', {
            method: 'DELETE',
            body: JSON.stringify({ id }),
        });
    },
};

/**
 * Export par défaut avec toutes les APIs
 */
const api = {
    auth: authAPI,
    productsReceived: productsReceivedAPI,
    productsInstalled: productsInstalledAPI,
    inventory: inventoryAPI,
};

export default api;