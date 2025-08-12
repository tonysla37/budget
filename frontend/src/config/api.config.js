// Configuration de l'API générée automatiquement par le script de déploiement
export const API_URL = "http://127.0.0.1:8000";
export const API_TIMEOUT = 30000; // 30 secondes
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};
export const DEBUG_API_CALLS = true; // Activer les logs de debugging pour les appels API

// Mode hors-ligne - DÉCONSEILLÉ
// Désactivé par défaut car le mode hors-ligne n'est pas recommandé
export const DEBUG_IGNORE_BACKEND_FAILURE = false;

// Variable pour suivre l'état de la connexion au backend
let isBackendAvailable = null;
let isDatabaseAvailable = null;

/**
 * Fonction pour vérifier si le backend est disponible
 * @param {boolean} force - Force une nouvelle vérification même si le statut est déjà connu
 * @returns {Promise<boolean>} - true si le backend est disponible, false sinon
 */
export const checkBackendStatus = async (force = false) => {
    // Si on a déjà vérifié et qu'on ne force pas une nouvelle vérification
    if (isBackendAvailable !== null && !force) {
        console.log(`🔄 Utilisation du statut backend en cache: ${isBackendAvailable ? 'Disponible' : 'Indisponible'}`);
        return isBackendAvailable;
    }
    
    try {
        console.log('🔍 Vérification de la connexion au backend...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5 secondes
        
        const response = await fetch(`${API_URL}/api/health`, {
            method: 'GET',
            headers: DEFAULT_HEADERS,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            console.log('✅ Connexion au backend établie');
            isBackendAvailable = true;
            return true;
        } else {
            console.error(`❌ Erreur de connexion au backend: ${response.status} ${response.statusText}`);
            isBackendAvailable = false;
            return false;
        }
    } catch (error) {
        console.error('❌ Impossible de se connecter au backend:', error.message);
        console.error('⚠️ Le mode hors-ligne n\'est pas recommandé. Veuillez démarrer le backend.');
        
        isBackendAvailable = false;
        return false;
    }
};

/**
 * Fonction pour vérifier si MongoDB est disponible via le backend
 * @param {boolean} force - Force une nouvelle vérification même si le statut est déjà connu
 * @returns {Promise<boolean>} - true si la base de données est disponible, false sinon
 */
export const checkDatabaseStatus = async (force = false) => {
    // Si on a déjà vérifié et qu'on ne force pas une nouvelle vérification
    if (isDatabaseAvailable !== null && !force) {
        console.log(`🔄 Utilisation du statut de la base de données en cache: ${isDatabaseAvailable ? 'Disponible' : 'Indisponible'}`);
        return isDatabaseAvailable;
    }
    
    try {
        console.log('🔍 Vérification de la connexion à la base de données...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5 secondes
        
        const response = await fetch(`${API_URL}/api/health/db`, {
            method: 'GET',
            headers: DEFAULT_HEADERS,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            console.log('✅ Connexion à la base de données établie');
            isDatabaseAvailable = true;
            return true;
        } else {
            console.error(`❌ Erreur de connexion à la base de données: ${response.status} ${response.statusText}`);
            isDatabaseAvailable = false;
            return false;
        }
    } catch (error) {
        console.error('❌ Impossible de vérifier le statut de la base de données:', error.message);
        console.error('⚠️ La connexion à la base de données est obligatoire. Veuillez vérifier MongoDB.');
        
        isDatabaseAvailable = false;
        return false;
    }
}; 

/**
 * Fonction utilitaire pour basculer le mode hors-ligne
 * @param {boolean} enableOfflineMode - True pour activer le mode hors-ligne, false pour le désactiver
 */
export const toggleOfflineMode = (enableOfflineMode) => {
    // Cette fonction peut être appelée par le script de déploiement pour modifier le mode hors-ligne
    console.log(`${enableOfflineMode ? '🔌 Activation' : '🔌 Désactivation'} du mode hors-ligne`);
    window.DEBUG_IGNORE_BACKEND_FAILURE = enableOfflineMode;
    // Reset des états pour forcer une nouvelle vérification
    isBackendAvailable = null;
    isDatabaseAvailable = null;
}; 