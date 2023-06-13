// Constants
const APIkey = "edc0f6013ed1e9ab758f0f87c53aa082";
const APIurl =
  "https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={APIkey}";
const lat = "lat";
const lon = "lon";

// Variables for DOM elements
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const clearBtn = document.getElementById("clear-btn");
const recentSearch = document.getElementById("recent-search");
const currentWeather = document.getElementById("current-weather");
const currentTemp = document.getElementById("current-temp");
const currentWind = document.getElementById("current-wind");
const currentHumidity = document.getElementById("current-humidity");
const timeDisplayEl = document.getElementById("time-display");
const recentSearchContainer = document.getElementById("history-container");
const resultsContainer = document.getElementById("results");
const searchWrappr = document.getElementById("wrappr");

// Function to display the current date and time
function displayDateTime() {
  const now = dayjs().format("MMM DD, YYYY [at] hh:mm:ss A");
  timeDisplayEl.textContent = now;
}

// Display the initial date and time
displayDateTime();

// Update the date and time every second
setInterval(displayDateTime, 1000);

// Local storage
let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];

// Functions

// Function to display recent searches
function displayRecentSearches() {
  recentSearch.innerHTML = "";
  recentSearches.forEach((search) => {
    const listItem = document.createElement("li");
    listItem.textContent = search;
    recentSearch.appendChild(listItem);
  });
}

// Function to handle search
function handleSearch() {
  const searchValue = searchInput.value.trim();
  if (searchValue !== "") {
    getCityCoordinates(searchValue);
  } else {
    displayErrorMessage("Please enter a valid city name");
  }
  searchInput.value = "";
}

// Function to display error message
function displayErrorMessage(message) {
  const errorContainer = document.getElementById("error-container");
  errorContainer.textContent = message;
}

// Autocomplete functionality
function enableAutocomplete() {
  $("#search-input").autocomplete({
    source: function (request, response) {
      $.ajax({
        url: `https://api.openweathermap.org/geo/1.0/direct?q=${request.term}&limit=5&appid=${APIkey}`,
        method: "GET",
        success: function (data) {
          // Filter the suggestions to include only cities and states in the USA
          const suggestions = data
            .filter(
              (item) =>
                item.country === "US" &&
                item.state &&
                item.name
                  .toLowerCase()
                  .startsWith(request.term.toLowerCase().slice(0, 2))
            )
            .map((item) => `${item.name}, ${item.state}`);
          response(suggestions);
        },
      });
    },
    minLength: 2, // Minimum number of characters before autocomplete suggestions start appearing

    select: function (event, ui) {
      // Handle the selection of an autocomplete suggestion
      const selectedCity = ui.item.value;
      getCityCoordinates(selectedCity);
    },
  });
}

// Call the enableAutocomplete function to initialize autocomplete on the search input

enableAutocomplete();

// Function to fetch city coordinates
function getCityCoordinates(city) {
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${APIkey}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Weather data not found");
      }
      return response.json();
    })
    .then((data) => {
      if (data.coord) {
        const { lat, lon } = data.coord;
        getWeatherData(lat, lon, city);
        displayErrorMessage(""); // Clear the error message container
      } else {
        throw new Error("Coordinates not found in response");
      }
    })
    .catch((error) => {
      displayErrorMessage(error.message);
      console.log(error);
    });
}

// Function to fetch weather data
function getWeatherData(lat, lon, city) {
  fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${APIkey}`
  )
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      // Update current weather information on the UI
      currentWeather.textContent = city;
      const temperatureKelvin = data.list[0].main.temp;
      const temperatureFahrenheit = kelvinToFahrenheit(temperatureKelvin);
      currentTemp.textContent = `Temperature: ${Math.round(
        temperatureFahrenheit
      )}°F`;
      currentWind.textContent = `Wind: ${Math.round(
        data.list[0].wind.speed
      )} mph`;
      currentHumidity.textContent = `Humidity: ${Math.round(
        data.list[0].main.humidity
      )}%`;

      const weatherIcon = data.list[0].weather[0].icon;
      const weatherIconUrl = `https://openweathermap.org/img/w/${weatherIcon}.png`;
      const weatherIconAlt = data.list[0].weather[0].description;
      const currentWeatherIcon = document.getElementById(
        "current-weather-icon"
      );
      currentWeatherIcon.src = weatherIconUrl;
      currentWeatherIcon.alt = weatherIconAlt;

      // Update the 5-day forecast
      const forecastContainer = document.querySelector(".forecast-container");
      forecastContainer.innerHTML = ""; // Clear previous forecast data

      for (let i = 0; i < 5; i++) {
        const forecast = data.list[i];
        const date = forecast.dt_txt.split(" ")[0];
        const iconCode = forecast.weather[0].icon;
        const tempKelvin = forecast.main.temp;
        const tempFahrenheit = kelvinToFahrenheit(tempKelvin);
        const wind = Math.round(forecast.wind.speed);
        const humidity = Math.round(forecast.main.humidity);

        const cardDay = document.createElement("div");
        cardDay.classList.add("card-day");

        const dateElement = document.createElement("h3");
        dateElement.textContent = `Day ${i + 1}`;
        cardDay.appendChild(dateElement);

        const iconElement = document.createElement("img");
        iconElement.src = `https://openweathermap.org/img/wn/${iconCode}.png`;
        cardDay.appendChild(iconElement);

        const tempElement = document.createElement("p");
        tempElement.textContent = `Temperature: ${Math.round(
          tempFahrenheit
        )}°F`;
        cardDay.appendChild(tempElement);

        const windElement = document.createElement("p");
        windElement.textContent = `Wind: ${wind} mph`;
        cardDay.appendChild(windElement);

        const humidityElement = document.createElement("p");
        humidityElement.textContent = `Humidity: ${humidity}%`;
        cardDay.appendChild(humidityElement);

        forecastContainer.appendChild(cardDay);
      }

      // Update recent searches
      if (!recentSearches.includes(city)) {
        recentSearches.push(city);
        localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
        displayRecentSearches();
      }
    })
    .catch((error) => {
      displayErrorMessage(error.message);
      console.log(error);
    });
}

// Function to convert temperature from Kelvin to Fahrenheit
function kelvinToFahrenheit(temperatureKelvin) {
  return ((temperatureKelvin - 273.15) * 9) / 5 + 32;
}

// Function to clear the search history
function clearSearchHistory() {
  recentSearches = [];
  localStorage.removeItem("recentSearches");
  displayRecentSearches();

  // Clear current weather data
  currentWeather.textContent = "";
  currentTemp.textContent = "";
  currentWind.textContent = "";
  currentHumidity.textContent = "";
  const currentWeatherIcon = document.getElementById("current-weather-icon");
  currentWeatherIcon.src = "";
  currentWeatherIcon.alt = "";

  // Clear 5-day forecast
  const forecastContainer = document.querySelector(".forecast-container");
  forecastContainer.innerHTML = "";
}

// Event listener for clear button click
clearBtn.addEventListener("click", clearSearchHistory);

// Event listener for search button click
searchBtn.addEventListener("click", handleSearch);

// Display recent searches on page load
displayRecentSearches();
