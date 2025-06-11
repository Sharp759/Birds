// Global variables
let map;
let heatmapLayer = null;
let currentBasemap = 'light';
let currentBirdSpecies = 'Pigeons';
let cityMarkers = [];
let barChart, lineChart, pieChart;

// Basemap configurations
const basemaps = {
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    })
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    initCharts();
    setupEventListeners();
    updateVisualizations();
});

// Initialize the map
function initMap() {
    map = L.map('map').setView([41.8719, 12.5674], 6); // Center on Italy
    
    // Add the default basemap
    basemaps.dark.addTo(map);
    
    // Add city boundaries from GeoJSON
    L.geoJSON(citiesGeoJSON, {
        style: {
            color: '#e51301',
            weight: 1.5,
            opacity: 0.7,
            fillOpacity: 0.05
        }
    }).addTo(map);
}

// Initialize charts with compact styling
function initCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#ecf0f1',
                    font: {
                        size: 9
                    },
                    padding: 10,
                    boxWidth: 12
                }
            },
            tooltip: {
                bodyFont: {
                    size: 9
                },
                titleFont: {
                    size: 9
                },
                padding: 8
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#ecf0f1',
                    font: {
                        size: 8
                    },
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: {
                    color: 'rgba(236, 240, 241, 0.1)',
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: '#ecf0f1',
                    font: {
                        size: 8
                    },
                    padding: 5
                },
                grid: {
                    color: 'rgba(236, 240, 241, 0.1)',
                    drawBorder: false
                }
            }
        },
        elements: {
            bar: {
                borderWidth: 0.5
            },
            line: {
                borderWidth: 1,
                tension: 0.3
            },
            point: {
                radius: 2,
                hoverRadius: 4
            }
        },
        layout: {
            padding: {
                top: 5,
                bottom: 5,
                left: 5,
                right: 5
            }
        }
    };
    
    // Bar Chart
    const barCtx = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: '',
                data: [],
                backgroundColor: '#3498db',
                borderColor: '#2980b9'
            }]
        },
        options: chartOptions
    });
    
    // Line Chart
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '',
                data: [],
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: '#3498db',
                fill: true
            }]
        },
        options: chartOptions
    });
    
    // Pie Chart
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#3498db', '#2ecc71', '#e74c3c', '#f1c40f', 
                    '#9b59b6', '#1abc9c', '#d35400', '#34495e',
                    '#7f8c8d', '#27ae60'
                ],
                borderWidth: 0.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ecf0f1',
                        font: {
                            size: 8
                        },
                        padding: 6,
                        boxWidth: 10
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: 9
                    },
                    titleFont: {
                        size: 9
                    },
                    padding: 8
                }
            },
            layout: {
                padding: {
                    top: 5,
                    bottom: 5,
                    left: 5,
                    right: 5
                }
            }
        }
    });
}

// Set up event listeners
function setupEventListeners() {
    // Basemap toggle switches
    document.querySelectorAll('input[name="basemap"]').forEach(radio => {
        radio.addEventListener('change', function() {
            currentBasemap = this.value;
            updateBasemap();
        });
    });
    
    // Bird species dropdown
    document.getElementById('birdSpecies').addEventListener('change', function() {
        currentBirdSpecies = this.value;
        updateVisualizations();
    });
    
    // Heatmap toggle
    document.getElementById('heatmapToggle').addEventListener('change', function() {
        updateHeatmap();
    });
}

// Update basemap based on selection
function updateBasemap() {
    Object.values(basemaps).forEach(layer => layer.remove());
    basemaps[currentBasemap].addTo(map);
}

// Update all visualizations
function updateVisualizations() {
    updateKPIs();
    updateCharts();
    updateMapMarkers();
    updateHeatmap();
    
    // Update KPI titles with current bird species
    document.querySelectorAll('#kpiBirdName1, #kpiBirdName2, #kpiBirdName3, #kpiBirdName4').forEach(el => {
        el.textContent = currentBirdSpecies;
    });
}

