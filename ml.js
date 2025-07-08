// --- Configuration ---
    const THINKSPEAK_CHANNEL_ID = '3002884'; // Your ThingSpeak Channel ID
    const THINKSPEAK_API_KEY = 'JO37O5KAOZEFN3GU'; // Optional: if your channel is private, you need a Read API Key

    // --- Page Management (JavaScript for dynamic content and navigation) ---
    const pageContainers = document.querySelectorAll('.container');
    const navLinks = document.querySelectorAll('#navbar a');

    function showPage(pageId) {
      // Hide all pages
      pageContainers.forEach(container => container.classList.remove('active'));
      // Deactivate all nav links
      navLinks.forEach(link => link.classList.remove('active'));

      // Show the selected page
      const selectedPage = document.getElementById(pageId + '-page');
      if (selectedPage) {
        selectedPage.classList.add('active');
        // Activate the corresponding nav link
        document.querySelector(`#navbar a[onclick="showPage('${pageId}')"]`).classList.add('active');
      }

      // Special actions for specific pages
      if (pageId === 'home') {
        fetchAndDisplaySensorData(); // Refresh data when going to homepage
      } else if (pageId === 'rain') {
        fetchAndDisplayRainPrediction(); // Refresh rain prediction
      }
    }

    // --- ThingSpeak Data Fetching Functions ---

    // Fetches the latest sensor data for the Home page
    async function fetchAndDisplaySensorData() {
      try {
        // Construct the URL to get the last feed entry
        const url = `https://api.thingspeak.com/channels/${THINKSPEAK_CHANNEL_ID}/feeds/last.json?api_key=${THINKSPEAK_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        // Check if data is valid and update the table
        if (data) {
          document.getElementById('temp_dht11').textContent = data.field1 || '--';
          document.getElementById('humidity_dht11').textContent = data.field2 || '--';
          document.getElementById('pressure_bmp280').textContent = data.field3 || '--';
          document.getElementById('temp_bmp280').textContent = data.field4 || '--';
          document.getElementById('fog_sensor').textContent = data.field5 || '--';
          document.getElementById('rain_sensor').textContent = data.field6 || '--';
        } else {
          console.error('No data received from ThingSpeak.');
          updateTableWithError();
        }
      } catch (error) {
        console.error('Error fetching data from ThingSpeak:', error);
        updateTableWithError();
      }
    }

    // Helper to show error in table cells
    function updateTableWithError() {
      document.getElementById('temp_dht11').textContent = 'Error';
      document.getElementById('humidity_dht11').textContent = 'Error';
      document.getElementById('pressure_bmp280').textContent = 'Error';
      document.getElementById('temp_bmp280').textContent = 'Error';
      document.getElementById('fog_sensor').textContent = 'Error';
      document.getElementById('rain_sensor').textContent = 'Error';
    }

    // Fetches the latest rain sensor value for the Rain Prediction page
    async function fetchAndDisplayRainPrediction() {
        try {
            // Fetch only field 6 (Rain Sensor)
            const url = `https://api.thingspeak.com/channels/${THINKSPEAK_CHANNEL_ID}/fields/6/last.json?api_key=${THINKSPEAK_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json(); // Data will be like: {"field6":"0"}

            const rainSensorValue = data.field6; // Get the raw value (e.g., "0" or "1")
            let predictionText = "Unknown";

            // Assuming 0 means rain and 1 means dry as per your previous code comments
            if (rainSensorValue === '0') {
                predictionText = "Rain Detected!";
            } else if (rainSensorValue === '1') {
                predictionText = "No Rain.";
            } else {
                predictionText = "No recent data / Sensor reading: " + (rainSensorValue || '--');
            }

            document.getElementById('current_rain_prediction').textContent = predictionText;

        } catch (error) {
            console.error('Error fetching rain prediction data:', error);
            document.getElementById('current_rain_prediction').textContent = 'Error fetching data.';
        }
    }

    // --- Initial Load ---
    // Show the homepage and fetch data when the page loads
    window.onload = () => {
      showPage('home');
      // Set an interval to refresh data every 30 seconds (adjust as needed)
      setInterval(fetchAndDisplaySensorData, 30000);
      setInterval(fetchAndDisplayRainPrediction, 30000); // Also refresh rain prediction periodically
    };