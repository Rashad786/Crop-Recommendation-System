async function recommendCrop() {
  // Collect input values from form fields
  const N = parseFloat(document.getElementById("N").value);
  const P = parseFloat(document.getElementById("P").value);
  const K = parseFloat(document.getElementById("K").value);
  const temperature = parseFloat(document.getElementById("temperature").value);
  const humidity = parseFloat(document.getElementById("humidity").value);
  const ph = parseFloat(document.getElementById("ph").value);
  const rainfall = parseFloat(document.getElementById("rainfall").value);
  const top_n = 5; // Can be made configurable

  const inputData = { N, P, K, temperature, humidity, ph, rainfall, top_n };

  try {
    // Call backend API
    const response = await fetch("http://localhost:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputData),
    });

    if (!response.ok) {
      throw new Error("Prediction request failed: " + response.statusText);
    }

    const data = await response.json();

    // Build HTML for top crops list
    const topnHtml = data.topn
      .map(
        (c) =>
          `<li>${c.crop} - ${(c.score * 100).toFixed(2)}%</li>`
      )
      .join("");

    // Show results with recommended crop, confidence, top crops, and image
    document.getElementById("result").innerHTML = `
      <h3>Recommended Crop: <span style="color:green">${data.best_crop}</span></h3>
      <p>Confidence: ${(data.confidence * 100).toFixed(2)}%</p>
      <h4>Top ${inputData.top_n} Crops:</h4>
      <ul>${topnHtml}</ul>
      <img id="crop-img" src="assets/${data.best_crop.toLowerCase()}.png" alt="${data.best_crop}" style="max-width:300px; margin-top:15px;" />
    `;

    document.getElementById('crop-img').onclick = function() {
      window.open('https://en.wikipedia.org/wiki/' + encodeURIComponent(data.best_crop), '_blank');
    };
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("result").innerHTML = `
      <p style="color:red;">Error: ${error.message}</p>
    `;
  }
}
