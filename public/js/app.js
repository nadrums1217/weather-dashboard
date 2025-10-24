class WeatherDashboard {
    constructor() {
        this.oneontaForecast = null;
        this.oneontaHistorical = null;
        this.oneontaYearly = null;
        this.greenvilleForecast = null;
        this.greenvilleHistorical = null;
        this.greenvilleYearly = null;
        this.charts = {};
        this.weatherIcons = {
            0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
            51: '🌧️', 53: '🌧️', 55: '🌧️', 61: '🌧️', 63: '⛈️', 65: '⛈️',
            71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️', 80: '🌧️', 81: '⛈️',
            82: '⛈️', 85: '❄️', 86: '❄️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
        };
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.displayCurrentWeather();
            this.displayHistoricalCharts();
            this.displayMonthlyAverageTemperatureChart();
            this.displayComparisonCharts();
            this.updateLastUpdated();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showError('Failed to load weather data. Please refresh the page.');
        }
    }

    async loadData() {
        try {
            const [oneontaForecast, oneontaHistorical, oneontaYearly, greenvilleForecast, greenvilleHistorical, greenvilleYearly] = await Promise.all([
                fetch('./oneonta_forecast.json').then(r => r.json()),
                fetch('./oneonta_historical.json').then(r => r.json()),
                fetch('./oneonta_yearly_daily.json').then(r => r.json()),
                fetch('./greenville_forecast.json').then(r => r.json()).catch(e => { console.warn("Greenville Forecast data failed to load:", e); return null; }),
                fetch('./greenville_historical.json').then(r => r.json()).catch(e => { console.warn("Greenville Historical data failed to load:", e); return null; }),
                fetch('./greenville_yearly_daily.json').then(r => r.json()).catch(e => { console.warn("Greenville Yearly data failed to load:", e); return null; })
            ]);

            this.oneontaForecast = oneontaForecast;
            this.oneontaHistorical = oneontaHistorical;
            this.oneontaYearly = oneontaYearly;
            this.greenvilleForecast = greenvilleForecast;
            this.greenvilleHistorical = greenvilleHistorical;
            this.greenvilleYearly = greenvilleYearly;

            console.log('Data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    setupEventListeners() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.getElementById(tabName).classList.add('active');
        event.target.classList.add('active');

        if (tabName === 'historical' || tabName === 'comparison') {
            setTimeout(() => {
                Object.values(this.charts).forEach(chart => {
                    if (chart) chart.resize();
                });
            }, 100);
        }
    }

    displayCurrentWeather() {
        const now = new Date();
        const currentHourIndex = this.findNearestHourIndex(this.oneontaForecast.hourly.time, now);

        this.displayLocationCurrent('oneonta', this.oneontaForecast, currentHourIndex);
        this.displayHourlyForecast('oneonta', this.oneontaForecast, currentHourIndex);
        this.displaySevenDayForecast('oneonta', this.oneontaForecast);

        if (this.greenvilleForecast) {
            this.displayLocationCurrent('greenville', this.greenvilleForecast, currentHourIndex);
            this.displayHourlyForecast('greenville', this.greenvilleForecast, currentHourIndex);
            this.displaySevenDayForecast('greenville', this.greenvilleForecast);
        } else {
            document.getElementById('greenville-card').innerHTML = '<div class="error-message">Greenville data not available. Please check the data source.</div>';
        }
        }

        this.displayPrecipitationComparison(currentHourIndex);
    }

    displayLocationCurrent(location, forecastData, hourIndex) {
        const hourly = forecastData.hourly;
        const daily = forecastData.daily;
        const todayIndex = daily.time.findIndex(date => date === new Date().toISOString().split('T')[0]);

        // Temperature
        document.getElementById(`${location}-current-temp`).textContent = 
            `${Math.round(hourly.temperature_2m[hourIndex])}°F`;

        // Feels Like Temperature
        const feelsLike = hourly.apparent_temperature[hourIndex];
        document.getElementById(`${location}-feels-like`).textContent = 
            `${Math.round(feelsLike)}°F`;

        // Sunrise and Sunset
        if (todayIndex >= 0) {
            const sunriseTime = new Date(daily.sunrise[todayIndex]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            const sunsetTime = new Date(daily.sunset[todayIndex]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            document.getElementById(`${location}-sunrise`).textContent = sunriseTime;
            document.getElementById(`${location}-sunset`).textContent = sunsetTime;
        }

        // Humidity
        const humidity = hourly.relative_humidity_2m[hourIndex];
        document.getElementById(`${location}-humidity`).textContent = `${humidity}%`;
        document.getElementById(`${location}-humidity-bar`).style.width = `${humidity}%`;

        // Wind Speed and Direction
        const windSpeed = hourly.wind_speed_10m[hourIndex];
        const windDirection = hourly.wind_direction_10m[hourIndex];
        document.getElementById(`${location}-wind-speed`).textContent = `${Math.round(windSpeed)} mph`;
        document.getElementById(`${location}-wind-direction`).style.transform = `rotate(${windDirection}deg)`;

        // UV Index
        const uvIndex = hourly.uv_index[hourIndex];
        document.getElementById(`${location}-uv-index`).textContent = `${Math.round(uvIndex * 10) / 10}`;
        const uvPercent = Math.min((uvIndex / 11) * 100, 100);
        document.getElementById(`${location}-uv-bar`).style.width = `${uvPercent}%`;

        // Precipitation
        document.getElementById(`${location}-current-precip`).textContent = 
            `${hourly.precipitation[hourIndex].toFixed(2)} in`;

        // Dew Point
        const dewPoint = hourly.dew_point_2m[hourIndex];
        document.getElementById(`${location}-dew-point`).textContent = 
            `${Math.round(dewPoint)}°F`;

        // Sunshine Duration
        const sunMinutes = Math.round(hourly.sunshine_duration[hourIndex] / 60);
        document.getElementById(`${location}-current-sun`).textContent = 
            `${sunMinutes} min`;

        // Weather Icon
        const weatherCode = hourly.weather_code[hourIndex];
        const icon = this.weatherIcons[weatherCode] || '🌤️';
        document.getElementById(`${location}-weather-icon`).textContent = icon;
    }

    displayHourlyForecast(location, forecastData, startIndex) {
        const hourly = forecastData.hourly;
        const container = document.getElementById(`${location}-hourly-forecast`);
        container.innerHTML = '';

        for (let i = 0; i < 24 && startIndex + i < hourly.time.length; i++) {
            const index = startIndex + i;
            const time = new Date(hourly.time[index]);
            const hour = time.getHours().toString().padStart(2, '0');
            const weatherCode = hourly.weather_code[index];
            const icon = this.weatherIcons[weatherCode] || '🌤️';

            const item = document.createElement('div');
            item.className = 'hourly-item';
            item.innerHTML = `
                <div class="time">${hour}:00</div>
                <div style="font-size: 1.2rem; margin: 5px 0;">${icon}</div>
                <div class="temp">${Math.round(hourly.temperature_2m[index])}°F</div>
                <div class="precip">${hourly.precipitation[index].toFixed(2)}in</div>
            `;
            container.appendChild(item);
        }
    }

    displaySevenDayForecast(location, forecastData) {
        const daily = forecastData.daily;
        const container = document.getElementById(`${location}-seven-day`);
        container.innerHTML = '';

        for (let i = 0; i < 7 && i < daily.time.length; i++) {
            const date = new Date(daily.time[i]);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const weatherCode = daily.weather_code[i];
            const icon = this.weatherIcons[weatherCode] || '🌤️';
            const maxTemp = Math.round(daily.temperature_2m_max[i]);
            const minTemp = Math.round(daily.temperature_2m_min[i]);
            const precip = daily.precipitation_sum[i].toFixed(2);
            const precipProb = daily.precipitation_probability_max[i];
            const uvMax = daily.uv_index_max[i];

            const day = document.createElement('div');
            day.className = 'forecast-day';
            day.innerHTML = `
                <div class="forecast-day-label">📅 ${dayName}</div>
                <div class="forecast-day-value">${maxTemp}°F / ${minTemp}°F</div>
                <div class="forecast-icon">${icon}</div>
                <div class="forecast-day-label">🌧️ Precip</div>
                <div class="forecast-day-value">${precip}in (${precipProb}%)</div>
                <div class="forecast-day-label">☀️ UV</div>
                <div class="forecast-day-value">${Math.round(uvMax * 10) / 10}</div>
            `;
            container.appendChild(day);
        }
    }

    displayPrecipitationComparison(currentHourIndex) {
        const oneontaHourly = this.oneontaForecast.hourly;
        const greenvilleHourly = this.greenvilleForecast.hourly;

        const oneontaContainer = document.getElementById('oneonta-precip-hourly');
        const greenvilleContainer = document.getElementById('greenville-precip-hourly');
        const differenceContainer = document.getElementById('precip-difference');

        oneontaContainer.innerHTML = '';
        greenvilleContainer.innerHTML = '';
        differenceContainer.innerHTML = '';

        for (let i = 0; i < 24 && currentHourIndex + i < oneontaHourly.time.length; i++) {
            const index = currentHourIndex + i;
            const time = new Date(oneontaHourly.time[index]);
            const hour = time.getHours().toString().padStart(2, '0');

            const oneontaPrecip = oneontaHourly.precipitation[index];
            const greenvillePrecip = greenvilleHourly.precipitation[index];
            const diff = oneontaPrecip - greenvillePrecip;

            const createItem = (value) => {
                const item = document.createElement('div');
                item.className = 'precip-item';
                item.innerHTML = `
                    <span class="precip-time">${hour}:00</span>
                    <span class="precip-value">${value.toFixed(2)} in</span>
                `;
                return item;
            };

            oneontaContainer.appendChild(createItem(oneontaPrecip));
            greenvilleContainer.appendChild(createItem(greenvillePrecip));
            differenceContainer.appendChild(createItem(Math.abs(diff)));
        }
    }

    displayHistoricalCharts() {
        this.createHistoricalTempChart();
        this.createHistoricalPrecipChart();
        this.createHistoricalSunChart();
        this.createHistoricalWindChart();
        this.createHistoricalHumidityChart();
        this.createHistoricalUVChart();
    }

    createHistoricalTempChart() {
        const oneontaDates = this.oneontaHistorical.hourly.time;
        const oneontaTemps = this.oneontaHistorical.hourly.temperature_2m;
        const greenvilleDates = this.greenvilleHistorical.hourly.time;
        const greenvilleTemps = this.greenvilleHistorical.hourly.temperature_2m;

        const dailyOneontaTemps = this.aggregateDailyData(oneontaDates, oneontaTemps, 'avg');
        const dailyGreenvilleTemps = this.aggregateDailyData(greenvilleDates, greenvilleTemps, 'avg');
        const dates = [...new Set([...oneontaDates, ...greenvilleDates])].filter((d, i, a) => a.indexOf(d) === i).slice(0, 30);

        const ctx = document.getElementById('historicalTempChart').getContext('2d');
        this.charts.historicalTemp = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: dailyOneontaTemps,
                        borderColor: '#00d4ff',
                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#00d4ff',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Greenville, SC',
                        data: dailyGreenvilleTemps,
                        borderColor: '#7c3aed',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#7c3aed',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#a0aec0', font: { size: 12, weight: 'bold' } }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    createHistoricalPrecipChart() {
        const oneontaDates = this.oneontaHistorical.hourly.time;
        const oneontaPrecip = this.oneontaHistorical.hourly.precipitation;
        const greenvilleDates = this.greenvilleHistorical.hourly.time;
        const greenvillePrecip = this.greenvilleHistorical.hourly.precipitation;

        const dailyOneontaPrecip = this.aggregateDailyData(oneontaDates, oneontaPrecip, 'sum');
        const dailyGreenvillePrecip = this.aggregateDailyData(greenvilleDates, greenvillePrecip, 'sum');
        const dates = [...new Set([...oneontaDates, ...greenvilleDates])].filter((d, i, a) => a.indexOf(d) === i).slice(0, 30);

        const ctx = document.getElementById('historicalPrecipChart').getContext('2d');
        this.charts.historicalPrecip = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: dailyOneontaPrecip,
                        backgroundColor: 'rgba(0, 212, 255, 0.7)',
                        borderColor: '#00d4ff',
                        borderWidth: 2
                    },
                    {
                        label: 'Greenville, SC',
                        data: dailyGreenvillePrecip,
                        backgroundColor: 'rgba(124, 58, 237, 0.7)',
                        borderColor: '#7c3aed',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#a0aec0', font: { size: 12, weight: 'bold' } }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    createHistoricalSunChart() {
        const oneontaDates = this.oneontaHistorical.hourly.time;
        const oneontaSun = this.oneontaHistorical.hourly.sunshine_duration;
        const greenvilleDates = this.greenvilleHistorical.hourly.time;
        const greenvilleSun = this.greenvilleHistorical.hourly.sunshine_duration;

        const dailyOneontaSun = this.aggregateDailyData(oneontaDates, oneontaSun, 'sum').map(v => v / 3600);
        const dailyGreenvilleSun = this.aggregateDailyData(greenvilleDates, greenvilleSun, 'sum').map(v => v / 3600);
        const dates = [...new Set([...oneontaDates, ...greenvilleDates])].filter((d, i, a) => a.indexOf(d) === i).slice(0, 30);

        const ctx = document.getElementById('historicalSunChart').getContext('2d');
        this.charts.historicalSun = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: dailyOneontaSun,
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#f97316'
                    },
                    {
                        label: 'Greenville, SC',
                        data: dailyGreenvilleSun,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#10b981'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#a0aec0', font: { size: 12, weight: 'bold' } }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    createHistoricalWindChart() {
        const oneontaDates = this.oneontaHistorical.hourly.time;
        const oneontaWind = this.oneontaHistorical.hourly.wind_speed_10m;
        const greenvilleDates = this.greenvilleHistorical.hourly.time;
        const greenvilleWind = this.greenvilleHistorical.hourly.wind_speed_10m;

        const dailyOneontaWind = this.aggregateDailyData(oneontaDates, oneontaWind, 'avg');
        const dailyGreenvilleWind = this.aggregateDailyData(greenvilleDates, greenvilleWind, 'avg');
        const dates = [...new Set([...oneontaDates, ...greenvilleDates])].filter((d, i, a) => a.indexOf(d) === i).slice(0, 30);

        const ctx = document.getElementById('historicalWindChart').getContext('2d');
        this.charts.historicalWind = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: dailyOneontaWind,
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#06b6d4'
                    },
                    {
                        label: 'Greenville, SC',
                        data: dailyGreenvilleWind,
                        borderColor: '#ec4899',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#ec4899'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#a0aec0', font: { size: 12, weight: 'bold' } }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    createHistoricalHumidityChart() {
        const oneontaDates = this.oneontaHistorical.hourly.time;
        const oneontaHumidity = this.oneontaHistorical.hourly.relative_humidity_2m;
        const greenvilleDates = this.greenvilleHistorical.hourly.time;
        const greenvilleHumidity = this.greenvilleHistorical.hourly.relative_humidity_2m;

        const dailyOneontaHumidity = this.aggregateDailyData(oneontaDates, oneontaHumidity, 'avg');
        const dailyGreenvilleHumidity = this.aggregateDailyData(greenvilleDates, greenvilleHumidity, 'avg');
        const dates = [...new Set([...oneontaDates, ...greenvilleDates])].filter((d, i, a) => a.indexOf(d) === i).slice(0, 30);

        const ctx = document.getElementById('historicalHumidityChart').getContext('2d');
        this.charts.historicalHumidity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: dailyOneontaHumidity,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#3b82f6'
                    },
                    {
                        label: 'Greenville, SC',
                        data: dailyGreenvilleHumidity,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#8b5cf6'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#a0aec0', font: { size: 12, weight: 'bold' } }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    createHistoricalUVChart() {
        const oneontaDates = this.oneontaHistorical.hourly.time;
        const oneontaUV = this.oneontaHistorical.hourly.uv_index;
        const greenvilleDates = this.greenvilleHistorical.hourly.time;
        const greenvilleUV = this.greenvilleHistorical.hourly.uv_index;

        const dailyOneontaUV = this.aggregateDailyData(oneontaDates, oneontaUV, 'max');
        const dailyGreenvilleUV = this.aggregateDailyData(greenvilleDates, greenvilleUV, 'max');
        const dates = [...new Set([...oneontaDates, ...greenvilleDates])].filter((d, i, a) => a.indexOf(d) === i).slice(0, 30);

        const ctx = document.getElementById('historicalUVChart').getContext('2d');
        this.charts.historicalUV = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: dailyOneontaUV,
                        backgroundColor: 'rgba(249, 115, 22, 0.7)',
                        borderColor: '#f97316',
                        borderWidth: 2
                    },
                    {
                        label: 'Greenville, SC',
                        data: dailyGreenvilleUV,
                        backgroundColor: 'rgba(239, 68, 68, 0.7)',
                        borderColor: '#ef4444',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#a0aec0', font: { size: 12, weight: 'bold' } }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    displayComparisonCharts() {
        this.createComparisonTempChart();
        this.createComparisonPrecipChart();
        this.createComparisonSunChart();
        this.createComparisonWindChart();
        this.populateComparisonTable();
    }

    createComparisonTempChart() {
        const oneontaDaily = this.oneontaForecast.daily;
        const greenvilleDaily = this.greenvilleForecast.daily;

        const ctx = document.getElementById('comparisonTempChart').getContext('2d');
        this.charts.comparisonTemp = new Chart(ctx, {
            type: 'line',
            data: {
                labels: oneontaDaily.time.slice(0, 7).map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'Oneonta, NY (High)',
                        data: oneontaDaily.temperature_2m_max.slice(0, 7),
                        borderColor: '#00d4ff',
                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: '#00d4ff'
                    },
                    {
                        label: 'Greenville, SC (High)',
                        data: greenvilleDaily.temperature_2m_max.slice(0, 7),
                        borderColor: '#7c3aed',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: '#7c3aed'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#a0aec0', font: { size: 12, weight: 'bold' } }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    createComparisonPrecipChart() {
        const oneontaDaily = this.oneontaForecast.daily;
        const greenvilleDaily = this.greenvilleForecast.daily;

        const ctx = document.getElementById('comparisonPrecipChart').getContext('2d');
        this.charts.comparisonPrecip = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: oneontaDaily.time.slice(0, 7).map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: oneontaDaily.precipitation_sum.slice(0, 7),
                        backgroundColor: 'rgba(0, 212, 255, 0.7)',
                        borderColor: '#00d4ff',
                        borderWidth: 2
                    },
                    {
                        label: 'Greenville, SC',
                        data: greenvilleDaily.precipitation_sum.slice(0, 7),
                        backgroundColor: 'rgba(124, 58, 237, 0.7)',
                        borderColor: '#7c3aed',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#a0aec0', font: { size: 12, weight: 'bold' } }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    createComparisonSunChart() {
        const oneontaDaily = this.oneontaForecast.daily;
        const greenvilleDaily = this.greenvilleForecast.daily;

        const ctx = document.getElementById('comparisonSunChart').getContext('2d');
        this.charts.comparisonSun = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: oneontaDaily.time.slice(0, 7).map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: oneontaDaily.sunshine_duration ? oneontaDaily.sunshine_duration.slice(0, 7).map(v => v / 3600) : [],
                        backgroundColor: 'rgba(249, 115, 22, 0.7)',
                        borderColor: '#f97316',
                        borderWidth: 2
                    },
                    {
                        label: 'Greenville, SC',
                        data: greenvilleDaily.sunshine_duration ? greenvilleDaily.sunshine_duration.slice(0, 7).map(v => v / 3600) : [],
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: '#10b981',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#a0aec0', font: { size: 12, weight: 'bold' } }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    createComparisonWindChart() {
        const oneontaDaily = this.oneontaForecast.daily;
        const greenvilleDaily = this.greenvilleForecast.daily;

        const oneontaWindData = this.oneontaForecast.hourly.wind_speed_10m;
        const greenvilleWindData = this.greenvilleForecast.hourly.wind_speed_10m;

        const oneontaDailyWind = this.aggregateDailyData(this.oneontaForecast.hourly.time, oneontaWindData, 'avg').slice(0, 7);
        const greenvilleDailyWind = this.aggregateDailyData(this.greenvilleForecast.hourly.time, greenvilleWindData, 'avg').slice(0, 7);

        const ctx = document.getElementById('comparisonWindChart').getContext('2d');
        this.charts.comparisonWind = new Chart(ctx, {
            type: 'line',
            data: {
                labels: oneontaDaily.time.slice(0, 7).map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: oneontaDailyWind,
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: '#06b6d4'
                    },
                    {
                        label: 'Greenville, SC',
                        data: greenvilleDailyWind,
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        borderColor: '#ec4899',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: '#ec4899'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#a0aec0', font: { size: 12, weight: 'bold' } }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    populateComparisonTable() {
        const tbody = document.getElementById('comparison-table-body');
        tbody.innerHTML = '';

        const oneontaDaily = this.oneontaForecast.daily;
        const greenvilleDaily = this.greenvilleForecast.daily;

        for (let i = 0; i < 7 && i < oneontaDaily.time.length; i++) {
            const date = new Date(oneontaDaily.time[i]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const metrics = [
                {
                    name: 'High Temp',
                    oneonta: `${Math.round(oneontaDaily.temperature_2m_max[i])}°F`,
                    greenville: `${Math.round(greenvilleDaily.temperature_2m_max[i])}°F`,
                    diff: `${Math.round(oneontaDaily.temperature_2m_max[i] - greenvilleDaily.temperature_2m_max[i])}°F`
                },
                {
                    name: 'Low Temp',
                    oneonta: `${Math.round(oneontaDaily.temperature_2m_min[i])}°F`,
                    greenville: `${Math.round(greenvilleDaily.temperature_2m_min[i])}°F`,
                    diff: `${Math.round(oneontaDaily.temperature_2m_min[i] - greenvilleDaily.temperature_2m_min[i])}°F`
                },
                {
                    name: 'Precipitation',
                    oneonta: `${oneontaDaily.precipitation_sum[i].toFixed(2)} in`,
                    greenville: `${greenvilleDaily.precipitation_sum[i].toFixed(2)} in`,
                    diff: `${(oneontaDaily.precipitation_sum[i] - greenvilleDaily.precipitation_sum[i]).toFixed(2)} in`
                },
                {
                    name: 'UV Index',
                    oneonta: `${Math.round(oneontaDaily.uv_index_max[i] * 10) / 10}`,
                    greenville: `${Math.round(greenvilleDaily.uv_index_max[i] * 10) / 10}`,
                    diff: `${Math.round((oneontaDaily.uv_index_max[i] - greenvilleDaily.uv_index_max[i]) * 10) / 10}`
                }
            ];

            metrics.forEach((metric, idx) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${idx === 0 ? date : ''}</td>
                    <td>${metric.name}</td>
                    <td>${metric.oneonta}</td>
                    <td>${metric.greenville}</td>
                    <td>${metric.diff}</td>
                `;
                tbody.appendChild(row);
            });
        }
    }

    aggregateDailyData(times, values, operation) {
        const dailyData = {};
        times.forEach((time, idx) => {
            const date = time.split('T')[0];
            if (!dailyData[date]) {
                dailyData[date] = [];
            }
            dailyData[date].push(values[idx]);
        });

        return Object.values(dailyData).map(dayValues => {
            if (operation === 'avg') return dayValues.reduce((a, b) => a + b, 0) / dayValues.length;
            if (operation === 'sum') return dayValues.reduce((a, b) => a + b, 0);
            if (operation === 'max') return Math.max(...dayValues);
            if (operation === 'min') return Math.min(...dayValues);
        });
    }

    findNearestHourIndex(times, date) {
        let nearest = 0;
        let minDiff = Math.abs(new Date(times[0]) - date);

        for (let i = 1; i < times.length; i++) {
            const diff = Math.abs(new Date(times[i]) - date);
            if (diff < minDiff) {
                minDiff = diff;
                nearest = i;
            }
        }
        return nearest;
    }

    updateLastUpdated() {
        const now = new Date();
        const timeString = now.toLocaleString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
        });
        document.getElementById('last-updated').textContent = timeString;
    }

    displayMonthlyAverageTemperatureChart() {
        const oneontaYearly = this.oneontaYearly;
        const greenvilleYearly = this.greenvilleYearly;

        if (!oneontaYearly || !greenvilleYearly) {
            console.warn('Yearly data not available for monthly chart');
            return;
        }

        // Extract dates and temperatures
        const oneontaDates = oneontaYearly.daily.time;
        const oneontaTemps = oneontaYearly.daily.temperature_2m_mean;
        const greenvilleDates = greenvilleYearly.daily.time;
        const greenvilleTemps = greenvilleYearly.daily.temperature_2m_mean;

        // Aggregate by month
        const monthlyData = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Process Oneonta data
        oneontaDates.forEach((date, idx) => {
            const dateObj = new Date(date);
            const monthKey = dateObj.getFullYear() + '-' + String(dateObj.getMonth()).padStart(2, '0');
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { oneonta: [], greenville: [] };
            }
            monthlyData[monthKey].oneonta.push(oneontaTemps[idx]);
        });

        // Process Greenville data
        greenvilleDates.forEach((date, idx) => {
            const dateObj = new Date(date);
            const monthKey = dateObj.getFullYear() + '-' + String(dateObj.getMonth()).padStart(2, '0');
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { oneonta: [], greenville: [] };
            }
            monthlyData[monthKey].greenville.push(greenvilleTemps[idx]);
        });

        // Calculate monthly averages
        const monthlyLabels = [];
        const oneontaMonthlyAvgs = [];
        const greenvilleMonthlyAvgs = [];

        Object.keys(monthlyData).sort().forEach(monthKey => {
            const [year, month] = monthKey.split('-');
            const monthIndex = parseInt(month);
            monthlyLabels.push(months[monthIndex] + ' ' + year);
            
            const oneontaAvg = monthlyData[monthKey].oneonta.length > 0
                ? monthlyData[monthKey].oneonta.reduce((a, b) => a + b, 0) / monthlyData[monthKey].oneonta.length
                : 0;
            const greenvilleAvg = monthlyData[monthKey].greenville.length > 0
                ? monthlyData[monthKey].greenville.reduce((a, b) => a + b, 0) / monthlyData[monthKey].greenville.length
                : 0;
            
            oneontaMonthlyAvgs.push(Math.round(oneontaAvg * 10) / 10);
            greenvilleMonthlyAvgs.push(Math.round(greenvilleAvg * 10) / 10);
        });

        // Destroy existing chart if it exists
        if (this.charts.monthlyAvgTemp) {
            this.charts.monthlyAvgTemp.destroy();
        }

        const ctx = document.getElementById('monthlyAvgTempChart').getContext('2d');
        this.charts.monthlyAvgTemp = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyLabels,
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: oneontaMonthlyAvgs,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderColor: '#3b82f6',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Greenville, SC',
                        data: greenvilleMonthlyAvgs,
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        borderColor: '#ec4899',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointBackgroundColor: '#ec4899',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: '#a0aec0', font: { size: 12, weight: 'bold' } }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        title: { display: true, text: 'Temperature (°F)', color: '#a0aec0' }
                    },
                    x: {
                        ticks: { color: '#a0aec0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    showError(message) {
        console.error(message);
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WeatherDashboard();
});

