// ==========================================
// 🔴 ATENÇÃO: COLOQUE SUA API KEY AQUI
// ==========================================
const apiKey = '35d7762b577524cae23a447edf545f5c'; 

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const weatherCard = document.getElementById('weather-card');
const errorMessage = document.getElementById('error-message');
const cityNameElement = document.getElementById('city-name');
const tempElement = document.getElementById('temperature');
const descElement = document.getElementById('description');
const iconElement = document.getElementById('weather-icon');
const historySection = document.getElementById('history-section');
const historyButtonsContainer = document.getElementById('history-buttons');

let history = JSON.parse(localStorage.getItem('historico_cidades')) ||[];

// Variáveis Globais para o Mapa
let map;
let marker;

window.onload = () => {
    const savedWeather = localStorage.getItem('clima_salvo');
    if (savedWeather) {
        const parsedData = JSON.parse(savedWeather);
        updateUI(parsedData);
    }
    updateHistoryUI();
};

async function getWeather(city) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            if (data.cod == 401) {
                showError("Erro 401: Chave da API inválida ou ainda não ativada.");
            } else {
                showError("Cidade não encontrada. Verifique o nome.");
            }
            return; 
        }

        updateUI(data);
        saveToCache(data);
        addToHistory(data.name);

    } catch (error) {
        showError("Erro na conexão com a API.");
    }
}

async function getWeatherByLocation(lat, lon) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            showError("Não foi possível obter o clima para sua localização.");
            return;
        }

        updateUI(data);
        saveToCache(data);
        addToHistory(data.name);
    } catch (error) {
        showError("Erro na conexão com a API.");
    }
}

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                getWeatherByLocation(position.coords.latitude, position.coords.longitude);
            },
            () => { showError("Acesso à localização negado."); }
        );
    } else {
        showError("Seu navegador não suporta geolocalização.");
    }
});

function updateUI(data) {
    errorMessage.classList.add('hidden');
    weatherCard.classList.remove('hidden'); 

    cityNameElement.innerText = data.name;
    tempElement.innerText = `${Math.round(data.main.temp)}°C`; 
    descElement.innerText = data.weather[0].description;
    
    const iconCode = data.weather[0].icon;
    iconElement.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    // ==========================================
    // LÓGICA DO MAPA (LEAFLET)
    // ==========================================
    const lat = data.coord.lat;
    const lon = data.coord.lon;

    if (!map) {
        // Se o mapa ainda não existe, cria ele
        map = L.map('map').setView([lat, lon], 12);
        
        // Adiciona a camada de imagens do OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Cria o pino (marcador)
        marker = L.marker([lat, lon]).addTo(map);
    } else {
        // Se o mapa já existe, apenas move a câmera e o pino para a nova cidade
        map.setView([lat, lon], 12);
        marker.setLatLng([lat, lon]);
    }

    // Truque: Quando o mapa é carregado dentro de uma div que estava escondida (hidden), 
    // ele pode bugar o tamanho cinza. Isso força ele a recalcular o tamanho correto em 0.1 segundo.
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

function saveToCache(data) {
    localStorage.setItem('clima_salvo', JSON.stringify(data));
}

function showError(mensagem) {
    weatherCard.classList.add('hidden');
    errorMessage.innerText = mensagem; 
    errorMessage.classList.remove('hidden');
    errorMessage.classList.remove('shake');
    void errorMessage.offsetWidth; 
    errorMessage.classList.add('shake');
}

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) getWeather(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) getWeather(city);
    }
});

function addToHistory(cityName) {
    history = history.filter(city => city !== cityName);
    history.unshift(cityName);
    if (history.length > 5) history.pop();
    localStorage.setItem('historico_cidades', JSON.stringify(history));
    updateHistoryUI();
}

function updateHistoryUI() {
    if (history.length === 0) return;
    historySection.classList.remove('hidden');
    historyButtonsContainer.innerHTML = ''; 

    history.forEach(city => {
        const btn = document.createElement('button');
        btn.innerText = city;
        btn.classList.add('history-btn');
        btn.addEventListener('click', () => {
            cityInput.value = city; 
            getWeather(city);
        });
        historyButtonsContainer.appendChild(btn);
    });
}