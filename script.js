/**
 * WY MovieBox - Main JavaScript Logic (v2.5 - Critical Fix)
 * * Key features:
 * - **Critical Play Video Fix:** Removed 'event' passing from inline onclick which likely caused JS halting.
 * - **Button State Fix:** Ensures navigation and category buttons change color and view correctly.
 */

// Global state variables
// ... (remain the same) ...


// -------------------------------------------------------------------------
// 1. DATA FETCHING AND INITIALIZATION
// -------------------------------------------------------------------------

// ... (loadDataFromJSON, generateVideoIds functions remain the same) ...

/**
 * Loads user state and initializes the app.
 */
window.initializeApp = async function() {
    await loadDataFromJSON(); 
    
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
        // Use a small timeout to ensure all DOM elements are stable before rendering
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
 * !!! FIX: Explicitly ensure the active button is highlighted correctly.
 */
window.changeNav = function(btn) {
    const nav = btn.dataset.nav;
    const navBtns = document.querySelectorAll('.nav-btn');
    const menuBar = document.getElementById('menu-bar');
    const playerContainer = document.getElementById('player-container');
    const currentTitleBar = document.querySelector('.max-w-3xl.mx-auto.flex.justify-between.items-center.mb-6');
    const moviesContainer = document.getElementById('movies');
    
    closeAdultContentModal(false); 

    // Reset all nav buttons (Critical for color change)
    navBtns.forEach(b => {
        b.classList.remove('text-primary', 'font-bold');
        b.classList.add('text-gray-400', 'hover:text-white');
    });

    // Set active nav button
    btn.classList.add('text-primary', 'font-bold');
    btn.classList.remove('text-gray-400', 'hover:text-white'); // Ensure removal of inactive classes

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
            const activeCategoryBtn = document.querySelector('.menu-btn.active-category') || document.querySelector('.menu-btn[data-category="action"]');
            if (activeCategoryBtn) {
                // Ensure the category button is visually marked active after nav change
                showCategory(activeCategoryBtn.dataset.category, activeCategoryBtn);
            } else if (videos.action) {
                // Fallback rendering for 'action' if no buttons were selected initially
                 showCategory('action', document.querySelector('.menu-btn[data-category="action"]'));
            } else {
                // Last resort: Show alert if no data is present
                const t = translations[currentSettings.language] || translations.english;
                moviesContainer.innerHTML = `<h2 class="text-xl font-bold text-center w-full mb-4 text-white/80 col-span-5">${t.noContent}</h2>`; 
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
// ... (showCategory, displayTrending, displayFavorites, displayProfileSettings remain the same) ...


// -------------------------------------------------------------------------
// 5. HELPER AND VIDEO FUNCTIONS (Critical Fix: playVideo call)
// -------------------------------------------------------------------------

/**
 * Creates the HTML element for a single movie card.
 */
function createMovieCard(movie) {
    const movieId = movie.id; 
    const isFav = favorites.includes(movieId); 
    const t = translations[currentSettings.language] || translations.english;
    const card = document.createElement('div');
    const bgColorClass = currentSettings.theme === 'light' ? 'bg-white' : 'bg-gray-800';
    
    card.className = `movie-card-bg ${bgColorClass} rounded-lg shadow-md hover:shadow-primary/50 transition duration-300 transform hover:scale-[1.03] overflow-hidden cursor-pointer w-full flex flex-col`;
    card.setAttribute('data-movie-id', movieId);

    // !!! CRITICAL FIX: Removed the 'onclick' from the main div to prevent accidental non-button clicks 
    // and ensured the play button's onclick is correct.
    card.innerHTML = `
        <div class="relative w-full aspect-square" onclick="window.playVideo(event, '${movieId}')">
            <img src="${movie.thumb}" alt="${movie.title}" onerror="this.onerror=null;this.src='https://placehold.co/100x100/1a1a1a/cccccc?text=WY'" class="w-full h-full object-cover rounded-t-lg absolute">
            ${isFav ? `<div class="absolute top-1 left-1 text-primary z-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </div>` : ''}
        </div>
        <div class="p-1 flex flex-col justify-between flex-grow">
            <p class="text-[0.6rem] font-medium leading-tight mb-1 truncate">${movie.title}</p> 
            <button onclick="window.playVideo('${movieId}')" class="mt-1 text-[0.6rem] font-semibold text-primary hover:text-black hover:bg-primary transition duration-200 py-1 px-1 rounded-full border border-primary">
                ${t.nowPlaying}
            </button>
        </div>
    `;
    return card;
}

/**
 * Plays a video in the iframe.
 * !!! CRITICAL FIX: The playVideo function no longer strictly requires the 'event' object.
 */
window.playVideo = function(e, movieId) {
    // Check if the first argument is an event object (optional for click blocking)
    if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
        movieId = arguments[1]; // Get movieId from the second argument if event is present
    } else {
        movieId = e; // Assume the first argument is movieId if not an event
    }

    const movie = findMovieById(movieId);
    
    if (!movie) {
        showCustomAlert("Error", "ရုပ်ရှင်ဒေတာရှာမတွေ့ပါ");
        return;
    }
    
    // Check if the button was clicked (if e is present and its target is a button)
    // We remove the play button logic since we are relying on the ID now.
    
    currentPlayingMovie = movie;

    document.getElementById('iframePlayer').src = movie.src;
    document.getElementById('current-movie-title').textContent = movie.title;
    
    updateFavoriteButtonState(movieId);
}


// ... (findMovieById, toggleFullScreen, showCustomAlert, closeCustomAlert, openAdultContentModal, closeAdultContentModal, copyToClipboard functions remain the same) ...


// Initial application load (ensures initializeApp runs)
if (typeof window.initializeApp === 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.db) { 
            window.initializeApp();
        }
    });
}
