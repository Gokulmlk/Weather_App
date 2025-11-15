# Weatherly — Modern Weather App (Project)

This is a modern, animated weather forecast UI built with Tailwind CSS and Vanilla JavaScript.
It uses OpenWeatherMap's 5-day forecast API.

## Features
- Beautiful dynamic background themes based on weather condition
- Animated forecast & current weather cards
- Search suggestions (static sample list)
- Recent searches saved to localStorage
- Temperature unit toggle (°C/°F)
- Click a forecast card to populate detailed metrics
- Graceful error handling and loading indicator

## Setup
1. Unzip the project.
2. Replace the API key in `app.js`:
   ```js
   const apiKey = "YOUR_API_KEY";
   ```
   with your OpenWeatherMap API key (keep the quotes).
3. Run a local HTTP server (don't open via file://):
   - Python:
     ```
     python -m http.server 8000
     ```
     then open http://localhost:8000
   - Or use VS Code Live Server.

## Notes
- Autocomplete suggestions are a static list included for demo; to use real autocomplete consider using a geocoding/autocomplete API (e.g., Mapbox, Geoapify, Google Places).
- API keys may take ~10 minutes after creation to become active.

