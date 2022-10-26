// ======================= all the markers =======================================
var parkIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/896/896059.png',
    // shadowUrl: 'https://cdn-icons-png.flaticon.com/512/896/896059.png'
    iconSize: [20, 25], // size of the icon
    // shadowSize: [50, 64], // size of the shadow
    iconAnchor: [0, 0], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -3] // point from which the popup should open relative to the iconAnchor
});


var schoolIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2799/2799142.png',
    // shadowUrl: 'https://cdn-icons-png.flaticon.com/512/896/896059.png'
    iconSize: [20, 20], // size of the icon
    // shadowSize: [50, 64], // size of the shadow
    iconAnchor: [0, 0], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -3] // point from which the popup should open relative to the iconAnchor
});

var libraryIcon = L.icon({
    iconUrl: 'https://www.freeiconspng.com/thumbs/museum-icon/museum-icon-9.png',
    // shadowUrl: 'https://cdn-icons-png.flaticon.com/512/896/896059.png'
    iconSize: [30, 35], // size of the icon
    // shadowSize: [50, 64], // size of the shadow
    iconAnchor: [0, 0], // point of the icon which will correspond to marker's location
    // shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -3] // point from which the popup should open relative to the iconAnchor
});

var genericIcon = L.icon({
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Lol_circle.png/479px-Lol_circle.png',
    // shadowUrl: 'https://cdn-icons-png.flaticon.com/512/896/896059.png'
    iconSize: [10, 10], // size of the icon
    // shadowSize: [50, 64], // size of the shadow
    iconAnchor: [0, 0], // point of the icon which will correspond to marker's location
    // shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -3] // point from which the popup should open relative to the iconAnchor
});


$('#map-holder').hide();
//======================Loading Data============================================

let jsondata = "";
let apiUrlTwo = 'https://london-nlp-spatial.herokuapp.com/api/v1/search/collections/semi-static/items/facilities?type=all';
let apiUrl = "https://london-nlp-spatial.herokuapp.com/chargingpoints";
// let apiUrlThree = "../assets/data/dataCentroids.geojson";
async function getJson(url) {
    let response = await fetch(url);
    console.log(response);
    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
    }
    let data = await response.json();
    return data;
};


async function getLocal(url) {
    let response = await fetch(url);
    console.log(response);
    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
    }
    let data = await response.json();
    return data;
};

//=================== Map==========================================================
var map = L.map('map').setView([51.505, -0.09], 13);


var tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
// var marker = L.marker([51.49587915832181, -0.12010633935158943]).addTo(map);

