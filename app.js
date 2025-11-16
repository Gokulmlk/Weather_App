// Weatherly — Modern Weather App
const apiKey = "92c1ebbc641f776c1c462befc142ca43"; // <-- REPLACE with your OpenWeatherMap API key (keep quotes)

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentBtn = document.getElementById('currentBtn');
const suggestionsEl = document.getElementById('suggestions');
const recentSelect = document.getElementById('recentSelect');
const errorBox = document.getElementById('errorBox');
const loadingBox = document.getElementById('loadingBox');
const todayBox = document.getElementById('todayWeather');
const forecastBox = document.getElementById('forecast');
const cityTitle = document.getElementById('cityTitle');
const descTitle = document.getElementById('descTitle');
const tempToday = document.getElementById('tempToday');
const tempUnit = document.getElementById('tempUnit');
const toggleBtn = document.getElementById('toggleBtn');
const detailHumidity = document.getElementById('detailHumidity');
const detailWind = document.getElementById('detailWind');
const detailPressure = document.getElementById('detailPressure');
const detailClouds = document.getElementById('detailClouds');
const themeBody = document.getElementById('themeBody');

let currentUnit = 'C'; // C or F
let lastBaseTemp = null;

// Sample suggestion list (you can extend)
const cityList = ["Hyderabad","Delhi","Mumbai","Chennai","Bangalore","Kolkata","Pune","Lucknow","Jaipur","London","New York","Tokyo","Paris"];

// Helper: show/hide loading
function setLoading(on){
  loadingBox.classList.toggle('hidden', !on);
}

// Recent searches
function saveRecent(city) {
  let list = JSON.parse(localStorage.getItem("recent")) || [];
  city = city.trim();

  if (city && !list.includes(city)) {
    list.unshift(city);
    list = list.slice(0, 6); // keep max 6
    localStorage.setItem("recent", JSON.stringify(list));
  }

  renderRecent();
}

function renderRecent() {
  const list = JSON.parse(localStorage.getItem("recent")) || [];

  recentSelect.innerHTML = `<option value="">-- pick recent --</option>`;

  list.forEach(city => {
    recentSelect.innerHTML += `<option value="${city}">${city}</option>`;
  });
}

// Suggestions UI
cityInput.addEventListener('input', ()=>{
  const q = cityInput.value.trim().toLowerCase();
  if(!q){ suggestionsEl.classList.add('hidden'); return; }
  const filtered = cityList.filter(c=>c.toLowerCase().startsWith(q));
  if(filtered.length===0){ suggestionsEl.classList.add('hidden'); return; }
  suggestionsEl.innerHTML = filtered.map(c=>`<li class="p-2 suggestion-item cursor-pointer">${c}</li>`).join('');
  suggestionsEl.classList.remove('hidden');
});
suggestionsEl.addEventListener('click', (e)=>{
  if(e.target && e.target.matches('li')){ cityInput.value = e.target.textContent; suggestionsEl.classList.add('hidden'); }
});
document.addEventListener('click', (e)=>{ if(!e.target.closest('#cityInput') && !e.target.closest('#suggestions')) suggestionsEl.classList.add('hidden'); });

// Fetch weather (5-day forecast endpoint)
async function fetchWeatherByCity(city){
  if(!city || city.trim()===''){ showError('Please enter a city.'); return; }
  showError('');
  setLoading(true);
  try{
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);
    if(!res.ok){ const txt = await res.text(); throw new Error('API error: '+res.status+' '+txt); }
    const data = await res.json();
    handleData(data);
    saveRecent(data.city.name);
  }catch(err){
    showError(err.message);
  }finally{ setLoading(false); }
}

async function fetchWeatherByCoords(lat, lon){
  setLoading(true); showError('');
  try{
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);
    if(!res.ok){ const txt = await res.text(); throw new Error('API error: '+res.status+' '+txt); }
    const data = await res.json();
    handleData(data);
    saveRecent(data.city.name);
  }catch(err){
    showError(err.message);
  }finally{ setLoading(false); }
}

function showError(msg){
  errorBox.textContent = msg || '';
}

