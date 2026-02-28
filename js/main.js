mapboxgl.accessToken = 'pk.eyJ1Ijoidmlwc2hlaGJheiIsImEiOiJjbWt1eDYzcWQwMGtzM2NxeDN1Z2NuMzZrIn0.UtNx0noYlyAJPAkP1g6x1g';

let currentView = "rent";
let selectedYear = 2022;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-122.335167, 47.608013],
  zoom: 11
});

map.on('load', () => {

  map.addSource('housing-data', {
    type: 'geojson',
    data: 'data/rent_burden.geojson'
  });

  map.addLayer({
    id: 'housing-layer',
    type: 'fill',
    source: 'housing-data',
    paint: {
      'fill-color': rentColorScale(),
      'fill-opacity': 0.8
    }
  });

  map.addLayer({
    id: 'housing-outline',
    type: 'line',
    source: 'housing-data',
    paint: {
      'line-color': '#000',
      'line-width': 0.5
    }
  });

  createLegend();
  setupInteractions();
});

function rentColorScale() {
  return [
    'step',
    ['get', 'rent_over_50'],
    '#2DC4B2',
    10, '#3BB3C3',
    20, '#669EC4',
    30, '#8B88B6',
    40, '#A2719B',
    50, '#AA5E79'
  ];
}

function incomeColorScale() {
  return [
    'step',
    ['get', 'median_income'],
    '#edf8fb',
    40000, '#b2e2e2',
    60000, '#66c2a4',
    80000, '#2ca25f',
    100000, '#006d2c'
  ];
}

function toggleView() {
  if (currentView === "rent") {
    currentView = "income";
    map.setPaintProperty('housing-layer', 'fill-color', incomeColorScale());
  } else {
    currentView = "rent";
    map.setPaintProperty('housing-layer', 'fill-color', rentColorScale());
  }
}

function resetMap() {
  map.flyTo({
    center: [-122.335167, 47.608013],
    zoom: 11
  });
}

function setupInteractions() {

  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  map.on('mousemove', 'housing-layer', (e) => {
    map.getCanvas().style.cursor = 'pointer';

    const props = e.features[0].properties;

    popup
      .setLngLat(e.lngLat)
      .setHTML(`
        <strong>Tract:</strong> ${props.GEOID}<br>
        <strong>Rent >50%:</strong> ${props.rent_over_50}%<br>
        <strong>Median Income:</strong> $${props.median_income}
      `)
      .addTo(map);
  });

  map.on('mouseleave', 'housing-layer', () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
  });

  map.on('click', 'housing-layer', (e) => {
    const props = e.features[0].properties;

    document.getElementById('tract-info').innerHTML =
      `<strong>Tract:</strong> ${props.GEOID}<br>
       <strong>Rent Burden:</strong> ${props.rent_over_50}%<br>
       <strong>Median Income:</strong> $${props.median_income}`;

    updateChart(props);
  });
}

const chart = c3.generate({
  bindto: '#chart',
  data: {
    columns: [
      ['Rent Burden', 0],
      ['Median Income', 0]
    ],
    type: 'bar'
  },
  axis: {
    y: {
      label: 'Value'
    }
  }
});

function updateChart(props) {
  chart.load({
    columns: [
      ['Rent Burden', props.rent_over_50],
      ['Median Income', props.median_income]
    ]
  });
}

document.getElementById("yearSlider").addEventListener("input", function() {
  selectedYear = parseInt(this.value);
  document.getElementById("yearValue").textContent = selectedYear;

  map.setFilter('housing-layer', ['==', ['get', 'year'], selectedYear]);
});

function createLegend() {

  const legend = document.getElementById('legend');
  legend.innerHTML = '';

  const labels = currentView === "rent"
    ? ["0–10%","10–20%","20–30%","30–40%","40–50%","50%+"]
    : ["<40k","40k–60k","60k–80k","80k–100k","100k+"];

  const colors = currentView === "rent"
    ? ['#2DC4B2','#3BB3C3','#669EC4','#8B88B6','#A2719B','#AA5E79']
    : ['#edf8fb','#b2e2e2','#66c2a4','#2ca25f','#006d2c'];

  labels.forEach((label, i) => {
    const div = document.createElement('div');
    div.innerHTML =
      `<span style="background:${colors[i]}"></span>${label}`;
    legend.appendChild(div);
  });
}