// ============================= Natural Language Processing===========================
document.querySelector("[name= 'sentence']").addEventListener("keyup", async event => {
    document.getElementById('warning').style.display = 'none';
    if (!(event.which === 13))
        return;
    const request = await event.target.value;
    let doc = nlp(request);
    // console.log(doc);
    //-- make all nouns singular - [eg. show parks in westminster to show park in westminster - might be irrelevant later!]

    singleDoc = doc.nouns().toSingular();
    let requestedQuery = singleDoc.text();

    //-- creates a new sentence for analysis
    let analysis = nlp(requestedQuery);
    // console.log(analysis);
    //-- Load the initial place
    let boundary = analysis.match('(show|load|add) #Noun').terms();
    let boundarylength = Object.keys(boundary.ptrs).length;
    // console.log(boundary);

    //-- Clear the map
    let clear = analysis.match('clear the map').terms();
    let clearlength = Object.keys(clear.ptrs).length;

    let clearalt = analysis.match('remove all the layers').terms();
    let clearaltlength = Object.keys(clearalt.ptrs).length;


    //-- Checks if there is any combination of x in y
    let contain = analysis.match('#Noun in #Noun').terms();
    // console.log(contain);
    let containlength = Object.keys(contain.ptrs).length;

    let containCity = analysis.match('#Noun in #Noun').terms();
    // console.log(containCity);

    //-- Checks if there are any combination of x close to y
    let buffer = analysis.match('#Noun (near|close to) #Noun').terms();
    let bufferlength = Object.keys(buffer.ptrs).length;
    // console.log(buffer);

    let add = analysis.match('add #Noun').terms();
    let addlength = Object.keys(add.ptrs).length;
    // console.log(add);

    let color = analysis.match('color it #Noun').terms();
    let colorlenght = Object.keys(color.document).length;
    // console.log(color);

    //-- nearest x to y
    let nearest = doc.match('(closest|nearest) #Noun to #Noun').terms();
    let nearestlength = Object.keys(nearest.ptrs).length;

    // ========================== map styles ==============================//
    var style = {
        color: '#dd8855',
        fillOpacity: 0.5
    };


    if (boundarylength !== 0) {
        // document.getElementById('warning').style.display = 'none';
        let boundaryentities = boundary.nouns().out('array');
        // console.log(boundaryentities);
        $('#map-holder').show();
        map.invalidateSize();

        const areaToSearch = boundaryentities[1];
        const urlToSearch = `https://london-nlp-spatial.herokuapp.com/api/v1/search/collections/static/items/areas?name=${areaToSearch}`;
        // console.log(urlToSearch);
        resultdata = await getJson(urlToSearch);
        var polygon = L.geoJSON(resultdata, { style: { color: '#dd8855', fillOpacity: 0.5 } });
        var showingmap = polygon.bindPopup(function (layer) {
            return layer.feature.properties.officialCode;
        }).addTo(map);
        var bounds = polygon.getBounds();
        // console.log(bounds);
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
    } else if (containlength !== 0) {
        $('#map-holder').show();
        map.invalidateSize();

        let entities = contain.nouns().out('array');
        var locationToSearch = entities[1];
        const urlToSearch = `https://london-nlp-spatial.herokuapp.com/api/v1/search/collections/static/items/areas?name=${locationToSearch}`;
        // console.log(urlToSearch);
        // document.querySelector("#output").innerHTML = pastTense.location;  
        // let apiUrlTwo = `http://localhost:8080/api/collections/static/items/areas?name=${pastTense.location}`;
        // console.log(apiUrlTwo);
        neighbourhoods = await getJson(urlToSearch);
        // console.log(neighbourhoods);
        // finding = neighbourhoods.features;
        // var result = finding.filter(item => item.properties.LAD22NM.toLowerCase() === locationToSearch);
        var entityToSearch = entities[0];
        let iconForDisplay;
        if (entityToSearch === "park") {
            iconForDisplay = parkIcon;
        } else if (entityToSearch === "school") {
            iconForDisplay = schoolIcon;
        } else if (entityToSearch === "library") {
            iconForDisplay = libraryIcon;
        } else {
            iconForDisplay = genericIcon;
        }
        if (entityToSearch !== null && entityToSearch !== '') {

            // document.getElementById('warning').style.display = 'none';

            if (entityToSearch === "charger" || entityToSearch === "chargers") {
                toSearch = await getJson(apiUrl);
                // console.log(toSearch);
                // console.log(toSearch.data[2].geometry.coordinates);
                let newObject = Object.entries(toSearch).reduce((obj, item) => {
                    obj.push({
                        "coordinates": [item[1].AddressInfo.Longitude, item[1].AddressInfo.Latitude]
                    });
                    return obj;
                }, []);

                // console.log(newObject);

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
    }
    // else if (bufferlength !== 0) {
    //     // document.getElementById('warning').style.display = 'none';

    //     let entities = contain.nouns().out('array');
    //     var from = entities[0];
    //     var to = entities[1];

    //     toSearch = await getJson(apiUrlTwo);
    //     findinglist = toSearch.features;
    //     var pointresultfrom = [];
    //     var pointresultto = [];
    //     var arrayOfDistances = [];
    //     var resultfrom = findinglist.filter(item => item.properties.fclass === from);
    //     var resultto = findinglist.filter(item => item.properties.fclass === to);

    //     for (var i in resultfrom)
    //         pointresultfrom.push(resultfrom[i].geometry.coordinates);
    //     var pointfrom = turf.points(pointresultfrom);
    //     for (var i in resultto)
    //         pointresultto.push(resultto[i].geometry.coordinates);
    //     var pointto = turf.points(pointresultto);
    //     var options = { units: 'miles' };


    //     var distance = turf.distance(pointfrom, pointto, options);
    // }
    else {
        document.getElementById('warning').style.display = 'block';
        document.querySelector("#warning").innerHTML = "we are not advanced enough to process this :(";
    };

});
