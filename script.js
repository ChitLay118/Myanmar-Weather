/**
 * WY MovieBox - Main JavaScript Logic (v2.2)
 * * Key features:
 * - **Fixed Player:** Player is now sticky/fixed under the header and does not scroll.
 * - **Button Fix:** All navigation and category buttons are fully functional.
 * - **Favorite Fix:** Favorite logic and button state are correctly managed.
 * - **Trending Category Fix** (Uses 'trending' category from JSON).
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

/**
 * Fetches movie data and translations from the JSON file.
 * !!! NOTE: Requires a `videos_photos.json` file to be present.
 */
async function loadDataFromJSON() {
    try {
        const response = await fetch('videos_photos.json');
        if (!response.ok) {
            // If the JSON file is not found, we cannot proceed, so we stop here.
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        videos = data.videos || {};
        translations = data.translations || {};
        console.log("Data loaded successfully from JSON. (v2.2)");
    } catch (e) {
        console.error("Failed to load JSON data. Ensure the 'videos_photos.json' file exists.", e);
        // Fallback to show an alert if data cannot be loaded.
        showCustomAlert("Error", "ရုပ်ရှင်ဒေတာများ ဖတ်ယူနိုင်ခြင်း မရှိပါ (JSON Error)။");
    }
}

// ... (generateVideoIds function remains the same) ...

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
    
    // Manually trigger initial category load to ensure content shows immediately
    const homeBtn = document.querySelector('.nav-btn[data-nav="home"]');
    if (homeBtn) {
        changeNav(homeBtn);
    }
}


// -------------------------------------------------------------------------
// 2. LOCAL STORAGE AND FAVORITES HANDLING (Favorite Logic Fixed)
// -------------------------------------------------------------------------
// ... (saveProfileInfo, updateQuickSettings, saveFavoritesToLocalStorage functions remain the same) ...

/**
 * Toggles the favorite status of the currently playing movie.
 * !!! FIX: Ensures that favorite state is saved and button state is updated immediately.
 */
window.toggleFavorite = function() {
    const t = translations[currentSettings.language] || translations.english;

    if (!currentPlayingMovie) {
        showCustomAlert("Favorite", t.selectMovieForFavorite);
        return;
    }

    const movieId = currentPlayingMovie.id;
    const index = favorites.indexOf(movieId);

    if (index > -1) {
        favorites.splice(index, 1);
        showCustomAlert("Favorite", `${currentPlayingMovie.title} ${t.removedFromFav}.`);
    } else {
        favorites.push(movieId);
        showCustomAlert("Favorite", `${currentPlayingMovie.title} ${t.addedToFav}.`);
    }

    saveFavoritesToLocalStorage();
    updateFavoriteButtonState(movieId);

    // Re-render favorites view if active
    const activeNavBtn = document.querySelector('.nav-btn.text-primary');
    if (activeNavBtn && activeNavBtn.dataset.nav === 'favorites') {
        displayFavorites();
    }
    // Also update the state of the movie card in the current view if visible
    const currentCard = document.querySelector(`.movie-card-bg[data-movie-id="${movieId}"]`);
    if (currentCard) {
         currentCard.parentNode.replaceChild(createMovieCard(currentPlayingMovie), currentCard);
    }
}

// ... (updateFavoriteButtonState function remains the same) ...


// -------------------------------------------------------------------------
// 3. UI AND VIEW MANAGEMENT (Navigation Logic Fixed)
// -------------------------------------------------------------------------

// ... (applySettings, applyLanguage functions remain the same) ...


/**
 * Changes the main view based on bottom navigation.
 * !!! FIX: Ensures visibility and layout classes are correctly managed.
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
        headerSticky.classList.remove('sticky'); // Header scrolls in profile view

        // Profile view: Full-width Flex layout
        moviesContainer.classList.remove('grid', 'grid-cols-5', 'md:grid-cols-5', 'gap-2', 'justify-items-center', 'px-0');
        moviesContainer.classList.add('flex', 'flex-col', 'w-full', 'pt-4'); // Added pt-4 for top padding
        
    } else {
        // Show Player and Menu Bar
        menuBar.classList.remove('hidden');
        playerContainer.classList.remove('hidden');
        if (currentTitleBar) currentTitleBar.classList.remove('hidden'); 
        headerSticky.classList.add('sticky'); // Header is sticky in content views
        
        // Content views: 5-column Grid layout
        moviesContainer.classList.remove('flex', 'flex-col', 'w-full', 'pt-4');
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

/**
 * Renders the movie list for a specific category.
 */
