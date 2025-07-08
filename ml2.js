async function fetchAndDisplayRainPrediction() {
  try {
    const inputData = {
      pressure: 1008,
      maxtemp: 38,
      temparature: 34,
      mintemp: 30,
      humidity: 85
    };

    const response = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputData)
    });

    const data = await response.json();
    document.getElementById('current_rain_prediction').textContent = data.prediction || "Error: " + data.error;
  } catch (error) {
    console.error('Error fetching ML prediction:', error);
    document.getElementById('current_rain_prediction').textContent = 'Prediction error';
  }
}