// Handle API data and update UI
function handleData(data){
  if(!data || !data.list || !data.city){ showError('Invalid response from API'); return; }
  // Today's current: pick first item
  const now = data.list[0];
  const name = data.city.name + (data.city.country ? ', '+data.city.country : '');
  const condition = now.weather && now.weather[0] && now.weather[0].main ? now.weather[0].main : 'Clear';
  cityTitle.textContent = name;
  descTitle.textContent = condition;
  lastBaseTemp = Number(now.main.temp);
  currentUnit = 'C';
  tempToday.textContent = lastBaseTemp.toFixed(1);
  tempUnit.textContent = '°C';
  detailHumidity.textContent = now.main.humidity + '%';
  detailWind.textContent = now.wind.speed + ' m/s';
  detailPressure.textContent = now.main.pressure + ' hPa';
  detailClouds.textContent = (now.clouds && now.clouds.all) ? now.clouds.all + '%' : '--';

  // Show current compact
  todayBox.innerHTML = `
    <div class="flex items-center gap-4">
      <img class="weather-icon" src="https://openweathermap.org/img/wn/${now.weather[0].icon}@2x.png" alt="${condition}" />
      <div>
        <div class="text-lg font-semibold">${name}</div>
        <div class="text-sm text-slate-700">${condition} • ${new Date(now.dt_txt).toLocaleString()}</div>
      </div>
    </div>
    <div class="mt-3 flex items-center justify-between">
      <div class="text-4xl font-bold">${lastBaseTemp.toFixed(1)}<span class="text-xl ml-1">°C</span></div>
      <div class="text-sm text-slate-600">Humidity ${now.main.humidity}% • Wind ${now.wind.speed} m/s</div>
    </div>
  `;

  applyTheme(condition.toLowerCase());

  // Forecast cards — take next 5 days (every 8 items ≈ 24h interval)
  forecastBox.innerHTML = '';
  for(let i=0;i<5;i++){
    const idx = i*8;
    if(!data.list[idx]) continue;
    const t = data.list[idx];
    const date = new Date(t.dt_txt);
    const card = document.createElement('div');
    card.className = 'p-4 rounded-xl bg-white/60 shadow-sm card-hover animate-fadeIn';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <div class="font-semibold">${date.toLocaleDateString(undefined,{weekday:'short', month:'short', day:'numeric'})}</div>
          <div class="text-sm text-slate-600">${t.weather[0].description}</div>
        </div>
        <img class="weather-icon" src="https://openweathermap.org/img/wn/${t.weather[0].icon}@2x.png" alt="${t.weather[0].main}" />
      </div>
      <div class="mt-3 flex items-center justify-between">
        <div class="text-lg font-bold">${t.main.temp.toFixed(1)}°C</div>
        <div class="text-sm text-slate-600">Wind ${t.wind.speed} m/s</div>
      </div>
    `;
    // click to show details
    card.addEventListener('click', ()=>{
      detailHumidity.textContent = t.main.humidity + '%';
      detailWind.textContent = t.wind.speed + ' m/s';
      detailPressure.textContent = t.main.pressure + ' hPa';
      detailClouds.textContent = (t.clouds && t.clouds.all)? t.clouds.all+'%':'--';
      // highlight selected
      document.querySelectorAll('#forecast > div').forEach(d=>d.classList.remove('ring-2','ring-blue-300'));
      card.classList.add('ring-2','ring-blue-300');
    });
    forecastBox.appendChild(card);
  }
}

// Theme application based on condition
function applyTheme(condition){
  const c = condition.toLowerCase();
  if(c.includes('rain') || c.includes('drizzle') || c.includes('thunder')){
    themeBody.style.background = 'linear-gradient(to bottom, #0f172a, #1e293b)'; // dark rainy
  } else if(c.includes('cloud') || c.includes('overcast')){
    themeBody.style.background = 'linear-gradient(to bottom, #cbd5e1, #64748b)'; // cloudy
  } else if(c.includes('clear') || c.includes('sun') || c.includes('sunny')){
    themeBody.style.background = 'linear-gradient(to bottom, #fef3c7, #fb923c)'; // sunny
  } else if(c.includes('snow') || c.includes('sleet')){
    themeBody.style.background = 'linear-gradient(to bottom, #e6f0ff, #bcd4ff)'; // cold
  } else {
    themeBody.style.background = 'linear-gradient(to bottom, #a7f3d0, #6ee7b7)'; // default
  }
}

// Toggle unit
toggleBtn.addEventListener('click', ()=>{
  if(lastBaseTemp===null) return;
  if(currentUnit === 'C'){
    // convert to F
    const f = (lastBaseTemp*9/5)+32;
    tempToday.textContent = f.toFixed(1);
    tempUnit.textContent = '°F';
    currentUnit = 'F';
  } else {
    tempToday.textContent = lastBaseTemp.toFixed(1);
    tempUnit.textContent = '°C';
    currentUnit = 'C';
  }
});

// Event listeners
searchBtn.addEventListener('click', ()=> fetchWeatherByCity(cityInput.value.trim()));
cityInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ fetchWeatherByCity(cityInput.value.trim()); }});
recentSelect.addEventListener('change', ()=>{ if(recentSelect.value) fetchWeatherByCity(recentSelect.value); });

// Geolocation
currentBtn.addEventListener('click', ()=>{
  if(!navigator.geolocation){ showError('Geolocation not supported'); return; }
  navigator.geolocation.getCurrentPosition((pos)=>{
    fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
  }, (err)=>{ showError('Location denied or unavailable'); });
});

// Init
renderRecent();
showError('');
setLoading(false);
