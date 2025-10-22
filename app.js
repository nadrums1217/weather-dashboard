// Weather Dashboard Application

class WeatherDashboard {
    constructor() {
        this.oneontaForecast = null;
        this.oneontaHistorical = null;
        this.greenvilleForecast = null;
        this.greenvilleHistorical = null;
        this.charts = {};
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.displayCurrentWeather();
            this.displayHistoricalCharts();
            this.displayComparisonCharts();
            this.updateLastUpdated();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showError('Failed to load weather data. Please refresh the page.');
        }
    }

    async loadData() {
        try {
            const [oneontaForecast, oneontaHistorical, greenvilleForecast, greenvilleHistorical] = await Promise.all([
                fetch('./oneonta_forecast.json').then(r => r.json()),
                fetch('./oneonta_historical.json').then(r => r.json()),
                fetch('./greenville_forecast.json').then(r => r.json()),
                fetch('./greenville_historical.json').then(r => r.json())
            ]);

            this.oneontaForecast = oneontaForecast;
            this.oneontaHistorical = oneontaHistorical;
            this.greenvilleForecast = greenvilleForecast;
            this.greenvilleHistorical = greenvilleHistorical;

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
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabName).classList.add('active');
        event.target.classList.add('active');

        // Trigger chart resize if needed
        if (tabName === 'historical' || tabName === 'comparison') {
            setTimeout(() => {
                Object.values(this.charts).forEach(chart => {
                    if (chart) chart.resize();
                });
            }, 100);
        }
    }

    displayCurrentWeather() {
        // Get current hour index
        const now = new Date();
        const currentHourIndex = this.findNearestHourIndex(this.oneontaForecast.hourly.time, now);

        // Oneonta
        this.displayLocationCurrent('oneonta', this.oneontaForecast, currentHourIndex);
        this.displayHourlyForecast('oneonta', this.oneontaForecast, currentHourIndex);

        // Greenville
        this.displayLocationCurrent('greenville', this.greenvilleForecast, currentHourIndex);
        this.displayHourlyForecast('greenville', this.greenvilleForecast, currentHourIndex);
        
        // Display precipitation comparison
        this.displayPrecipitationComparison(currentHourIndex);
    }

    displayLocationCurrent(location, forecastData, hourIndex) {
        const hourly = forecastData.hourly;
        const daily = forecastData.daily;

        // Find today's daily data
        const todayIndex = daily.time.findIndex(date => date === new Date().toISOString().split('T')[0]);

        // Update current temperature
        document.getElementById(`${location}-current-temp`).textContent = 
            `${Math.round(hourly.temperature_2m[hourIndex])}°F`;

        // Update sunrise and sunset
        if (todayIndex >= 0) {
            document.getElementById(`${location}-sunrise`).textContent = daily.sunrise[todayIndex];
            document.getElementById(`${location}-sunset`).textContent = daily.sunset[todayIndex];
        }

        // Update precipitation
        document.getElementById(`${location}-current-precip`).textContent = 
            `${hourly.precipitation[hourIndex].toFixed(2)} in`;

        // Update sunshine duration (convert seconds to minutes)
        const sunMinutes = Math.round(hourly.sunshine_duration[hourIndex] / 60);
        document.getElementById(`${location}-current-sun`).textContent = 
            `${sunMinutes} min`;
    }

    displayHourlyForecast(location, forecastData, startIndex) {
        const hourly = forecastData.hourly;
        const container = document.getElementById(`${location}-hourly-forecast`);
        container.innerHTML = '';

        // Display next 24 hours
        for (let i = 0; i < 24 && startIndex + i < hourly.time.length; i++) {
            const index = startIndex + i;
            const time = new Date(hourly.time[index]);
            const hour = time.getHours().toString().padStart(2, '0');

            const item = document.createElement('div');
            item.className = 'hourly-item';
            item.innerHTML = `
                <div class="time">${hour}:00</div>
                <div class="temp">${Math.round(hourly.temperature_2m[index])}°F</div>
                <div class="precip">${hourly.precipitation[index].toFixed(2)}in</div>
            `;
            container.appendChild(item);
        }
    }

    displayHistoricalCharts() {
        const tempCtx = document.getElementById('historicalTempChart').getContext('2d');
        const precipCtx = document.getElementById('historicalPrecipChart').getContext('2d');
        const sunCtx = document.getElementById('historicalSunChart').getContext('2d');

        const dates = this.oneontaHistorical.hourly.time.map(t => new Date(t));
        const dateLabels = this.getDateLabels(dates);

        // Temperature Chart
        this.charts.historicalTemp = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: this.oneontaHistorical.hourly.temperature_2m,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        borderWidth: 2.5,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Greenville, SC',
                        data: this.greenvilleHistorical.hourly.temperature_2m,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                        borderWidth: 2.5,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Temperature (°F)'
                        },
                        ticks: {
                            color: '#b0b9d4'
                        },
                        grid: {
                            color: 'rgba(59, 130, 246, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#b0b9d4'
                        },
                        grid: {
                            color: 'rgba(59, 130, 246, 0.05)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#b0b9d4',
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    }
                }
            }
        });

        // Precipitation Chart
        this.charts.historicalPrecip = new Chart(precipCtx, {
            type: 'bar',
            data: {
                labels: dateLabels,
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: this.oneontaHistorical.hourly.precipitation,
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: '#3b82f6',
                        borderWidth: 1.5
                    },
                    {
                        label: 'Greenville, SC',
                        data: this.greenvilleHistorical.hourly.precipitation,
                        backgroundColor: 'rgba(139, 92, 246, 0.7)',
                        borderColor: '#8b5cf6',
                        borderWidth: 1.5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Precipitation (in)'
                        },
                        ticks: {
                            color: '#b0b9d4'
                        },
                        grid: {
                            color: 'rgba(59, 130, 246, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#b0b9d4'
                        },
                        grid: {
                            color: 'rgba(59, 130, 246, 0.05)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#b0b9d4',
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    }
                }
            }
        });

        // Sunshine Duration Chart
        const sunDurationOneonta = this.oneontaHistorical.hourly.sunshine_duration.map(s => s / 3600);
        const sunDurationGreenville = this.greenvilleHistorical.hourly.sunshine_duration.map(s => s / 3600);

        this.charts.historicalSun = new Chart(sunCtx, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: sunDurationOneonta,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        borderWidth: 2.5,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Greenville, SC',
                        data: sunDurationGreenville,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                        borderWidth: 2.5,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Sunshine Duration (hours)'
                        },
                        ticks: {
                            color: '#b0b9d4'
                        },
                        grid: {
                            color: 'rgba(59, 130, 246, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#b0b9d4'
                        },
                        grid: {
                            color: 'rgba(59, 130, 246, 0.05)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#b0b9d4',
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    }
                }
            }
        });
    }

    displayComparisonCharts() {
        // Get next 7 days of data
        const now = new Date();
        const startIndex = this.findNearestHourIndex(this.oneontaForecast.hourly.time, now);
        const endIndex = Math.min(startIndex + 168, this.oneontaForecast.hourly.time.length); // 7 days = 168 hours

        const dates = this.oneontaForecast.hourly.time.slice(startIndex, endIndex).map(t => new Date(t));
        const dateLabels = this.getDateLabels(dates);

        const oneontaTemp = this.oneontaForecast.hourly.temperature_2m.slice(startIndex, endIndex);
        const greenvilleTemp = this.greenvilleForecast.hourly.temperature_2m.slice(startIndex, endIndex);
        const oneontaPrecip = this.oneontaForecast.hourly.precipitation.slice(startIndex, endIndex);
        const greenvillePrecip = this.greenvilleForecast.hourly.precipitation.slice(startIndex, endIndex);
        const oneontaSun = this.oneontaForecast.hourly.sunshine_duration.slice(startIndex, endIndex).map(s => s / 3600);
        const greenvilleSun = this.greenvilleForecast.hourly.sunshine_duration.slice(startIndex, endIndex).map(s => s / 3600);

        // Temperature Comparison
        const tempCtx = document.getElementById('tempComparisonChart').getContext('2d');
        this.charts.tempComparison = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: oneontaTemp,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        borderWidth: 2.5,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Greenville, SC',
                        data: greenvilleTemp,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                        borderWidth: 2.5,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });

        // Precipitation Comparison
        const precipCtx = document.getElementById('precipComparisonChart').getContext('2d');
        this.charts.precipComparison = new Chart(precipCtx, {
            type: 'bar',
            data: {
                labels: dateLabels,
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: oneontaPrecip,
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: '#3b82f6',
                        borderWidth: 1.5
                    },
                    {
                        label: 'Greenville, SC',
                        data: greenvillePrecip,
                        backgroundColor: 'rgba(139, 92, 246, 0.7)',
                        borderColor: '#8b5cf6',
                        borderWidth: 1.5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });

        // Sunshine Duration Comparison
        const sunCtx = document.getElementById('sunComparisonChart').getContext('2d');
        this.charts.sunComparison = new Chart(sunCtx, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [
                    {
                        label: 'Oneonta, NY',
                        data: oneontaSun,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        borderWidth: 2.5,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Greenville, SC',
                        data: greenvilleSun,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                        borderWidth: 2.5,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });

        // Populate comparison table
        this.populateComparisonTable(startIndex, endIndex);
    }

    populateComparisonTable(startIndex, endIndex) {
        const tbody = document.getElementById('comparisonTableBody');
        tbody.innerHTML = '';

        const metrics = ['Temperature (°F)', 'Precipitation (in)', 'Sunshine (hours)'];

        for (let i = startIndex; i < endIndex; i += 24) { // Show daily data
            const date = new Date(this.oneontaForecast.hourly.time[i]);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            metrics.forEach(metric => {
                let oneontaValue, greenvilleValue, difference;

                if (metric === 'Temperature (°F)') {
                    oneontaValue = Math.round(this.oneontaForecast.hourly.temperature_2m[i] * 10) / 10;
                    greenvilleValue = Math.round(this.greenvilleForecast.hourly.temperature_2m[i] * 10) / 10;
                    difference = (oneontaValue - greenvilleValue).toFixed(1);
                } else if (metric === 'Precipitation (in)') {
                    oneontaValue = this.oneontaForecast.hourly.precipitation[i].toFixed(2);
                    greenvilleValue = this.greenvilleForecast.hourly.precipitation[i].toFixed(2);
                    difference = (parseFloat(oneontaValue) - parseFloat(greenvilleValue)).toFixed(2);
                } else if (metric === 'Sunshine (hours)') {
                    oneontaValue = (this.oneontaForecast.hourly.sunshine_duration[i] / 3600).toFixed(1);
                    greenvilleValue = (this.greenvilleForecast.hourly.sunshine_duration[i] / 3600).toFixed(1);
                    difference = (parseFloat(oneontaValue) - parseFloat(greenvilleValue)).toFixed(1);
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${dateStr}</td>
                    <td>${metric}</td>
                    <td>${oneontaValue}</td>
                    <td>${greenvilleValue}</td>
                    <td>${difference > 0 ? '+' : ''}${difference}</td>
                `;
                tbody.appendChild(row);
            });
        }
    }

    findNearestHourIndex(times, date) {
        const targetTime = date.toISOString().slice(0, 13) + ':00';
        const index = times.findIndex(t => t.startsWith(targetTime.slice(0, 13)));
        return index >= 0 ? index : 0;
    }

    getDateLabels(dates) {
        return dates.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' }));
    }

    updateLastUpdated() {
        const now = new Date();
        document.getElementById('lastUpdated').textContent = now.toLocaleString();
    }

    showError(message) {
        const container = document.querySelector('.container');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        container.insertBefore(errorDiv, container.firstChild);
    }

    displayPrecipitationComparison(startIndex) {
        const oneontaPrecip = this.oneontaForecast.hourly.precipitation;
        const greenvillePrecip = this.greenvilleForecast.hourly.precipitation;

        // Display Oneonta precipitation
        const oneontaContainer = document.getElementById('oneonta-precip-comparison');
        oneontaContainer.innerHTML = '';
        for (let i = 0; i < 24 && startIndex + i < oneontaPrecip.length; i++) {
            const index = startIndex + i;
            const time = new Date(this.oneontaForecast.hourly.time[index]);
            const hour = time.getHours().toString().padStart(2, '0');
            const precip = oneontaPrecip[index].toFixed(2);

            const item = document.createElement('div');
            item.className = 'hourly-item';
            item.style.background = precip > 0 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.08)';
            item.innerHTML = `
                <div class="time">${hour}:00</div>
                <div class="temp" style="color: #3b82f6;">${precip} in</div>
            `;
            oneontaContainer.appendChild(item);
        }

        // Display Greenville precipitation
        const greenvilleContainer = document.getElementById('greenville-precip-comparison');
        greenvilleContainer.innerHTML = '';
        for (let i = 0; i < 24 && startIndex + i < greenvillePrecip.length; i++) {
            const index = startIndex + i;
            const time = new Date(this.greenvilleForecast.hourly.time[index]);
            const hour = time.getHours().toString().padStart(2, '0');
            const precip = greenvillePrecip[index].toFixed(2);

            const item = document.createElement('div');
            item.className = 'hourly-item';
            item.style.background = precip > 0 ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.08)';
            item.innerHTML = `
                <div class="time">${hour}:00</div>
                <div class="temp" style="color: #8b5cf6;">${precip} in</div>
            `;
            greenvilleContainer.appendChild(item);
        }

        // Display difference
        const differenceContainer = document.getElementById('precip-difference-comparison');
        differenceContainer.innerHTML = '';
        for (let i = 0; i < 24 && startIndex + i < oneontaPrecip.length; i++) {
            const index = startIndex + i;
            const time = new Date(this.oneontaForecast.hourly.time[index]);
            const hour = time.getHours().toString().padStart(2, '0');
            const diff = (oneontaPrecip[index] - greenvillePrecip[index]).toFixed(2);
            const diffValue = parseFloat(diff);
            const color = diffValue > 0 ? '#3b82f6' : diffValue < 0 ? '#8b5cf6' : '#b0b9d4';
            const bgColor = diffValue > 0 ? 'rgba(59, 130, 246, 0.15)' : diffValue < 0 ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.05)';

            const item = document.createElement('div');
            item.className = 'hourly-item';
            item.style.background = bgColor;
            item.innerHTML = `
                <div class="time">${hour}:00</div>
                <div class="temp" style="color: ${color};">${diff} in</div>
            `;
            differenceContainer.appendChild(item);
        }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WeatherDashboard();
});

