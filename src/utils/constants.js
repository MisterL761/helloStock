export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const SUPPLIERS = [
    { value: 'Wurth', logo: './logos/wurth.webp' },
    { value: 'Rekka', logo: './logos/reca.jpeg' },
    { value: 'yess', logo: './logos/yess.png' },
    { value: 'trenois', logo: './logos/trenois.jpg' },
    { value: 'pointp', logo: './logos/pointp.png' },
    { value: 'boschat', logo: './logos/boschat.jpeg' },
    { value: 'berner', logo: './logos/berner.png' }
];

export const TAB_TO_SIDEBAR_MAPPING = {
    'received': 'produits-recus',
    'installed': 'produits-poses',
    'defective': 'produits-defectueux',
    'stock': 'inventaire',
    'tools': 'outils',
    'orders': 'commandes'
};

export const SIDEBAR_TO_TAB_MAPPING = {
    'produits-recus': 'received',
    'produits-poses': 'installed',
    'produits-defectueux': 'defective',
    'inventaire': 'stock',
    'outils': 'tools',
    'commandes': 'orders'
};

export const SEARCH_FIELDS = {
    productsReceived: ['product', 'supplier', 'client', 'date', 'status', 'id'],
    installedProducts: ['product', 'supplier', 'date', 'installedDate', 'id'],
    defectiveProducts: ['product', 'supplier', 'client', 'date', 'defectiveDate', 'id'],
    inventoryItems: ['material', 'supplier', 'category', 'status', 'id'],
    toolsItems: ['name', 'supplier', 'id']
};

export const EXPORT_TYPES = {
    'produits-recus': 'produits_recus',
    'produits-poses': 'produits_poses',
    'produits-defectueux': 'produits_defectueux',
    'inventaire': 'inventaire'
};

export const IMAGE_EXTENSIONS = ['webp', 'jpeg', 'jpg', 'png', 'svg'];

export const MIN_TOUCH_SIZE = { minWidth: "44px", minHeight: "44px" };
