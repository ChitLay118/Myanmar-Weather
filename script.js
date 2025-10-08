// =================================================================
// OpenWeatherMap API Key (သင့်ရဲ့ Key ဖြင့် အစားထိုးပါ)
// =================================================================
const API_KEY = "fa7a0f754dbf43b4d347bba02b695607"; // ဤနေရာတွင် သင်၏ API Key ကို ထည့်ပါ။
const API_URL = "https://api.openweathermap.org/data/2.5/weather";

// =================================================================
// မြေပုံ (Map) Setup
// =================================================================
let map = null; // Map Object ကို သိမ်းဆည်းရန်
let weatherMarker = null; // Marker Object ကို သိမ်းဆည်းရန်

function initializeMap() {
    // မြန်မာနိုင်ငံ အလယ်ဗဟို (Nay Pyi Taw အနီး) ကို ဗဟိုပြု၍ Map ကို စတင်ပါ
    const initialLat = 20.0;
    const initialLon = 95.0;
    
    // map ကို တစ်ကြိမ်သာ စတင်ရမည်
    if (map === null) {
        map = L.map('map').setView([initialLat, initialLon], 6); // zoom level 6
        
        // OpenStreetMap ကို အသုံးပြုရန် Tiles Layer ထည့်သွင်းခြင်း
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    }
}

function updateMap(lat, lon, city, temp, description) {
    // မြေပုံကို ရာသီဥတုရှာဖွေလိုက်တဲ့ မြို့ရဲ့ နေရာကို ဗဟိုရွှေ့ပါ
    map.setView([lat, lon], 10);
    
    // အရင်ရှိနေတဲ့ Marker ကို ဖြုတ်ပါ
    if (weatherMarker) {
        map.removeLayer(weatherMarker);
    }
    
    // မြေပုံပေါ်မှာ Marker အသစ်ထည့်ခြင်း
    const popupContent = `
        <b>${city}</b><br>
        အပူချိန်: ${temp}°C<br>
        အခြေအနေ: ${description}
    `;
    
    weatherMarker = L.marker([lat, lon])
        .addTo(map)
        .bindPopup(popupContent)
        .openPopup(); // ချက်ချင်း ဖွင့်ပြပါ
}

// =================================================================
// DOM Elements များကို ရယူခြင်း
// =================================================================
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const locationElement = document.getElementById('location');
const temperatureElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');
const additionalInfoElement = document.getElementById('additional-info');
const citiesListElement = document.getElementById('cities-list');

// =================================================================
// မြန်မာနိုင်ငံရှိ အဓိက မြို့များ စာရင်း (မြို့ ၄၀ နီးပါး)
// =================================================================
const MYANMAR_MAJOR_CITIES = [
    "Yangon", "Mandalay", "Nay Pyi Taw", "Taunggyi", "Mawlamyine", 
    "Pathein", "Magway", "Bago", "Sittwe", "Myitkyina", "Loikaw", 
    "Hpa-An", "Monywa", "Hakha", "Pyay", "Pakokku", "Myingyan", 
    "Pyin Oo Lwin", "Lashio", "Kengtung", "Dawei", "Myeik", "Kawthoung", 
    "Myawaddy", "Kalay", "Shwebo", "Thaton", "Muse", "Thandwe", 
    "Mogok", "Kyaukpyu", "Falam", "Aunglan", "Yenangyaung", "Chauk",
    "Sagaing", "Taungoo", "Hinthada", "Myaungmya", "Maubin"
];


// =================================================================
// ရာသီဥတု အချက်အလက်များ ရယူခြင်း Function
// =================================================================
async function fetchWeather(city) {
    if (!API_KEY || API_KEY === "YOUR_API_KEY") {
        displayError("API Key ကို 'script.js' တွင် အရင်ထည့်သွင်းပါ။");
        return;
    }
    
    const url = `${API_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=en`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            displayError(`Error: မြို့အမည် '${city}' ကို ရှာမတွေ့ပါ။ (သို့မဟုတ်) ${errorData.message}`);
            return;
        }

        const data = await response.json();
        displayWeather(data);

    } catch (error) {
        console.error("Fetching weather data failed:", error);
        displayError("အချက်အလက် ရယူရာတွင် အမှားဖြစ်ပွားပါသည်။");
    }
}

