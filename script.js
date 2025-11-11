/**
 * WY MovieBox - Main JavaScript Logic (v2.6 - Deep Initialization Fix)
 * * Key features:
 * - **Decoupled Init:** Firebase, Data, and UI initialization are separated for robustness.
 * - **Navigation Consistency:** Ensures all navigation buttons change state and views reliably.
 */

// Global state variables
let videos = {};
let translations = {};
let favorites = [];
let currentPlayingMovie = null; 
let currentSettings = {};

// ... (User ID fallback and defaultSettings remain the same) ...


// -------------------------------------------------------------------------
// 1. DATA FETCHING AND INITIALIZATION
// -------------------------------------------------------------------------

/**
 * Initializes Firebase and authentication (if SDK is loaded).
 */
function initFirebase() {
    const components = getFirebaseComponents(); // Get components from global scope
    if (!components) return;

    // ... (Firebase config and initialization logic using components.app/auth/firestore)
    
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    let firebaseConfig = {};
    try {
        firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
    } catch (e) {
        console.error("Error parsing __firebase_config:", e);
    }
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    if (Object.keys(firebaseConfig).length > 0) {
        const app = components.app.initializeApp(firebaseConfig);
        window.db = components.firestore(app);
        window.auth = components.auth(app);

        // ... (Authentication logic remains the same, but uses components.auth functions) ...

        // Use a simple non-module way to handle Firebase operations if needed
        window.firestore = {
            // ... (Firebase functions reference remains the same)
        };

        // Attempt sign-in immediately if config exists
        components.auth().onAuthStateChanged(window.auth, async (user) => {
            if (!user) {
                try {
                    if (initialAuthToken) {
                        await components.auth().signInWithCustomToken(window.auth, initialAuthToken);
                    } else {
                        await components.auth().signInAnonymously(window.auth);
                    }
                } catch (error) {
                    console.error("Firebase Sign-in Error:", error);
                }
            }
        });

    } else {
         console.warn("Firebase configuration is missing. Firestore operations will not work.");
    }
}


/**
 * Fetches movie data and translations from the JSON file.
 * !!! Critical for content rendering.
 */
