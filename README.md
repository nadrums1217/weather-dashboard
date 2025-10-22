# Weather Dashboard

An interactive web-based weather dashboard comparing real-time weather data for Oneonta, NY and Greenville, SC. The dashboard displays current conditions, hourly forecasts, historical trends, and detailed comparisons between the two locations.

## Features

- **Current Weather Display**: Real-time temperature, sunrise/sunset times, precipitation, and sunshine duration for both locations.
- **Hourly Forecast**: 24-hour forecast with temperature and precipitation data.
- **Historical Data**: 30-day historical weather trends with charts for temperature, precipitation, and sunshine duration.
- **Comparison Charts**: Side-by-side comparison of weather metrics for the next 7 days.
- **Detailed Comparison Table**: Daily metrics comparison showing differences between locations.
- **Automatic Updates**: Hourly data updates via GitHub Actions (when deployed).
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices.

## Weather Data

The dashboard uses the **Open-Meteo API**, a free, open-source weather API that provides:

- **No API key required** for non-commercial use
- **Hourly forecast data** for up to 16 days
- **Historical weather data** for up to 80 years
- **High-resolution data** from national weather services

Learn more: [https://open-meteo.com/](https://open-meteo.com/)

## Project Structure

```
weather-dashboard/
├── public/                    # Static web files (served by GitHub Pages)
│   ├── index.html            # Main HTML file
│   ├── css/
│   │   └── styles.css        # Dashboard styling
│   ├── js/
│   │   └── app.js            # Main application logic
│   ├── *.json                # Weather data files (auto-generated)
├── scripts/
│   └── data_fetcher.py       # Python script to fetch weather data
├── data/                     # Local data storage (not deployed)
├── .github/
│   └── workflows/
│       └── update-weather-data.yml  # GitHub Actions workflow
└── README.md                 # This file
```

## Deployment on GitHub Pages

### Prerequisites

- A GitHub account
- Git installed on your local machine

### Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and log in to your account.
2. Click the **+** icon in the top right corner and select **New repository**.
3. Name your repository `weather-dashboard`.
4. Choose **Public** (required for free GitHub Pages).
5. Click **Create repository**.

### Step 2: Clone and Push the Project

```bash
# Clone your new repository
git clone https://github.com/YOUR_USERNAME/weather-dashboard.git
cd weather-dashboard

# Copy the project files into the repository
# (Assuming you've downloaded or created the project files)

# Initialize Git and add files
git add .
git commit -m "Initial commit: Weather dashboard"
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub.
2. Click **Settings** (top right).
3. In the left sidebar, click **Pages**.
4. Under **Source**, select **Deploy from a branch**.
5. Select **main** branch and **/root** folder.
6. Click **Save**.

Your dashboard will be available at: `https://YOUR_USERNAME.github.io/weather-dashboard/`

### Step 4: Enable GitHub Actions for Hourly Updates

The dashboard includes an automated workflow that updates weather data every hour.

1. Go to your repository on GitHub.
2. Click the **Actions** tab.
3. Click **I understand my workflows, go ahead and enable them**.
4. The workflow `update-weather-data.yml` will automatically run every hour.

**Note**: The workflow requires the repository to be public and GitHub Actions to be enabled (default for public repositories).

## Local Development

### Prerequisites

- Python 3.7 or higher
- A text editor or IDE

### Running Locally

1. **Install dependencies**:
   ```bash
   pip install requests
   ```

2. **Fetch initial weather data**:
   ```bash
   python scripts/data_fetcher.py
   ```

3. **Copy data to public directory**:
   ```bash
   cp data/*.json public/
   ```

4. **Start a local web server**:
   ```bash
   cd public
   python -m http.server 8000
   ```

5. **Open in browser**:
   Navigate to `http://localhost:8000`

## How It Works

### Data Flow

1. **Data Fetching**: The `data_fetcher.py` script calls the Open-Meteo API to retrieve:
   - Forecast data (next 16 days, hourly)
   - Historical data (last 30 days, hourly)

2. **Data Storage**: Weather data is stored as JSON files in the `public/` directory.

3. **Frontend Display**: The `app.js` JavaScript file loads the JSON data and:
   - Displays current weather conditions
   - Renders interactive charts using Chart.js
   - Populates comparison tables
   - Handles tab navigation

4. **Automatic Updates**: GitHub Actions runs the data fetcher every hour, commits changes, and pushes to the repository. GitHub Pages automatically serves the updated data.

### Locations

- **Oneonta, NY**: 42.4534°N, 75.0510°W
- **Greenville, SC**: 34.8526°N, 82.3940°W

### Weather Variables

- **Temperature (°C)**: Air temperature at 2 meters above ground
- **Precipitation (mm)**: Total hourly precipitation (rain, showers, snow)
- **Sunshine Duration (hours)**: Accumulated sunshine duration per hour
- **Sunrise/Sunset**: Daily times (in local timezone)

## Customization

### Adding More Locations

To add additional locations, edit `scripts/data_fetcher.py`:

```python
LOCATIONS = {
    'oneonta': {
        'name': 'Oneonta, NY',
        'latitude': 42.4534,
        'longitude': -75.0510
    },
    'greenville': {
        'name': 'Greenville, SC',
        'latitude': 34.8526,
        'longitude': -82.3940
    },
    # Add new locations here
    'new_location': {
        'name': 'City Name, State',
        'latitude': XX.XXXX,
        'longitude': -XX.XXXX
    }
}
```

Then update `public/index.html` to add new location cards and update `public/js/app.js` to display the new data.

### Changing Update Frequency

Edit `.github/workflows/update-weather-data.yml` to change the cron schedule:

```yaml
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
```

Cron format: `minute hour day month day-of-week`

## Troubleshooting

### Dashboard shows "Failed to load weather data"

- **Check browser console**: Press F12, go to Console tab, and look for error messages.
- **Verify data files**: Ensure `*.json` files are in the `public/` directory.
- **Check file paths**: Verify that `app.js` is loading files from the correct path.

### GitHub Actions workflow not running

- **Enable Actions**: Go to repository Settings → Actions → General → Ensure "Allow all actions and reusable workflows" is selected.
- **Check workflow file**: Ensure `.github/workflows/update-weather-data.yml` is properly formatted YAML.
- **Manual trigger**: Go to Actions tab and click "Run workflow" to test.

### Data not updating

- **Check workflow logs**: Go to Actions tab, click the workflow run, and check logs for errors.
- **Verify API access**: Run `python scripts/data_fetcher.py` locally to test API connectivity.
- **Git configuration**: Ensure the workflow has proper Git configuration for commits.

## Browser Compatibility

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- **Initial load**: ~2-3 seconds (depends on internet speed)
- **Chart rendering**: ~1-2 seconds
- **Data updates**: Automatic hourly via GitHub Actions
- **Page size**: ~150KB (including all data)

## License

This project is open-source and available under the MIT License. Weather data is provided by Open-Meteo under the CC BY 4.0 license.

## Credits

- **Weather Data**: [Open-Meteo](https://open-meteo.com/) - Free weather API
- **Charts**: [Chart.js](https://www.chartjs.org/) - JavaScript charting library
- **Hosting**: [GitHub Pages](https://pages.github.com/) - Free static site hosting

## Support

For issues or questions:

1. Check the Troubleshooting section above.
2. Review the [Open-Meteo API documentation](https://open-meteo.com/en/docs).
3. Check [GitHub Actions documentation](https://docs.github.com/en/actions) for workflow issues.

## Future Enhancements

Potential improvements for future versions:

- Add more locations for comparison
- Include additional weather variables (wind speed, humidity, etc.)
- Implement weather alerts and notifications
- Add data export functionality (CSV, PDF)
- Create mobile app version
- Add weather pattern analysis and predictions
- Implement user preferences and settings
- Add dark mode theme

