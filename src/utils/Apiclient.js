const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

        const text = await response.text();

        let result;
        try {
            result = JSON.parse(text);
        } catch (parseError) {
            console.error('Réponse non-JSON:', text);
            throw new Error(`Erreur serveur: Réponse invalide (${response.status})\n${text.substring(0, 200)}`);
        }

        if (!response.ok) {
            throw new Error(result.message || `Erreur HTTP ${response.status}`);
        }

        return result;
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
};

export const authAPI = {
    login: async (username, password) => {
        return apiRequest('auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    },

    logout: async () => {
        return apiRequest('auth/logout', {
            method: 'POST',
        });
    },

    check: async () => {
        return apiRequest('auth/check');
    },
};

export const productsReceivedAPI = {
    getAll: async () => {
        return apiRequest('received', {
            method: 'GET',
        });
    },

    add: async (formData) => {
        const url = `${API_BASE_URL}/received`;
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            throw new Error(`Réponse invalide: ${text.substring(0, 200)}`);
        }

        if (!response.ok) {
            throw new Error(result.message || `Erreur HTTP ${response.status}`);
        }

        return result;
    },

    update: async (productData) => {
        return apiRequest('received', {
            method: 'PUT',
            body: JSON.stringify(productData),
        });
    },

    delete: async (id) => {
        return apiRequest(`received?id=${id}`, {
            method: 'DELETE',
        });
    },
};

export const productsInstalledAPI = {
    getAll: async () => {
        return apiRequest('installed', {
            method: 'GET',
        });
    },

    markAsInstalled: async (id, quantity = 1, client = '', photos_paths = []) => {
        return apiRequest('installed', {
            method: 'POST',
            body: JSON.stringify({ id, quantity, client, photos_paths }),
        });
    },

    delete: async (id) => {
        return apiRequest(`installed?id=${id}`, {
            method: 'DELETE',
        });
    },
};

export const productsDefectiveAPI = {
    getAll: async () => {
        return apiRequest('defective', {
            method: 'GET',
        });
    },

    add: async (formData) => {
        const url = `${API_BASE_URL}/defective`;
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            throw new Error(`Réponse invalide: ${text.substring(0, 200)}`);
        }

        if (!response.ok) {
            throw new Error(result.message || `Erreur HTTP ${response.status}`);
        }

        return result;
    },

    markAsDefective: async (id) => {
        return apiRequest('defective', {
            method: 'POST',
            body: JSON.stringify({ id }),
        });
    },

    delete: async (id) => {
        return apiRequest(`defective?id=${id}`, {
            method: 'DELETE',
        });
    },
};

export const inventoryAPI = {
    getAll: async () => {
        return apiRequest('inventory', {
            method: 'GET',
        });
    },

    add: async (articleData) => {
        return apiRequest('inventory', {
            method: 'POST',
            body: JSON.stringify(articleData),
        });
    },

    update: async (articleData) => {
        return apiRequest('inventory', {
            method: 'PUT',
            body: JSON.stringify(articleData),
        });
    },

    delete: async (id) => {
        return apiRequest(`inventory?id=${id}`, {
            method: 'DELETE',
        });
    },
};

export const ordersAPI = {
    getAll: async () => {
        return apiRequest('orders', {
            method: 'GET',
        });
    },

    add: async (orderData) => {
        return apiRequest('orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    },

    update: async (orderData) => {
        return apiRequest('orders', {
            method: 'PUT',
            body: JSON.stringify(orderData),
        });
    },

    delete: async (inventory_id) => {
        return apiRequest(`orders?inventory_id=${inventory_id}`, {
            method: 'DELETE',
        });
    },
};

export const toolsAPI = {
    getAll: async () => {
        return apiRequest('tools', {
            method: 'GET',
        });
    },

    add: async (toolData) => {
        return apiRequest('tools', {
            method: 'POST',
            body: JSON.stringify(toolData),
        });
    },

    update: async (toolData) => {
        return apiRequest('tools', {
            method: 'PUT',
            body: JSON.stringify(toolData),
        });
    },

    delete: async (id) => {
        return apiRequest(`tools?id=${id}`, {
            method: 'DELETE',
        });
    },
};

export const statsAPI = {
    get: async () => {
        return apiRequest('stats', {
            method: 'GET',
        });
    },
};

const api = {
    auth: authAPI,
    productsReceived: productsReceivedAPI,
    productsInstalled: productsInstalledAPI,
    productsDefective: productsDefectiveAPI,
    inventory: inventoryAPI,
    orders: ordersAPI,
    tools: toolsAPI,
    stats: statsAPI,
};

export default api;