async function loadDataFromJSON() {
    try {
        const response = await fetch('videos_photos.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        videos = data.videos || {};
        translations = data.translations || {};
        console.log("Data loaded successfully from JSON. (v2.6)");
    } catch (e) {
        console.error("Failed to load JSON data. Content will be empty.", e);
        // Do NOT halt execution. Just leave videos/translations as empty objects.
        const t = translations.myanmar || { Error: "Error", jsonError: "ရုပ်ရှင်ဒေတာများ ဖတ်ယူနိုင်ခြင်း မရှိပါ (JSON Error)။ Button များသာ အလုပ်လုပ်ပါမည်။" };
        showCustomAlert(t.Error, t.jsonError);
    }
}

// ... (generateVideoIds function remains the same) ...

/**
 * Loads user state and initializes the app.
 */
window.initializeApp = async function() {
    // 1. Initialize Firebase (Non-critical to UI)
    initFirebase();
    
    // 2. Load Data (Critical for content)
    await loadDataFromJSON(); 
    generateVideoIds();

    // 3. Load Local State (Settings/Favorites)
    const storedSettings = localStorage.getItem('userSettings');
    const storedFavorites = localStorage.getItem('favorites');
    
    try {
        currentSettings = storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : { ...defaultSettings };
    } catch (e) {
        currentSettings = { ...defaultSettings };
    }
    
    try {
        favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
        if (!Array.isArray(favorites)) favorites = [];
    } catch (e) {
        favorites = [];
    }
    
    // 4. Apply Settings and Render Initial View
    applySettings();
    
    const homeBtn = document.querySelector('.nav-btn[data-nav="home"]');
    if (homeBtn) {
        // !!! FIX: Call changeNav to ensure buttons are correctly initialized and the home view loads.
        setTimeout(() => changeNav(homeBtn), 100); 
    } else {
         console.error("Home navigation button not found.");
    }
}


// -------------------------------------------------------------------------
// 2. LOCAL STORAGE AND FAVORITES HANDLING (remains the same)
// ...
// -------------------------------------------------------------------------


// -------------------------------------------------------------------------
// 3. UI AND VIEW MANAGEMENT (Navigation Logic)
// -------------------------------------------------------------------------
// ... (applySettings, applyLanguage functions remain the same) ...


/**
 * Changes the main view based on bottom navigation.
 * !!! FIX: Ensures the active button is always correctly highlighted and previous active category is restored.
 */
window.changeNav = function(btn) {
    const nav = btn.dataset.nav;
    const navBtns = document.querySelectorAll('.nav-btn');
    const menuBar = document.getElementById('menu-bar');
    const playerContainer = document.getElementById('player-container');
    const currentTitleBar = document.querySelector('.max-w-3xl.mx-auto.flex.justify-between.items-center.mb-6');
    const moviesContainer = document.getElementById('movies');
    
    closeAdultContentModal(false); 

    // Reset all nav buttons (CRITICAL for color change)
    navBtns.forEach(b => {
        b.classList.remove('text-primary', 'font-bold');
        b.classList.add('text-gray-400', 'hover:text-white');
    });

    // Set active nav button
    btn.classList.add('text-primary', 'font-bold');
    btn.classList.remove('text-gray-400', 'hover:text-white'); 

    // Reset grid/flex properties before content load
    moviesContainer.innerHTML = '';
    
    
    // Header/Player visibility and Layout Control
    if (nav === 'profile') {
        // Hide Player and Menu Bar
        menuBar.classList.add('hidden');
        playerContainer.classList.add('hidden');
        if (currentTitleBar) currentTitleBar.classList.add('hidden'); 
        
        // Profile view: Full-width Flex layout
        moviesContainer.classList.remove('grid', 'grid-cols-5', 'md:grid-cols-5', 'gap-2', 'justify-items-center', 'px-0');
        moviesContainer.classList.add('flex', 'flex-col', 'w-full', 'pt-4'); 
        
    } else {
        // Show Player and Menu Bar
        menuBar.classList.remove('hidden');
        playerContainer.classList.remove('hidden');
        if (currentTitleBar) currentTitleBar.classList.remove('hidden'); 
        
        // Content views: 5-column Grid layout
        moviesContainer.classList.remove('flex', 'flex-col', 'w-full', 'pt-4');
        moviesContainer.classList.add('grid', 'grid-cols-5', 'md:grid-cols-5', 'gap-2', 'justify-items-center', 'px-0');
    }

    // Load Content
    switch (nav) {
        case 'home':
            // Find the previously active category button or default to 'action'
            const activeCategoryBtn = document.querySelector('.menu-btn.active-category') || document.querySelector('.menu-btn[data-category="action"]');
            
            // Call showCategory to load content AND set the category button's active state
            if (activeCategoryBtn) {
                showCategory(activeCategoryBtn.dataset.category, activeCategoryBtn);
            } else if (videos.action) {
                // Last fallback: try to load action content manually if no button exists (shouldn't happen)
                 showCategory('action', document.querySelector('.menu-btn[data-category="action"]'));
            } else {
                // Show message if no content
                const t = translations[currentSettings.language] || translations.english;
                moviesContainer.innerHTML = `<h2 class="text-xl font-bold text-center w-full mb-4 text-white/80 col-span-5">${t.noContent}</h2>`; 
            }
            break;

        case 'trending':
            // Hide all category menu buttons when not on home (CRITICAL for button appearance)
            document.querySelectorAll('.menu-btn').forEach(btn => {
                btn.classList.remove('active-category', 'bg-primary', 'text-black');
                btn.classList.add('bg-gray-800', 'text-white', 'hover:bg-gray-700');
            });
            displayTrending();
            break;

        case 'favorites':
            // Hide all category menu buttons
            document.querySelectorAll('.menu-btn').forEach(btn => {
                btn.classList.remove('active-category', 'bg-primary', 'text-black');
                btn.classList.add('bg-gray-800', 'text-white', 'hover:bg-gray-700');
            });
            displayFavorites();
            break;

        case 'profile':
            // Hide all category menu buttons
            document.querySelectorAll('.menu-btn').forEach(btn => {
                btn.classList.remove('active-category', 'bg-primary', 'text-black');
                btn.classList.add('bg-gray-800', 'text-white', 'hover:bg-gray-700');
            });
            displayProfileSettings();
            break;
    }
}

// ... (showCategory function and helper functions remain the same) ...


// Initial application load (ensures initializeApp runs)
if (typeof window.initializeApp === 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // !!! FIX: Ensure initializeApp runs ONLY once and correctly
        window.initializeApp();
    });
}
