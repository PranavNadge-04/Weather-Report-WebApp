const API_KEY = "f4e64a7f7906532bfbeb355ece98df3c";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const form = document.getElementById("searchForm");
const input = document.getElementById("cityInput");
const currentWeatherEl = document.getElementById("currentWeather");
const forecastEl = document.getElementById("forecast");
const statusEl = document.getElementById("status");

// Load saved city
window.addEventListener("DOMContentLoaded", () => {
  const savedCity = localStorage.getItem("city");
  if (savedCity) {
    input.value = savedCity;
    fetchWeather(savedCity);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  renderFavorites();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = input.value.trim();
  if (!city) return;

  localStorage.setItem("city", city);
  fetchWeather(city);
});

async function fetchWeather(city) {
  try {
    showLoading();

    const currentRes = await fetch(
      `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
    const currentData = await currentRes.json();

    if (currentData.cod !== 200) throw new Error(currentData.message);

    const forecastRes = await fetch(
      `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
    );
    const forecastData = await forecastRes.json();

    renderCurrentWeather(currentData);
    renderForecast(forecastData);

    statusEl.textContent = "";
  } catch (error) {
    showError(error.message);
  }
}

function setBackground(condition) {
  const backgrounds = {
    Clear: "images/sunny1.jpg",
    Clouds: "images/cloudy1.jpg",
    Rain: "images/rain1.jpg",
    Thunderstorm: "images/storm1.jpg",
    Snow: "images/snow1.jpg",
    Mist: "images/mist1.jpg"
  };

  const bg = backgrounds[condition] || "images/default.jpg";

  document.body.style.background = `url(${bg}) no-repeat center center fixed`;
  document.body.style.backgroundSize = "cover";
}

function renderCurrentWeather(data) {
  const city = data.name;

  currentWeatherEl.innerHTML = `
    <div class="card">
      <h2>${city}</h2>
      <button onclick="addFavorite('${city}')">⭐ Add to Favorites</button>
      <p>${data.weather[0].description}</p>
      <h3>${data.main.temp}°C</h3>
    </div>
  `;

  setBackground(data.weather[0].main);
}



function renderForecast(data) {
  forecastEl.innerHTML = "";

  const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));

  daily.slice(0, 5).forEach(day => {
    const date = new Date(day.dt_txt).toLocaleDateString();

    forecastEl.innerHTML += `
      <div class="card">
        <p>${date}</p>
        <p>${day.weather[0].main}</p>
        <p>${day.main.temp}°C</p>
      </div>
    `;
  });
}


const geoBtn = document.getElementById("geoBtn");

geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  showLoading();

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const res = await fetch(
          `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );
        const data = await res.json();

        fetchWeather(data.name); // reuse your existing function
      } catch (err) {
        showError("Failed to fetch location weather");
      }
    },
    () => {
      showError("Location access denied");
    }
  );
});

localStorage.setItem("lastMode", "geo");

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function renderFavorites() {
  const list = document.getElementById("favoritesList");
  list.innerHTML = "";

  favorites.forEach((city, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span onclick="fetchWeather('${city}')">${city}</span>
      <button onclick="removeFavorite(${index})">❌</button>
    `;

    list.appendChild(li);
  });
}

function addFavorite(city) {
  if (!favorites.includes(city)) {
    favorites.push(city);
    saveFavorites();
    renderFavorites();
  }
}

function removeFavorite(index) {
  favorites.splice(index, 1);
  saveFavorites();
  renderFavorites();
}

function showLoading() {
  statusEl.innerHTML = `<p class="loading">Loading...</p>`;
  currentWeatherEl.innerHTML = "";
  forecastEl.innerHTML = "";
}

function showError(message) {
  statusEl.innerHTML = `<p class="error">Error: ${message}</p>`;
}