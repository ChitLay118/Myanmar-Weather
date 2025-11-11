/**
 * WY MovieBox - Main JavaScript Logic (v3.3 - Player Sticky & Menu Blue Fix)
 * * Key features:
 * - **Player Sticky:** Player remains on top of the screen when scrolling.
 * - **Menu Blue:** Active category button shows blue background.
 */

// ... (Global state variables, defaultSettings, ADULT_WEBVIEW_URL, loadDataFromJSON, generateVideoIds, enableButtons, initializeApp, saveFavorites, toggleFavorite, updateFavoriteButtonState functions are unchanged from v3.2) ...

// -------------------------------------------------------------------------
// 3. UI AND VIEW MANAGEMENT (Navigation Logic)
// -------------------------------------------------------------------------

function applySettings() {
    const lang = currentSettings.language;
    const body = document.getElementById('body-root');
    
    // Theme Application
    if (currentSettings.theme === 'light') {
        body.classList.add('light-mode');
        document.getElementById('header-sticky').classList.remove('bg-darkbg');
        document.getElementById('header-sticky').classList.add('bg-midbg');
    } else {
        body.classList.remove('light-mode');
        document.getElementById('header-sticky').classList.remove('bg-midbg');
        document.getElementById('header-sticky').classList.add('bg-darkbg');
    }

    // Language Application (unchanged)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        } else if (translations.myanmar && translations.myanmar[key]) {
             el.textContent = translations.myanmar[key]; 
        }
    });
}

// ... (changeTheme, changeNav, changeLanguage functions are unchanged from v3.2) ...

// -------------------------------------------------------------------------
// 4. RENDERING LOGIC (Category/Trending/Favorites/Profile)
// -------------------------------------------------------------------------

/**
 * Renders movies for a selected category, applying the blue active color.
 */
window.showCategory = function(category, btn) {
    const moviesContainer = document.getElementById('movies');
    moviesContainer.innerHTML = '';
    
    document.querySelectorAll('.menu-btn').forEach(b => {
        // !!! FIX: Remove primary/black color classes and the new blue class from ALL buttons
        b.classList.remove('active-category', 'active-category-blue', 'text-black', 'bg-primary');
        b.classList.add('bg-gray-800', 'text-white', 'hover:bg-gray-700');
    });

    if (btn) {
        // !!! FIX: Add the new blue active class to the selected button
        btn.classList.add('active-category', 'active-category-blue', 'text-white');
        btn.classList.remove('bg-gray-800', 'hover:bg-gray-700');
    }

    const moviesList = videos[category] || [];
    if (moviesList.length === 0) {
        const t = translations[currentSettings.language] || translations.myanmar;
        moviesContainer.innerHTML = `<h2 class="text-xl font-bold text-center w-full mb-4 text-white/80 col-span-full">${t.noContent || 'No Content Available'}</h2>`;
        return;
    }

    moviesList.forEach(movie => {
        moviesContainer.appendChild(createMovieCard(movie));
    });
};

/**
 * Renders trending movies (using the new 'trending' key in JSON).
 */
function displayTrending() {
    // Reset category buttons when viewing trending
    document.querySelectorAll('.menu-btn').forEach(b => {
        b.classList.remove('active-category', 'active-category-blue', 'text-black', 'bg-primary');
        b.classList.add('bg-gray-800', 'text-white', 'hover:bg-gray-700');
    });

    const moviesContainer = document.getElementById('movies');
    const t = translations[currentSettings.language] || translations.myanmar;
    
    const trendingMovies = videos.trending || []; 
    
    moviesContainer.innerHTML = `<h2 class="text-xl font-bold text-center w-full mb-4 text-white/80 col-span-full">${t.trendingTitle || 'Trending Movies'}</h2>`;
    
    if (trendingMovies.length === 0) {
        moviesContainer.innerHTML += `<p class="text-center w-full text-gray-500 col-span-full">${t.noContent || 'No Content Available'}</p>`;
        return;
    }

    trendingMovies.forEach(movie => {
        moviesContainer.appendChild(createMovieCard(movie));
    });
}

// ... (displayFavorites, displayProfileSettings, createMovieCard, playVideo, findMovieById, openAdultWebview, closeAdultWebview, initialEventListener functions are unchanged from v3.2) ...
