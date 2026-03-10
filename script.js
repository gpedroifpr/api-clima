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

window.onload = () => {
    const savedWeather = localStorage.getItem('clima_salvo');
    if (savedWeather) {
        const parsedData = JSON.parse(savedWeather);
        updateUI(parsedData);
    }
    updateHistoryUI();
};

// ==========================================
// FASE 3: CONEXÃO COM A REDE (Fetch API)
// ==========================================
async function getWeather(city) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`;
        
        const response = await fetch(url);
        const data = await response.json();

        // LOG PARA DEBUG: Pressione F12 no navegador para ver o que a API respondeu
        console.log("Resposta da API:", data); 

        // Se a requisição não der certo (ex: erro 404 ou 401)
        if (!response.ok) {
            if (data.cod == 401) {
                // Erro 401 significa que a API Key é inválida ou não ativou ainda
                showError("Erro 401: Chave da API inválida ou ainda não ativada. Aguarde uns minutos!");
            } else {
                showError("Cidade não encontrada. Verifique o nome e tente novamente.");
            }
            return; // Para a execução da função aqui
        }

        updateUI(data);
        saveToCache(data);
        addToHistory(data.name);

    } catch (error) {
        console.error("Erro na requisição:", error);
        showError("Erro na conexão. Verifique sua internet.");
    }
}

// ==========================================
// DESAFIO NÍVEL 2: GEOLOCATION API
// ==========================================
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
        console.error("Erro na requisição por GPS:", error);
        showError("Erro na conexão com a API.");
    }
}

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                getWeatherByLocation(position.coords.latitude, position.coords.longitude);
            },
            () => {
                showError("Acesso à localização negado pelo usuário.");
            }
        );
    } else {
        showError("Seu navegador não suporta geolocalização.");
    }
});

// ==========================================
// FUNÇÕES AUXILIARES E MANIPULAÇÃO DO DOM
// ==========================================

function updateUI(data) {
    errorMessage.classList.add('hidden');
    weatherCard.classList.remove('hidden'); 

    cityNameElement.innerText = data.name;
    tempElement.innerText = `${Math.round(data.main.temp)}°C`; 
    descElement.innerText = data.weather[0].description;
    
    const iconCode = data.weather[0].icon;
    iconElement.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

function saveToCache(data) {
    localStorage.setItem('clima_salvo', JSON.stringify(data));
}

// ----------------------------------------------------
// ✨ O TRUQUE DE UX PARA A MENSAGEM DE ERRO
// ----------------------------------------------------
function showError(mensagem) {
    weatherCard.classList.add('hidden');
    
    // Atualiza o texto do erro dependendo do que aconteceu
    errorMessage.innerText = mensagem; 
    errorMessage.classList.remove('hidden');

    // Remove a classe de tremor (se já existir)
    errorMessage.classList.remove('shake');
    
    // TRUQUE (Reflow): Força o navegador a recalcular a tela. 
    // Sem isso, o CSS não reinicia a animação.
    void errorMessage.offsetWidth; 
    
    // Adiciona a classe novamente, fazendo o erro "tremer" toda vez que falhar
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

// ==========================================
// DESAFIO NÍVEL 1: HISTÓRICO DAS ÚLTIMAS 5
// ==========================================
function addToHistory(cityName) {
    history = history.filter(city => city !== cityName);
    history.unshift(cityName);
    
    if (history.length > 5) {
        history.pop();
    }

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