// =================================================================
// ရာသီဥတု အချက်အလက်များ ပြသခြင်းနှင့် မြေပုံကို Update လုပ်ခြင်း
// =================================================================
function displayWeather(data) {
    const temp = Math.round(data.main.temp); 
    const description = data.weather[0].description.toUpperCase();
    const lat = data.coord.lat;
    const lon = data.coord.lon;

    locationElement.textContent = data.name;
    temperatureElement.textContent = `${temp}°C`;
    descriptionElement.textContent = description;

    additionalInfoElement.innerHTML = `
        <p>အစိုဓာတ်: <strong>${data.main.humidity}%</strong></p>
        <p>လေတိုက်နှုန်း: <strong>${data.wind.speed} m/s</strong></p>
        <p>အမြင့်ဆုံး/အနိမ့်ဆုံး: <strong>${Math.round(data.main.temp_max)}°C / ${Math.round(data.main.temp_min)}°C</strong></p>
    `;
    
    // မြေပုံကို အချက်အလက်အသစ်နဲ့ Update လုပ်ပါ
    updateMap(lat, lon, data.name, temp, description);
    
    // နောက်ခံအရောင် ပြောင်းလဲခြင်း
    updateBackground(data.weather[0].main);
}

// ... (displayError, updateBackground, displayCitiesList functions များကို အပေါ်က Code အတိုင်း ထားရှိပါမည်) ...

function displayError(message) {
    locationElement.textContent = "Error";
    temperatureElement.textContent = "--";
    descriptionElement.textContent = message;
    additionalInfoElement.innerHTML = '';
    // Error တက်ရင် Marker ကို ဖြုတ်ပါ
    if (weatherMarker) {
        map.removeLayer(weatherMarker);
    }
}

function updateBackground(weatherCondition) {
    const body = document.body;
    body.className = ''; 
    
    switch(weatherCondition) {
        case 'Clear':
            body.classList.add('clear-sky'); 
            break;
        case 'Clouds':
            body.classList.add('cloudy-sky'); 
            break;
        case 'Rain':
        case 'Drizzle':
            body.classList.add('rainy-sky'); 
            break;
        case 'Thunderstorm':
            body.classList.add('thunder-sky'); 
            break;
        case 'Mist':
        case 'Fog':
            body.classList.add('mist-fog-sky'); 
            break;
        default:
            body.classList.add('default-sky');
    }
}

function displayCitiesList() {
    let html = '<h4>အဓိကမြို့များကို နှိပ်၍ ကြည့်ရှုပါ:</h4><ul>';
    MYANMAR_MAJOR_CITIES.forEach(city => {
        html += `<li onclick="fetchWeather('${city}')">${city}</li>`;
    });
    html += '</ul>';
    citiesListElement.innerHTML = html;
}

// =================================================================
// Event Listeners နှင့် App စတင်ခြင်း
// =================================================================

searchButton.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
        fetchWeather(city);
        searchInput.value = '';
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchButton.click();
    }
});

// App စတင်ချိန်တွင် လုပ်ဆောင်ရန်
window.onload = () => {
    // Map ကို စတင်သတ်မှတ်ခြင်း
    initializeMap(); 
    
    // မြို့စာရင်းကို ပြသပါ
    displayCitiesList(); 
    
    // Default အနေနဲ့ ရန်ကုန်မြို့ ရာသီဥတုကို စတင်ပြသပြီး မြေပုံပေါ်မှာ Marker ချပါ
    fetchWeather("Yangon"); 
};
