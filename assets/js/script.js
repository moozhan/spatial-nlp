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

$('#map-holder').hide();



//// URLS to pass to API & Fetch Function

let jsondata = "";
let apiUrlTwo = 'https://london-nlp-spatial.herokuapp.com/api/v1/search/collections/semi-static/items/facilities?type=all';
let apiUrl = "https://london-nlp-spatial.herokuapp.com/chargingpoints";
let namesURL = "https://london-nlp-spatial.herokuapp.com/api/v1/search/collections/semi-static/items/names?type=all";



async function getJson(url) {
    let response = await fetch(url);
    console.log(response);
    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
    }
    let data = await response.json();
    return data;
};

//// Get all the names and extend the NLP to identify them as place name
async function getit() {
    resultName = await getJson(namesURL);
    console.log(resultName);
    nlp.plugin({
        words: resultName
    });
}
getit();

// Setup for getting the NLP query

const input = document.querySelector("[name= 'sentence']");
var mic = document.getElementById('mic');
var speak = document.getElementById('speak');
var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
var recognition = new SpeechRecognition();


speak.addEventListener('click', function () {
    recognition.start();
    mic.className = "fa-solid fa-microphone";
});
recognition.onresult = async function (e) {
    recognition.stop();
    mic.className = "fa-solid fa-microphone-slash";
    var transcript = e.results[0][0].transcript;
    input.value = transcript;
    mapcreation();
};

document.querySelector("[name= 'sentence']").addEventListener("keyup", async event => {
    document.getElementById('warning').style.display = 'none';
    if (!(event.which === 13))
        return;
    const phrase = await event.target.value;
    input.value = phrase;
    mapcreation();
});


// All the NLP processing and map creation