// Update KPIs with compact display
function updateKPIs() {
    const values = birdsData.map(city => city[currentBirdSpecies]);
    const total = values.reduce((sum, val) => sum + val, 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = total / values.length;
    
    // Find cities with max and min values
    const maxCity = birdsData.find(city => city[currentBirdSpecies] === max).city;
    const minCity = birdsData.find(city => city[currentBirdSpecies] === min).city;
    
    // Format numbers for compact display
    const formatNumber = (num) => {
        if (num > 1000) return `${(num/1000).toFixed(1)}k`;
        return num.toLocaleString();
    };
    
    // Update DOM with formatted values
    document.getElementById('totalBirds').textContent = formatNumber(total);
    document.getElementById('maxBirds').textContent = formatNumber(max);
    document.getElementById('minBirds').textContent = formatNumber(min);
    document.getElementById('avgBirds').textContent = formatNumber(avg);
    document.getElementById('maxCity').textContent = maxCity;
    document.getElementById('minCity').textContent = minCity;
}

// Update charts
function updateCharts() {
    // Sort data by selected bird species (descending)
    const sortedData = [...birdsData].sort((a, b) => b[currentBirdSpecies] - a[currentBirdSpecies]);
    
    // Get top 8 cities for better visualization in compact space
    const topCities = sortedData.slice(0, 8);
    const cityNames = topCities.map(city => city.city);
    const birdCounts = topCities.map(city => city[currentBirdSpecies]);
    
    // Update Bar Chart
    barChart.data.labels = cityNames;
    barChart.data.datasets[0].data = birdCounts;
    barChart.data.datasets[0].label = currentBirdSpecies;
    barChart.update();
    
    // Update Line Chart (show all cities in order)
    lineChart.data.labels = birdsData.map(city => city.city);
    lineChart.data.datasets[0].data = birdsData.map(city => city[currentBirdSpecies]);
    lineChart.data.datasets[0].label = currentBirdSpecies;
    lineChart.update();
    
    // Update Pie Chart (show top 5 species distribution for first city)
    updatePieChart();
}

// Update pie chart to show species distribution for first city
function updatePieChart() {
    const species = [
        'Pigeons', 'Sparrows', 'Seagulls', 'Blackbirds', 'Robins',
        'Magpies', 'Mockingbird', 'Kingfisher', 'Cardinal'
    ];
    
    const firstCity = birdsData[0];
    const labels = species;
    const data = species.map(specie => firstCity[specie]);
    
    pieChart.data.labels = labels;
    pieChart.data.datasets[0].data = data;
    pieChart.update();
}

// Update map markers
// Update map markers with custom icon
function updateMapMarkers() {
    // Clear existing markers
    cityMarkers.forEach(marker => map.removeLayer(marker));
    cityMarkers = [];
    
    // Create custom icon
    const customIcon = L.icon({
        iconUrl: 'MapIcon.png',
        iconSize: [20, 20], // size of the icon
        iconAnchor: [12, 25], // point of the icon which will correspond to marker's location
        popupAnchor: [0, -25] // point from which the popup should open relative to the iconAnchor
    });
    
    // Add new markers with custom icon and enhanced popup
    birdsData.forEach(city => {
        const marker = L.marker([city.latitude, city.longitude], {
            icon: customIcon
        }).addTo(map);
        
        const popupContent = `
            <div class="popup-container">
                <div class="popup-image">
                    <img src="images/${currentBirdSpecies}.jpg" alt="${currentBirdSpecies}">
                </div>
                <div class="popup-header">
                    <h3>${city.city}</h3>
                    <p>${city[currentBirdSpecies].toLocaleString()} ${currentBirdSpecies}</p>
                </div>
                <div class="popup-stats">
                    Total: ${city.Total.toLocaleString()}
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent, {
            className: 'custom-popup',
            maxWidth: 250,
            minWidth: 250
        });
        
        cityMarkers.push(marker);
    });
}
// Update heatmap
function updateHeatmap() {
    const heatmapToggle = document.getElementById('heatmapToggle');
    
    if (heatmapToggle.checked) {
        // Create heatmap data
        const heatmapData = birdsData.map(city => [
            city.latitude, 
            city.longitude, 
            city[currentBirdSpecies] / 100 // Intensity (scaled down)
        ]);
        
        // Remove existing heatmap if any
        if (heatmapLayer) {
            map.removeLayer(heatmapLayer);
        }
        
        // Add new heatmap
        heatmapLayer = L.heatLayer(heatmapData, {
            radius: 20,
            blur: 15,
            maxZoom: 17,
            gradient: {0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red'}
        }).addTo(map);
    } else if (heatmapLayer) {
        map.removeLayer(heatmapLayer);
        heatmapLayer = null;
    }
}
