// All setup for the map

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