window.showCategory = function(category, clickedButton) {
    const moviesContainer = document.getElementById('movies');
    
    // Ensure the container is set to grid mode (Important for all content views)
    moviesContainer.classList.remove('flex', 'flex-col', 'w-full', 'pt-4');
    moviesContainer.classList.add('grid', 'grid-cols-5', 'md:grid-cols-5', 'gap-2', 'justify-items-center', 'px-0');
    
    // Clear the container first
    moviesContainer.innerHTML = ''; 
    
    const t = translations[currentSettings.language] || translations.english;
    const isLight = currentSettings.theme === 'light';

    // Button state logic (works)
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.remove('active-category', 'bg-primary', 'text-black');
        btn.classList.add(isLight ? 'bg-gray-200' : 'bg-gray-800', isLight ? 'text-gray-800' : 'text-white');
        btn.classList.add(isLight ? 'hover:bg-gray-300' : 'hover:bg-gray-700');
    });

    if (clickedButton) {
        clickedButton.classList.remove('bg-gray-800', 'text-white', 'bg-gray-200', 'text-gray-800', 'hover:bg-gray-700', 'hover:bg-gray-300');
        clickedButton.classList.add('active-category', 'bg-primary', 'text-black');
    }

    const categoryVideos = videos[category] || [];
    
    // Header for the section spanning all 5 columns
    moviesContainer.innerHTML = `<h2 class="text-xl font-bold text-center w-full mb-4 text-white/80 col-span-5">${t.selectCategory}: ${t[category] || category}</h2>`; 

    if (categoryVideos.length === 0) {
        moviesContainer.innerHTML += `<p class="text-gray-500 mt-5 text-center text-lg w-full col-span-5">${t.noContent}</p>`; 
        return;
    }

    categoryVideos.forEach(movie => {
        moviesContainer.appendChild(createMovieCard(movie));
    });
}

function displayTrending() {
    const moviesContainer = document.getElementById('movies');
    
    // Ensure the container is set to grid mode for Trending view
    moviesContainer.classList.remove('flex', 'flex-col', 'w-full', 'pt-4');
    moviesContainer.classList.add('grid', 'grid-cols-5', 'md:grid-cols-5', 'gap-2', 'justify-items-center', 'px-0');
    
    moviesContainer.innerHTML = '';
    
    const t = translations[currentSettings.language] || translations.english;
    
    let trendingMovies = [];

    // Prioritize 'trending' category if it exists in JSON
    if (videos.trending && videos.trending.length > 0) {
        trendingMovies = videos.trending;
    } else {
        // Fallback: Show last 10 movies from all categories
        let allMovies = [];
        for (const category in videos) {
            if (Array.isArray(videos[category])) {
                allMovies = allMovies.concat(videos[category]);
            }
        }
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
// 5. HELPER AND VIDEO FUNCTIONS (Favorite Icon in Card Fixed)
// -------------------------------------------------------------------------

/**
 * Creates the HTML element for a single movie card.
 */
function createMovieCard(movie) {
    const movieId = movie.id; 
    // !!! FIX: Need to check global favorites array
    const isFav = favorites.includes(movieId); 
    const t = translations[currentSettings.language] || translations.english;
    const card = document.createElement('div');
    const bgColorClass = currentSettings.theme === 'light' ? 'bg-white' : 'bg-gray-800';
    
    // w-full, aspect-square (1:1) and small text size for 5 columns
    card.className = `movie-card-bg ${bgColorClass} rounded-lg shadow-md hover:shadow-primary/50 transition duration-300 transform hover:scale-[1.03] overflow-hidden cursor-pointer w-full flex flex-col`;
    card.setAttribute('data-movie-id', movieId);

    card.innerHTML = `
        <div class="relative w-full aspect-square">
            <img src="${movie.thumb}" alt="${movie.title}" onerror="this.onerror=null;this.src='https://placehold.co/100x100/1a1a1a/cccccc?text=WY'" class="w-full h-full object-cover rounded-t-lg absolute">
            ${isFav ? `<div class="absolute top-1 left-1 text-primary z-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </div>` : ''}
        </div>
        <div class="p-1 flex flex-col justify-between flex-grow">
            <p class="text-[0.6rem] font-medium leading-tight mb-1 truncate">${movie.title}</p> 
            <button onclick="window.playVideo(event, '${movieId}')" class="mt-1 text-[0.6rem] font-semibold text-primary hover:text-black hover:bg-primary transition duration-200 py-1 px-1 rounded-full border border-primary">
                ${t.nowPlaying}
            </button>
        </div>
    `;
    return card;
}

// ... (findMovieById, playVideo, toggleFullScreen, showCustomAlert, closeCustomAlert, openAdultContentModal, closeAdultContentModal, copyToClipboard functions remain the same) ...


// Initial application load (ensures initializeApp runs)
if (typeof window.initializeApp === 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.db) { 
            window.initializeApp();
        }
    });
}