async function mapcreation() {
    let requestedquery = input.value;
    let refinedquery = requestedquery.toLowerCase();
    let doc = nlp(refinedquery);
    let test = doc.places().text();

    //-- make all nouns singular - [eg. show parks in westminster to show park in westminster - might be irrelevant later!]
    singleDoc = doc.nouns().toSingular();
    let requestedQuery = singleDoc.text();

    //-- creates a new sentence for analysis
    let analysis = nlp(requestedQuery);
    console.log(analysis);


    //-- Load the initial place
    let boundary = analysis.match('(show|load|add) #Noun').terms();
    let boundarylength = Object.keys(boundary.ptrs).length;
    // console.log(boundary);
    console.log(boundary);

    //-- Clear the map
    let clear = analysis.match('clear the map').terms();
    let clearlength = Object.keys(clear.ptrs).length;

    let clearalt = analysis.match('remove all the layers').terms();
    let clearaltlength = Object.keys(clearalt.ptrs).length;


    //-- Checks if there is any combination of x in y
    let contain = analysis.match('#Noun in #Place').terms();
    let containlength = Object.keys(contain.ptrs).length;

    //-- Checks if there are any combination of x close to y
    let buffer = analysis.match('#Noun near #Noun in (#Noun|#Verb)').terms();
    let bufferlength = Object.keys(buffer.ptrs).length;
    console.log(buffer);

    let add = analysis.match('add #Noun').terms();
    let addlength = Object.keys(add.ptrs).length;

    let color = analysis.match('color it #Noun').terms();
    let colorlenght = Object.keys(color.document).length;

    //-- nearest x to y
    let nearest = doc.match('(closest|nearest) #Noun to #Noun').terms();
    let nearestlength = Object.keys(nearest.ptrs).length;

    if (bufferlength !== 0) {
        $('#map-holder').show();
        map.invalidateSize();

        let entities = buffer.nouns().toSingular().out('array');
        var from = entities[0];
        var to = entities[1];

        if (from === "park") {
            iconForDisplay = parkIcon;
        } else if (from === "school") {
            iconForDisplay = schoolIcon;
        } else if (from === "library") {
            iconForDisplay = libraryIcon;
        } else if (from === "pub") {
            iconForDisplay = pubIcon;
        } else {
            iconForDisplay = genericIcon;
        }

        if (to === "park") {
            secondicon = parkIcon;
        } else if (to === "school") {
            secondicon = schoolIcon;
        } else if (to === "library") {
            secondicon = libraryIcon;
        } else if (from === "pub") {
            secondicon = pubIcon;
        } else {
            secondicon = genericIcon;
        }

        toSearch = await getJson(apiUrlTwo);
        findinglist = toSearch.features;
        var pointresultfrom = [];
        var pointresultto = [];
        var resultfrom = findinglist.filter(item => item.properties.fclass === from);
        var resultto = findinglist.filter(item => item.properties.fclass === to);

        for (var i in resultfrom)
            pointresultfrom.push(resultfrom[i].geometry.coordinates);
        var pointfrom = turf.points(pointresultfrom);

        for (var i in resultto)
            pointresultto.push(resultto[i].geometry.coordinates);
        var pointto = turf.points(pointresultto);

        const urlToSearch = `https://london-nlp-spatial.herokuapp.com/api/v1/search/collections/static/items/areas?name=${test}`;
        neighbourhoods = await getJson(urlToSearch);
        var polygon = L.geoJSON(neighbourhoods, { style: { color: '#dd8855', fillOpacity: 0.5 } });
        var bounds = polygon.getBounds();
        map.fitBounds(bounds);

        var searchWithin = turf.multiPolygon(neighbourhoods.geometry.coordinates);
        var fromptsWithin = turf.pointsWithinPolygon(pointfrom, searchWithin);
        var toptsWithin = turf.pointsWithinPolygon(pointto, searchWithin);

        var pointsforbuffer = [];
        for (var i in toptsWithin.features)
            pointsforbuffer.push(toptsWithin.features[i].geometry.coordinates);
        var pointtobuffer = turf.points(pointsforbuffer);

        var pointsforsearch = [];
        for (var i in fromptsWithin.features) {
            pointsforsearch.push(fromptsWithin.features[i].geometry.coordinates);
            // L.marker([fromptsWithin.features[i].geometry.coordinates[1], fromptsWithin.features[i].geometry.coordinates[0]])
            //     .addTo(map);
        };
        var pointtobesearchedfrom = turf.points(pointsforsearch);


        var bufferpolygone = [];
        for (var i in toptsWithin) {
            bufferpolygone.push(turf.buffer(pointtobuffer, 0.1, { units: 'miles' }));
        };

        var foundpoints = [];
        for (var i in bufferpolygone[0].features) {
            var polygonewithin = turf.polygon(bufferpolygone[0].features[i].geometry.coordinates);
            findpoints = turf.pointsWithinPolygon(pointtobesearchedfrom, polygonewithin);
            foundpoints.push(findpoints);
            L.geoJSON(bufferpolygone[0].features[i], { style: { color: '#ffffff', fillOpacity: 0.5, stroke: "#555555" } }).addTo(map);
        };

        for (var i in foundpoints) {
            if (foundpoints[i].features.length !== 0) {
                for (var j in foundpoints[i].features) {
                    L.marker([foundpoints[i].features[j].geometry.coordinates[1], foundpoints[i].features[j].geometry.coordinates[0]], { icon: iconForDisplay })
                        .addTo(map);
                }
            }

        }

    } else if (containlength !== 0) {
        $('#map-holder').show();
        map.invalidateSize();

        let entities = contain.nouns().out('array');
        const urlToSearch = `https://london-nlp-spatial.herokuapp.com/api/v1/search/collections/static/items/areas?name=${test}`;

        neighbourhoods = await getJson(urlToSearch);
        var polygon = L.geoJSON(neighbourhoods, { style: { color: '#ffffff', fillOpacity: 0.5 } });
        var bounds = polygon.getBounds();
        map.fitBounds(bounds);

        var entityToSearch = entities[0];
        let iconForDisplay;
        if (entityToSearch === "park") {
            iconForDisplay = parkIcon;
        } else if (entityToSearch === "school") {
            iconForDisplay = schoolIcon;
        } else if (entityToSearch === "library") {
            iconForDisplay = libraryIcon;
        } else if (entityToSearch === "pub") {
            iconForDisplay = pubIcon;
        } else {
            iconForDisplay = genericIcon;
        }
        if (entityToSearch !== null && entityToSearch !== '') {

            if (entityToSearch === "charger" || entityToSearch === "chargers") {
                toSearch = await getJson(apiUrl);
                let newObject = Object.entries(toSearch).reduce((obj, item) => {
                    obj.push({
                        "coordinates": [item[1].AddressInfo.Longitude, item[1].AddressInfo.Latitude]
                    });
                    return obj;
                }, []);

                var pointresult = [];
                for (var i in newObject)
                    pointresult.push(newObject[i].coordinates);
                var points = turf.points(pointresult);

            }
            else {
                toSearch = await getJson(apiUrlTwo);
                findingTwo = toSearch.features;
                var resultTwo = findingTwo.filter(item => item.properties.fclass === entityToSearch);
                var pointresultTwo = [];
                for (var i in resultTwo)
                    pointresultTwo.push(resultTwo[i].geometry.coordinates);
                var points = turf.points(pointresultTwo);

            }

            var searchWithin = turf.multiPolygon(neighbourhoods.geometry.coordinates);
            var ptsWithin = turf.pointsWithinPolygon(points, searchWithin);
            // console.log(ptsWithin);
            for (var i in ptsWithin.features)
                L.marker([ptsWithin.features[i].geometry.coordinates[1], ptsWithin.features[i].geometry.coordinates[0]], { icon: iconForDisplay })
                    .bindPopup("Placeholder for any information necessary")
                    .addTo(map);
        }
    } else if (boundarylength !== 0) {

        $('#map-holder').show();
        map.invalidateSize();

        // const areaToSearch = boundaryentities[1];
        const areaToSearch = test;
        const urlToSearch = `https://london-nlp-spatial.herokuapp.com/api/v1/search/collections/static/items/areas?name=${areaToSearch}`;
        console.log(urlToSearch);
        resultdata = await getJson(urlToSearch);
        var polygon = L.geoJSON(resultdata, { style: { color: '#dd8855', fillOpacity: 0.3 } });
        var showingmap = polygon.bindPopup(function (layer) {
            return layer.feature.properties.officialCode;
        }).addTo(map);
        var bounds = polygon.getBounds();
        map.fitBounds(bounds);

    } else if (clearaltlength !== 0) {
        map.eachLayer(function (layer) {
            map.removeLayer(layer);
        });
        map.addLayer(tile);
    } else if (clearlength !== 0) {
        map.eachLayer(function (layer) {
            map.removeLayer(layer);
        });
        map.addLayer(tile);
    } else {
        document.getElementById('warning').style.display = 'block';
    };

};
