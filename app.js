

const apiKey = "92c1ebbc641f776c1c462befc142ca43"; //  Your original API key variable */

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const currentBtn = document.getElementById("currentBtn");
const suggestionsEl = document.getElementById("suggestions");
const recentSelect = document.getElementById("recentSelect");
const recentContainer = document.getElementById("recentContainer");
const errorBox = document.getElementById("errorBox");
const alertBox = document.getElementById("alertBox");
const loadingBox = document.getElementById("loadingBox");
const todayBox = document.getElementById("todayWeather");
const forecastBox = document.getElementById("forecast");
const cityTitle = document.getElementById("cityTitle");
const descTitle = document.getElementById("descTitle");
const tempToday = document.getElementById("tempToday");
const tempUnit = document.getElementById("tempUnit");
const toggleBtn = document.getElementById("toggleBtn");
const detailHumidity = document.getElementById("detailHumidity");
const detailWind = document.getElementById("detailWind");
const detailPressure = document.getElementById("detailPressure");
const detailClouds = document.getElementById("detailClouds");
const themeBody = document.getElementById("themeBody");

let currentUnit = "C"; 
let lastBaseTemp = null; 



/* Starting suggestion list */
const cityList = [
  "Hyderabad",
  "Mumbai",
  "Delhi",
  "Chennai",
  "Bangalore",
  "Kolkata",
  "Pune"
];

/* Cleaner input listener + validation + suggestions */
cityInput.addEventListener("input", () => {
  const q = cityInput.value.trim().toLowerCase();
  if (!q) {
    suggestionsEl.classList.add("hidden");
    return;
  }

  const filtered = cityList.filter(c => c.toLowerCase().startsWith(q));

  if (filtered.length === 0) {
    suggestionsEl.classList.add("hidden");
    return;
  }

  suggestionsEl.innerHTML = filtered
    .map(c => `<li class="p-2 suggestion-item cursor-pointer">${c}</li>`)
    .join("");

  suggestionsEl.classList.remove("hidden");
});

/* Click to select suggestion */
suggestionsEl.addEventListener("click", (e) => {
  if (e.target.matches("li")) {
    cityInput.value = e.target.textContent;
    suggestionsEl.classList.add("hidden");
  }
});

/* Hide dropdown when clicking outside */
document.addEventListener("click", (e) => {
  if (!e.target.closest("#cityInput") && !e.target.closest("#suggestions")) {
    suggestionsEl.classList.add("hidden");
  }
});

/* ===================================================== */
/* LOADING + ERROR SECTION */
/* ===================================================== */

function setLoading(on) {
  /* SAME: previously toggled loading message */
  loadingBox.classList.toggle("hidden", !on);
}

/* CHANGED: improved error display */
function showError(msg) {
  errorBox.textContent = msg || "";
}

/* NEW: custom alert for extreme heat */
function showAlert(msg) {
  if (!msg) {
    alertBox.classList.add("hidden");
    alertBox.textContent = "";
    return;
  }
  alertBox.textContent = msg;
  alertBox.classList.remove("hidden");
}

/* ===================================================== */
/* RECENT SEARCHES SECTION */
/* ===================================================== */

function saveRecent(city) {
  try {
    let list = JSON.parse(localStorage.getItem("recent")) || [];
    city = city.trim();

    if (city && !list.includes(city)) {
      list.unshift(city);
      list = list.slice(0, 6); // max 6 items
      localStorage.setItem("recent", JSON.stringify(list));
    }

    renderRecent();
  } catch (err) {}
}

/* dropdown hidden until searches exist */
function renderRecent() {
  const list = JSON.parse(localStorage.getItem("recent")) || [];

  if (list.length === 0) {
    recentContainer.classList.add("hidden");
    recentSelect.innerHTML = `<option value="">-- pick recent --</option>`;
    return;
  }

  recentContainer.classList.remove("hidden");
  recentSelect.innerHTML = `<option value="">-- pick recent --</option>`;

  list.forEach(city => {
    recentSelect.innerHTML += `<option value="${city}">${city}</option>`;
  });
}


/* ===================================================== */
/* FETCH SECTION (CITY + GEO) */
/* ===================================================== */

