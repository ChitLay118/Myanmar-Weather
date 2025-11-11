/**
 * WY MovieBox - Main JavaScript Logic (v2.1)
 * * Key features:
 * - Blue (Primary) Theme for buttons/accents.
 * - **Removed Player Stickiness** (Iframe scrolls with content).
 * - **Trending Category Fix** (Uses 'trending' category from JSON if available, otherwise shows last 10).
 * - Mobile 5-column grid with small text for movie cards.
 */

// Global state variables
let videos = {};
let translations = {};
let favorites = [];
let currentPlayingMovie = null; 
let currentSettings = {};

// User ID fallback (for non-Firebase environments)
let userId = localStorage.getItem('localUserId') || crypto.randomUUID();
if (localStorage.getItem('localUserId') === null) {
    localStorage.setItem('localUserId', userId);
}

// Default settings
const defaultSettings = {
    language: 'myanmar',
    theme: 'dark',
    name: '',
    email: ''
};


// -------------------------------------------------------------------------
// 1. DATA FETCHING AND INITIALIZATION
// -------------------------------------------------------------------------

// ... (loadDataFromJSON, generateVideoIds, initializeApp functions remain the same) ...

/**
 * Fetches movie data and translations from the JSON file.
 */
async function loadDataFromJSON() {
    try {
        // Assume videos_photos.json contains both 'videos' and 'translations' keys
        const response = await fetch('videos_photos.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        videos = data.videos || {};
        translations = data.translations || {};
        console.log("Data loaded successfully from JSON. (v2.1)");
    } catch (e) {
        console.error("Failed to load JSON data. Ensure the 'videos_photos.json' file exists.", e);
        showCustomAlert("Error", "JSON ဒေတာကို ဖတ်ယူနိုင်ခြင်း မရှိပါ။");
    }
}

/**
 * Automatically generates a unique ID for each video.
 */
function generateVideoIds() {
    for (const category in videos) {
        if (Array.isArray(videos[category])) {
            videos[category].forEach((movie, index) => {
                movie.id = `${category}-${index}`; 
            });
        }
    }
}

/**
 * Loads user state and initializes the app.
 */
window.initializeApp = async function() {
    await loadDataFromJSON();
    
    // Update userId based on Firebase (if available)
    if (window.auth && window.auth.currentUser) {
        userId = window.auth.currentUser.uid;
        document.getElementById('user-id-display') && (document.getElementById('user-id-display').textContent = userId);
    } 

    generateVideoIds();

    // Load Settings and Favorites
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
    const homeBtn = document.querySelector('.nav-btn[data-nav="home"]');
    if (homeBtn) {
        changeNav(homeBtn);
    }
}

// -------------------------------------------------------------------------
// 2. LOCAL STORAGE AND FAVORITES HANDLING (Remains the same)
// -------------------------------------------------------------------------
// ... (saveProfileInfo, updateQuickSettings, saveFavoritesToLocalStorage, 
//      toggleFavorite, updateFavoriteButtonState functions remain the same) ...


// -------------------------------------------------------------------------
// 3. UI AND VIEW MANAGEMENT (Theme/Language/Navigation)
// -------------------------------------------------------------------------

// ... (applySettings, applyLanguage functions remain the same) ...


/**
 * Changes the main view based on bottom navigation.
 */
window.changeNav = function(btn) {
    const nav = btn.dataset.nav;
    const navBtns = document.querySelectorAll('.nav-btn');
    const menuBar = document.getElementById('menu-bar');
    const playerContainer = document.getElementById('player-container');
    const currentTitleBar = document.querySelector('.max-w-3xl.mx-auto.flex.justify-between.items-center.mb-6');
    const headerSticky = document.getElementById('header-sticky');
    const moviesContainer = document.getElementById('movies');
    
    // Ensure adult modal is closed
    closeAdultContentModal(false); 

    navBtns.forEach(b => {
        b.classList.remove('text-primary', 'font-bold');
        b.classList.add('text-gray-400', 'hover:text-white');
    });

    btn.classList.add('text-primary', 'font-bold');
    btn.classList.remove('text-gray-400', 'hover:text-white');

    // Reset grid/flex properties before content load
    moviesContainer.innerHTML = '';
    
    
    // Header/Player visibility
    if (nav === 'profile') {
        menuBar.classList.add('hidden');
        playerContainer.classList.add('hidden');
        if (currentTitleBar) currentTitleBar.classList.add('hidden'); 
        
        // Remove sticky from header in profile view
        headerSticky.classList.remove('sticky'); 
        
        // Profile view အတွက် moviesContainer ကို flex-col အဖြစ် ပြန်ပြောင်း
        moviesContainer.classList.remove('grid', 'grid-cols-5', 'md:grid-cols-5', 'gap-2', 'justify-items-center', 'px-0');
        moviesContainer.classList.add('flex', 'flex-col', 'w-full');
        
    } else {
        menuBar.classList.remove('hidden');
        playerContainer.classList.remove('hidden');
        if (currentTitleBar) currentTitleBar.classList.remove('hidden'); 
        
        // Add sticky back to header
        headerSticky.classList.add('sticky'); 
        
        // Ensure grid is set for content views
        moviesContainer.classList.remove('flex', 'flex-col', 'w-full');
        moviesContainer.classList.add('grid', 'grid-cols-5', 'md:grid-cols-5', 'gap-2', 'justify-items-center', 'px-0');
    }

    // Load Content
    switch (nav) {
        case 'home':
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

// ... (showCategory function remains the same) ...

function displayTrending() {
    const moviesContainer = document.getElementById('movies');
    
    // FIX: Ensure the container is set to grid mode for Trending view
    moviesContainer.classList.remove('flex', 'flex-col', 'w-full');
    moviesContainer.classList.add('grid', 'grid-cols-5', 'md:grid-cols-5', 'gap-2', 'justify-items-center', 'px-0');
    
    moviesContainer.innerHTML = '';
    
    const t = translations[currentSettings.language] || translations.english;
    
    let trendingMovies = [];

    // FIX: Check if 'trending' category exists in the JSON
    if (videos.trending && videos.trending.length > 0) {
        trendingMovies = videos.trending;
    } else {
        // Fallback: Show last 10 movies from all categories
        let allMovies = [];
        for (const category in videos) {
             // Exclude the 'trending' category itself from the fallback aggregation
            if (category !== 'trending' && Array.isArray(videos[category])) {
                allMovies = allMovies.concat(videos[category]);
            }
        }
        // Shuffle and take a slice (or just take last 10 as before)
        trendingMovies = allMovies.slice(-10); 
    }
    
    moviesContainer.innerHTML = `<h2 class="text-xl font-bold text-center w-full mb-4 text-white/80 col-span-5">${t.trendingHeader}</h2>`; 
    
    if (trendingMovies.length === 0) {
        moviesContainer.innerHTML += `<p class="text-gray-500 mt-5 text-center text-lg w-full col-span-5">${t.noContent}</p>`; 
        return;
    }
    
    trendingMovies.forEach(movie => {
        moviesContainer.appendChild(createMovieCard(movie));
    });
}

// ... (displayFavorites, displayProfileSettings functions remain the same) ...


// -------------------------------------------------------------------------
// 5. HELPER AND VIDEO FUNCTIONS
// -------------------------------------------------------------------------

// ... (createMovieCard, findMovieById, playVideo, toggleFullScreen functions remain the same) ...


// ... (showCustomAlert, closeCustomAlert, openAdultContentModal, closeAdultContentModal, copyToClipboard functions remain the same) ...


// Initial application load (ensures initializeApp runs)
if (typeof window.initializeApp === 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.db) { 
            window.initializeApp();
        }
    });
}
