/**
 * WY MovieBox - Main JavaScript Logic (v2.7 - Button Interactivity Fix)
 * * Key features:
 * - **Interactivity Control:** Buttons are disabled until all critical data is loaded.
 */

// Global state variables
// ... (videos, translations, favorites, etc. remain the same) ...


// -------------------------------------------------------------------------
// 1. DATA FETCHING AND INITIALIZATION
// -------------------------------------------------------------------------

// ... (initFirebase, loadDataFromJSON, generateVideoIds functions remain the same) ...


/**
 * Enables all navigation and category buttons after the app is initialized.
 */
function enableButtons() {
    const navBar = document.getElementById('nav-bar');
    const menuBar = document.getElementById('menu-bar');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    // 1. Remove loading indicator
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
    
    // 2. Enable Navigation and Menu Bar
    navBar.classList.remove('pointer-events-none', 'opacity-50');
    menuBar.classList.remove('pointer-events-none', 'opacity-50');
}


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
    
    // 5. !!! CRITICAL: Enable Buttons ONLY after everything is loaded and applied
    enableButtons(); 
    
    const homeBtn = document.querySelector('.nav-btn[data-nav="home"]');
    if (homeBtn) {
        // Now that buttons are enabled, call changeNav to render content
        changeNav(homeBtn); 
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
// ... (changeNav, showCategory, etc. remain the same as v2.6) ...
// -------------------------------------------------------------------------


// -------------------------------------------------------------------------
// 4. RENDERING LOGIC (Category/Trending/Favorites/Profile)
// ... (remain the same) ...
// -------------------------------------------------------------------------


// -------------------------------------------------------------------------
// 5. HELPER AND VIDEO FUNCTIONS
// ... (createMovieCard, playVideo, etc. remain the same as v2.5/v2.6) ...
// -------------------------------------------------------------------------


// Initial application load (ensures initializeApp runs)
window.addEventListener('DOMContentLoaded', () => {
    // !!! FIX: Ensure initializeApp runs ONLY once and correctly
    window.initializeApp();
});