/* UPDATED: input validation + better error handling */
async function fetchWeatherByCity(city) {
  if (!city || city.trim() === "") {
    showError("Please enter a valid city.");
    return;
  }

  showError("");
  showAlert("");
  setLoading(true);

  try {
    const url =
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("City not found. Please try again.");
    }

    const data = await res.json();
    handleData(data);
    saveRecent(data.city.name);

  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

/* SAME logic but for geolocation */
async function fetchWeatherByCoords(lat, lon) {
  showError("");
  showAlert("");
  setLoading(true);

  try {
    const url =
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not fetch location weather.");

    const data = await res.json();
    handleData(data);
    saveRecent(data.city.name);

  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

/* ===================================================== */
/* MAIN DATA HANDLER SECTION */
/* ===================================================== */

function handleData(data) {
  if (!data || !data.list) {
    showError("Invalid data from API");
    return;
  }

  /* SAME logic: first item = current weather */
  const now = data.list[0];

  const name = data.city.name + (data.city.country ? ", " + data.city.country : "");
  const condition = now.weather?.[0]?.main || "Clear";

  /* NEW: update UI header */
  cityTitle.textContent = name;
  descTitle.textContent = condition;

  /* CHANGED: store Celsius base temp */
  lastBaseTemp = Number(now.main.temp);
  currentUnit = "C";
  tempToday.textContent = lastBaseTemp.toFixed(1);
  tempUnit.textContent = "°C";

  /* SAME: fill details */
  detailHumidity.textContent = now.main.humidity + "%";
  detailWind.textContent = now.wind.speed + " m/s";
  detailPressure.textContent = now.main.pressure + " hPa";
  detailClouds.textContent = now.clouds.all + "%";

  /* ===================================================== */
  /* EXTREME HEAT ALERT */
  /* ===================================================== */
  if (lastBaseTemp > 40) {
    showAlert("⚠️ Extreme Heat Alert! Stay hydrated.");
  } else {
    showAlert("");
  }

  /* ===================================================== */
  /* CURRENT WEATHER CARD SECTION */
  /* ===================================================== */
  todayBox.innerHTML = `
    <div class="flex items-center gap-4">
      <img class="weather-icon icon-pop" 
           src="https://openweathermap.org/img/wn/${now.weather[0].icon}@2x.png" />
      <div>
        <div class="text-lg font-semibold">${name}</div>
        <div class="text-sm text-slate-700">${condition} • ${new Date(now.dt_txt).toLocaleString()}</div>
      </div>
    </div>

    <div class="mt-3 flex items-center justify-between">
      <div class="text-4xl font-bold">
        ${lastBaseTemp.toFixed(1)}<span class="text-xl ml-1">°C</span>
      </div>
      <div class="text-sm text-slate-600">
        Humidity ${now.main.humidity}% • Wind ${now.wind.speed} m/s
      </div>
    </div>
  `;

  

  applyTheme(condition.toLowerCase());

  /* ===================================================== */
  /* FORECAST CARDS SECTION */
  /* ===================================================== */

  forecastBox.innerHTML = ""; 

  for (let i = 0; i < 5; i++) {
    const idx = i * 8;
    const t = data.list[idx];
    if (!t) continue;

    const date = new Date(t.dt_txt);

    const card = document.createElement("div");
    card.className = "p-4 rounded-xl bg-white/60 shadow-sm card-hover animate-fadeIn";

    /* UPDATED: added humidity + icons */
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <div class="font-semibold">${date.toLocaleDateString(undefined,{weekday:'short', month:'short', day:'numeric'})}</div>
          <div class="text-sm text-slate-600">${t.weather[0].description}</div>
        </div>
        <img class="weather-icon"
             src="https://openweathermap.org/img/wn/${t.weather[0].icon}@2x.png" />
      </div>

      <div class="mt-3 text-sm">
        <div>🌡️ Temp: <b>${t.main.temp.toFixed(1)}°C</b></div>
        <div>💨 Wind: ${t.wind.speed} m/s</div>
        <div>💧 Humidity: ${t.main.humidity}%</div>
      </div>
    `;

    /* NEW: click card to update details box */
    card.addEventListener("click", () => {
      detailHumidity.textContent = t.main.humidity + "%";
      detailWind.textContent = t.wind.speed + " m/s";
      detailPressure.textContent = t.main.pressure + " hPa";
      detailClouds.textContent = t.clouds.all + "%";

      document.querySelectorAll("#forecast > div")
        .forEach(d => d.classList.remove("ring-2", "ring-blue-300"));

      card.classList.add("ring-2", "ring-blue-300");
    });

    forecastBox.appendChild(card);
  }
}

/* ===================================================== */
/* THEME SECTION */
/* ===================================================== */

function applyTheme(condition) {
  const c = condition.toLowerCase();

  /* UPDATED: added smoother gradients */
  if (c.includes("rain") || c.includes("drizzle")) {
    themeBody.style.background =
      "linear-gradient(to bottom, #0f172a, #1e293b)";
  } else if (c.includes("cloud")) {
    themeBody.style.background =
      "linear-gradient(to bottom, #cbd5e1, #64748b)";
  } else if (c.includes("clear") || c.includes("sun")) {
    themeBody.style.background =
      "linear-gradient(to bottom, #fef3c7, #fb923c)";
  } else if (c.includes("snow")) {
    themeBody.style.background =
      "linear-gradient(to bottom, #e6f0ff, #bcd4ff)";
  } else {
    themeBody.style.background =
      "linear-gradient(to bottom, #a7f3d0, #6ee7b7)";
  }
}

/* ===================================================== */
/* TEMP TOGGLE SECTION */
/* ===================================================== */

toggleBtn.addEventListener("click", () => {
  if (lastBaseTemp === null) return;

  if (currentUnit === "C") {
    const f = (lastBaseTemp * 9) / 5 + 32;
    tempToday.textContent = f.toFixed(1);
    tempUnit.textContent = "°F";
    currentUnit = "F";
  } else {
    tempToday.textContent = lastBaseTemp.toFixed(1);
    tempUnit.textContent = "°C";
    currentUnit = "C";
  }
});

/* ===================================================== */
/* EVENT LISTENERS SECTION */
/* ===================================================== */

searchBtn.addEventListener("click", () =>
  fetchWeatherByCity(cityInput.value.trim())
);

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    fetchWeatherByCity(cityInput.value.trim());
  }
});

/* UPDATED: only run if selecting a value */
recentSelect.addEventListener("change", () => {
  if (recentSelect.value) {
    fetchWeatherByCity(recentSelect.value);
  }
});

/* SAME: geolocation */
currentBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    () => {
      showError("Location denied by user");
    }
  );
});

/* ===================================================== */
/* INIT SECTION */
/* ===================================================== */

renderRecent();
showError("");
showAlert("");
setLoading(false);
