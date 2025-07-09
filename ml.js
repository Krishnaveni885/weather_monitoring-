// --- Configuration ---
const THINKSPEAK_CHANNEL_ID = '3002884';
const THINKSPEAK_API_KEY = 'JO37O5KAOZEFN3GU';

// --- Utility: Show specific page ---
function showPage(pageId, event) {
  if (event) event.preventDefault();

  document.querySelectorAll('.container').forEach(div => div.classList.remove('active'));
  document.querySelectorAll('#navbar a').forEach(a => a.classList.remove('active'));

  const targetPage = document.getElementById(`${pageId}-page`);
  if (targetPage) targetPage.classList.add('active');

  const navLink = event.target;
  if (navLink) navLink.classList.add('active');

  if (pageId === 'home') fetchAndDisplaySensorData();
  if (pageId === 'live_updates' || pageId === 'graph') fetchAndDisplayRainPrediction();
}

// --- Fetch Sensor Data ---
async function fetchAndDisplaySensorData() {
  try {
    const res = await fetch(`https://api.thingspeak.com/channels/${THINKSPEAK_CHANNEL_ID}/feeds/last.json?api_key=${THINKSPEAK_API_KEY}`);
    const data = await res.json();

    const fieldMap = {
      'temp_dht11': 'field1',
      'humidity_dht11': 'field2',
      'pressure_bmp280': 'field3',
      'temp_bmp280': 'field4',
      'fog_sensor': 'field5',
      'rain_sensor': 'field6'
    };

    for (const [id, field] of Object.entries(fieldMap)) {
      const element = document.getElementById(id);
      if (element) element.textContent = data[field] || '--';
    }
  } catch (err) {
    console.error("Sensor Fetch Error:", err);
  }
}

// --- Fetch Rain Prediction ---
async function fetchAndDisplayRainPrediction() {
  try {
    const res = await fetch(`https://api.thingspeak.com/channels/${THINKSPEAK_CHANNEL_ID}/fields/6/last.json?api_key=${THINKSPEAK_API_KEY}`);
    const data = await res.json();

    const value = data?.field6;
    const predictionText =
      value === '0' ? "🌧 Rain Detected!" :
      value === '1' ? "☀ No Rain." :
      !value ? "⚠ No recent data." :
      `Reading: ${value}`;

    const el = document.getElementById("current_rain_prediction");
    if (el) el.textContent = predictionText;

  } catch (err) {
    console.error("Rain Prediction Fetch Error:", err);
    const el = document.getElementById("current_rain_prediction");
    if (el) el.textContent = "⚠ Error fetching rain prediction.";
  }
}

// --- Handle ML Prediction Form ---
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("rain-form");

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const pressure = parseFloat(document.getElementById("input-pressure").value);
      const mintemp = parseFloat(document.getElementById("input-mintemp").value);
      const maxtemp = parseFloat(document.getElementById("input-maxtemp").value);
      const dewpoint = parseFloat(document.getElementById("input-dewpoint").value);
      const humidity = parseFloat(document.getElementById("input-humidity").value);

      const inputData = { pressure, mintemp, maxtemp, dewpoint, humidity };

      try {
        const response = await fetch('/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inputData)
        });

        const data = await response.json();
        const resultBox = document.getElementById("manual-prediction-result");

        if (data.prediction) {
          resultBox.innerHTML = `
            <strong>Prediction:</strong> ${data.prediction}<br>
            <strong>Probability of Rainfall:</strong> ${(data.probability * 100).toFixed(1)}%
          `;
        } else {
          resultBox.textContent = "Error: " + (data.error || "Unknown");
        }
      } catch (error) {
        console.error("Prediction fetch error:", error);
        const resultBox = document.getElementById("manual-prediction-result");
        if (resultBox) resultBox.textContent = "Error: Could not reach the server.";
      }
    });
  }
});

// --- Initial Load ---
window.onload = () => {
  showPage('home');
  fetchAndDisplaySensorData();
  fetchAndDisplayRainPrediction();
  setInterval(fetchAndDisplaySensorData, 30000);
  setInterval(fetchAndDisplayRainPrediction, 30000);
};

// --- Auto Predict using ThingSpeak ---
document.getElementById("auto-predict-btn")?.addEventListener("click", async () => {
  try {
    const res = await fetch(`https://api.thingspeak.com/channels/${THINKSPEAK_CHANNEL_ID}/feeds/last.json?api_key=${THINKSPEAK_API_KEY}`);
    const data = await res.json();

    const inputData = {
      pressure: parseFloat(data.field3),
      mintemp: parseFloat(data.field1),   // Assuming min temp = field1
      maxtemp: parseFloat(data.field4),   // Assuming max temp = field4
      dewpoint: parseFloat(data.field5),  // Assuming dew point = field5
      humidity: parseFloat(data.field2)
    };

    const response = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputData)
    });

    const result = await response.json();
    const resultBox = document.getElementById("manual-prediction-result");

    if (result.prediction) {
      resultBox.innerHTML = `
        <strong>Prediction:</strong> ${result.prediction}<br>
        <strong>Probability of Rainfall:</strong> ${(result.probability * 100).toFixed(1)}%
      `;
    } else {
      resultBox.textContent = "Error: " + (result.error || "Unknown");
    }
  } catch (error) {
    console.error("Auto Predict Error:", error);
    document.getElementById("manual-prediction-result").textContent = "Error: Failed to fetch ThingSpeak data or prediction.";
  }
});
