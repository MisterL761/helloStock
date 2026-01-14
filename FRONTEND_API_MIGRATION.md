# Migration Frontend - Adaptation API

## Fichiers à modifier dans App.jsx

Remplacer tous les appels directs par l'utilisation de `api` :

```javascript
import api from './utils/Apiclient';
```

### Changements dans App.jsx

| Ligne | Ancien Code | Nouveau Code |
|-------|-------------|--------------|
| 64-74 | `fetch('${API_BASE}/auth.php?action=check'...)` | `api.auth.check()` |
| 84 | `fetch('${API_BASE}/auth.php?action=logout'...)` | `api.auth.logout()` |
| 115-130 | `fetch('${API_BASE}/installed.php'...)` | `api.productsInstalled.markAsInstalled(productId)` |
| 135-148 | `fetch('${API_BASE}/defective.php'...)` | `api.productsDefective.markAsDefective(productId)` |
| 159-174 | `fetch('${API_BASE}/received.php', PUT...)` | `api.productsReceived.update(updatedProduct)` |
| 181-194 | `fetch('${API_BASE}/received.php?id=..., DELETE...)` | `api.productsReceived.delete(productId)` |
| 208-219 | `fetch('${API_BASE}/defective.php?id=..., DELETE...)` | `api.productsDefective.delete(id)` |
| 228-239 | `fetch('${API_BASE}/installed.php?id=..., DELETE...)` | `api.productsInstalled.delete(id)` |
| 246-260 | `fetch('${API_BASE}/inventory.php', POST...)` | `api.inventory.add(articleData)` |
| 271-286 | `fetch('${API_BASE}/inventory.php', PUT...)` | `api.inventory.update(updatedArticle)` |
| 293-304 | `fetch('${API_BASE}/inventory.php?id=..., DELETE...)` | `api.inventory.delete(id)` |
| 310-320 | `fetch('${API_BASE}/inventory.php', PUT...)` | `api.inventory.update({ id, stock: quantity })` |
| 346-360 | `fetch('${API_BASE}/tools_api.php', POST...)` | `api.tools.add(toolData)` |
| 371-386 | `fetch('${API_BASE}/tools_api.php', PUT...)` | `api.tools.update(updatedTool)` |
| 393-404 | `fetch('${API_BASE}/tools_api.php?id=..., DELETE...)` | `api.tools.delete(id)` |

## Suppression de la ligne 25

```javascript
const API_BASE = import.meta.env.VITE_API_BASE || '/hello-stock/php';  // ← À SUPPRIMER
```

## Modaux à adapter

Les modaux qui font des appels directs doivent être modifiés pour utiliser l'`ApiClient` :

- `Addproductmodal.jsx` - ligne 105
- `Adddefectiveproductmodal.jsx` - ligne 69
- `EditProductModal.jsx` - À vérifier
- `Orders.jsx` - À vérifier

## Instructions

1. Importer l'API client en haut du fichier
2. Supprimer la ligne `const API_BASE = ...`
3. Remplacer tous les appels `fetch(...)` par les méthodes de l'API client
4. Simplifier la gestion des erreurs (l'API client gère déjà les erreurs JSON)
