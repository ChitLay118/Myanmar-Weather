/**
 * WY MovieBox - Main JavaScript Logic (v2.4)
 * * Key features:
 * - **Scrollable Player Fix:** Player is now scrollable with content, ensuring buttons are clickable.
 * - **Navigation Consistency:** Ensures all navigation and category buttons work as expected.
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
 * Fetches movie data and translations from the JSON file.
 */
async function loadDataFromJSON() {
    try {
        const response = await fetch('videos_photos.json');
        if (!response.ok) {
            // Error when fetching the file
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        videos = data.videos || {};
        translations = data.translations || {};
        console.log("Data loaded successfully from JSON. (v2.4)");
    } catch (e) {
        console.error("Failed to load JSON data.", e);
        // !!! FIX: Show alert if loading failed, which might be why videos are missing
        const t = translations.myanmar || { Error: "Error", jsonError: "ရုပ်ရှင်ဒေတာများ ဖတ်ယူနိုင်ခြင်း မရှိပါ (JSON Error)။" };
        showCustomAlert(t.Error, t.jsonError);
    }
}

// ... (generateVideoIds function remains the same) ...

/**
 * Loads user state and initializes the app.
 */
window.initializeApp = async function() {
    await loadDataFromJSON(); // Wait for data load
    
    // ... (Update userId and load Settings/Favorites remain the same) ...

    generateVideoIds();

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
    
    // Apply settings and render default view
    applySettings();
    
    // Manually trigger initial category load to ensure content shows immediately
    const homeBtn = document.querySelector('.nav-btn[data-nav="home"]');
    if (homeBtn) {
        // !!! FIX: Use a small timeout to ensure all DOM elements are stable before rendering
        setTimeout(() => changeNav(homeBtn), 100); 
    }
}


// -------------------------------------------------------------------------
// 2. LOCAL STORAGE AND FAVORITES HANDLING (remains the same)
// -------------------------------------------------------------------------
// ... (All functions remain the same) ...


// -------------------------------------------------------------------------
// 3. UI AND VIEW MANAGEMENT (Navigation Logic)
// -------------------------------------------------------------------------

// ... (applySettings, applyLanguage functions remain the same) ...


/**
 * Changes the main view based on bottom navigation.
 * !!! FIX: Ensure Header Stickiness is handled correctly (only the header itself should be sticky now).
 */
window.changeNav = function(btn) {
    const nav = btn.dataset.nav;
    const navBtns = document.querySelectorAll('.nav-btn');
    const menuBar = document.getElementById('menu-bar');
    const playerContainer = document.getElementById('player-container');
    const currentTitleBar = document.querySelector('.max-w-3xl.mx-auto.flex.justify-between.items-center.mb-6');
    const headerSticky = document.getElementById('header-sticky');
    const moviesContainer = document.getElementById('movies');
    
    closeAdultContentModal(false); 

    // Reset all nav buttons
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
            // Check for the active category button (default to action if none active)
            const activeCategoryBtn = document.querySelector('.menu-btn.active-category') || document.querySelector('.menu-btn[data-category="action"]');
            if (activeCategoryBtn) {
                showCategory(activeCategoryBtn.dataset.category, activeCategoryBtn);
            }
            break;

        case 'trending':
            displayTrending();
            break;

        case 'favorites':
            displayFavorites();
            break;

        case 'profile':
            displayProfileSettings();
            break;
    }
}


// -------------------------------------------------------------------------
// 4. RENDERING LOGIC (Category/Trending/Favorites/Profile)
// -------------------------------------------------------------------------
// ... (All rendering functions remain the same) ...


// -------------------------------------------------------------------------
// 5. HELPER AND VIDEO FUNCTIONS
// -------------------------------------------------------------------------
// ... (All helper functions remain the same) ...
