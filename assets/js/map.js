// All setup for the map
var defaultIcon = L.icon({
    iconUrl: 'https://pic.onlinewebfonts.com/svg/img_415813.png',
    shadowUrl: 'https://pic.onlinewebfonts.com/svg/img_415813.png',
    iconSize: [20, 25],
    shadowSize: [0, 0],
    iconAnchor: [20, 25],
    shadowAnchor: [4, 62],
    popupAnchor: [-3, -3]
});

var parkIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/896/896059.png',
    shadowUrl: 'https://cdn-icons-png.flaticon.com/512/896/896059.png',
    iconSize: [20, 25],
    shadowSize: [0, 0],
    iconAnchor: [20, 25],
    shadowAnchor: [4, 62],
    popupAnchor: [-3, -3]
});

var schoolIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2799/2799142.png',
    shadowUrl: 'https://cdn-icons-png.flaticon.com/512/896/896059.png',
    iconSize: [20, 20],
    shadowSize: [0, 0],
    iconAnchor: [20, 20],
    shadowAnchor: [4, 62],
    popupAnchor: [-3, -3]
});

var libraryIcon = L.icon({
    iconUrl: 'https://i.pinimg.com/originals/9e/ec/37/9eec37f0efbc0f8044645476e284e741.png',
    shadowUrl: 'https://cdn-icons-png.flaticon.com/512/896/896059.png',
    iconSize: [30, 35],
    shadowSize: [0, 0],
    iconAnchor: [30, 35],
    shadowAnchor: [4, 62],
    popupAnchor: [-3, -3]
});

var pubIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/988/988934.png',
    shadowUrl: 'https://cdn-icons-png.flaticon.com/512/896/896059.png',
    iconSize: [20, 20],
    shadowSize: [0, 0],
    iconAnchor: [20, 20],
    shadowAnchor: [4, 62],
    popupAnchor: [-3, -3]
});
var genericIcon = L.icon({
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Lol_circle.png/479px-Lol_circle.png',
    shadowUrl: 'https://cdn-icons-png.flaticon.com/512/896/896059.png',
    iconSize: [10, 10],
    shadowSize: [0, 0],
    iconAnchor: [10, 10],
    shadowAnchor: [4, 62],
    popupAnchor: [-3, -3]
});

//// Load map
var map = L.map('map').setView([51.505, -0.09], 13);
var tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var customMarker = L.Icon.extend({
    options: {
        shadowUrl: null,
        iconAnchor: new L.Point(12, 12),
        iconSize: new L.Point(24, 24),
        iconUrl: 'https://pic.onlinewebfonts.com/svg/img_415813.png'
    }
});


// add leaflet.pm controls with some options to the map
map.pm.addControls({
    position: 'topleft',
    drawCircle: false,
    // drawMarker: { cursorMarker: true },
    drawPolyline: false,
    drawCircleMarker: false
});

let customPolygon = [];
let markerstoMap = [];

map.on('pm:create', e => {
    map.pm.disableDraw('Marker');

    // console.log(e);
    if (e.shape === "Polygon" || e.shape === "Rectangle") {
        let geometrycoord = [];
        let finalCoords = [];
        for (i in e.layer._latlngs[0]) {
            let coordinates = []
            coordinates.push(e.layer._latlngs[0][i].lng);
            coordinates.push(e.layer._latlngs[0][i].lat)
            geometrycoord.push(coordinates);
        }
        let finalpoints = [];
        finalpoints.push(e.layer._latlngs[0][0].lng);
        finalpoints.push(e.layer._latlngs[0][0].lat);
        geometrycoord.push(finalpoints);
        finalCoords.push(geometrycoord);


        let feature = {
            type: "Feature",
            properties: {},
            geometry: {
                type: "Polygon",
                coordinates: finalCoords
            }
        }

        customPolygon.push(feature);
    } else if (e.shape === "Marker") {
        markerstoMap.push(e);
    }
});
// console.log(markerstoMap);
