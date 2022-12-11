


$('#map-holder').hide();

//// URLS to pass to API & Fetch Function

let jsondata = "";
let apiUrlTwo = 'https://london-nlp-spatial.herokuapp.com/api/v1/search/collections/semi-static/items/facilities?type=all';
let apiUrl = "https://london-nlp-spatial.herokuapp.com/chargingpoints";
let namesURL = "https://london-nlp-spatial.herokuapp.com/api/v1/search/collections/semi-static/items/names?type=all";



async function getJson(url) {
    let response = await fetch(url);
    // console.log(response);
    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
    }
    let data = await response.json();
    return data;
};

//// Get all the names and extend the NLP to identify them as place name
async function getit() {
    resultName = await getJson(namesURL);
    // console.log(resultName);
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
    // console.log(analysis);


    //-- Load the initial place
    let boundary = analysis.match('(show|load|add) #Noun').terms();
    let boundarylength = Object.keys(boundary.ptrs).length;
    // console.log(boundary);
    // console.log(boundary);

    //-- Clear the map
    let clear = analysis.match('clear the map').terms();
    let clearlength = Object.keys(clear.ptrs).length;

    let clearalt = analysis.match('remove all the layers').terms();
    let clearaltlength = Object.keys(clearalt.ptrs).length;


    //-- Checks if there is any combination of x in y
    let contain = analysis.match('#Noun in #Place').terms();
    let beforeContain = contain.lookBehind('#Noun').out('array');
    let containlength = Object.keys(contain.ptrs).length;

    //-- Checks if there are any combination of x close to y
    let buffer = analysis.match('#Noun near #Noun in (#Noun|#Verb)').terms();
    let beforeBuffer = contain.lookBehind('#Noun').out('array');
    let bufferlength = Object.keys(buffer.ptrs).length;
    // console.log(beforeBuffer);


    // let farness = analysis.match('#Noun far from #Noun in (#Noun|#Verb)').terms();
    // let farnesslength = Object.keys(farness.ptrs).length;
    // console.log(farness);

    // let customdist = analysis.match('#Noun #Value #Unit (of|from) #Noun').terms();
    // let customdistlength = Object.keys(customdist.ptrs).length;
    // console.log(customdist);


    let add = analysis.match('add #Noun').terms();
    let addlength = Object.keys(add.ptrs).length;

    //-- nearest x to y
    let nearest = doc.match('(closest|nearest) #Noun to #Noun').terms();
    let nearestlength = Object.keys(nearest.ptrs).length;

    if (bufferlength !== 0) {
        $('#map-holder').show();
        map.invalidateSize();

        let entities = buffer.nouns().toSingular().out('array');
        // console.log(entities);
        let allEntities = [];
        for (i in beforeBuffer) {
            let clean = beforeBuffer[i].replace(',', '');
            allEntities.push(clean);
        }
        allEntities.push(entities[0]);

        var to = entities[1];

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


        const urlToSearch = `https://london-nlp-spatial.herokuapp.com/api/v1/search/collections/static/items/areas?name=${test}`;
        neighbourhoods = await getJson(urlToSearch);
        var polygon = L.geoJSON(neighbourhoods, { style: { color: '#dd8855', fillOpacity: 0.5 } });
        var bounds = polygon.getBounds();
        map.fitBounds(bounds);
        var searchWithin = turf.multiPolygon(neighbourhoods.geometry.coordinates);

        var pointresultto = [];

        toSearch = await getJson(apiUrlTwo);
        findinglist = toSearch.features;



        var resultto = findinglist.filter(item => item.properties.fclass === to);
        for (var i in resultto)
            pointresultto.push(resultto[i].geometry.coordinates);
        var pointto = turf.points(pointresultto);
        var toptsWithin = turf.pointsWithinPolygon(pointto, searchWithin);

        var pointsforbuffer = [];
        for (var i in toptsWithin.features)
            pointsforbuffer.push(toptsWithin.features[i].geometry.coordinates);
        var pointtobuffer = turf.points(pointsforbuffer);
        var bufferpolygone = [];
        for (var i in toptsWithin) {
            bufferpolygone.push(turf.buffer(pointtobuffer, 0.1, { units: 'miles' }));
        };
        for (var i in bufferpolygone[0].features) {
            L.geoJSON(bufferpolygone[0].features[i], { style: { color: '#ffffff', fillOpacity: 0.1, stroke: "#555555" } }).addTo(map);
        };

        for (i in allEntities) {
            if (allEntities[i] === "park") {
                iconForDisplay = parkIcon;
            } else if (allEntities[i] === "school") {
                iconForDisplay = schoolIcon;
            } else if (allEntities[i] === "library") {
                iconForDisplay = libraryIcon;
            } else if (allEntities[i] === "pub") {
                iconForDisplay = pubIcon;
            } else {
                iconForDisplay = genericIcon;
            }
            var pointresultfrom = [];

            var resultfrom = findinglist.filter(item => item.properties.fclass === allEntities[i]);
            for (var i in resultfrom)
                pointresultfrom.push(resultfrom[i].geometry.coordinates);
            var pointfrom = turf.points(pointresultfrom);

            var fromptsWithin = turf.pointsWithinPolygon(pointfrom, searchWithin);

            var pointsforsearch = [];
            for (var i in fromptsWithin.features) {
                pointsforsearch.push(fromptsWithin.features[i].geometry.coordinates);
                // L.marker([fromptsWithin.features[i].geometry.coordinates[1], fromptsWithin.features[i].geometry.coordinates[0]])
                //     .addTo(map);
            };
            var pointtobesearchedfrom = turf.points(pointsforsearch);

            var foundpoints = [];
            for (var i in bufferpolygone[0].features) {
                var polygonewithin = turf.polygon(bufferpolygone[0].features[i].geometry.coordinates);
                findpoints = turf.pointsWithinPolygon(pointtobesearchedfrom, polygonewithin);
                foundpoints.push(findpoints);
            };

            for (var i in foundpoints) {
                if (foundpoints[i].features.length !== 0) {
                    for (var j in foundpoints[i].features) {
                        L.marker([foundpoints[i].features[j].geometry.coordinates[1], foundpoints[i].features[j].geometry.coordinates[0]], { icon: iconForDisplay })
                            .addTo(map);
                    }
                }

            }
        }
    } else if (containlength !== 0) {
        $('#map-holder').show();
        map.invalidateSize();

        let entities = contain.nouns().out('array');
        let allentities = [];
        const urlToSearch = `https://london-nlp-spatial.herokuapp.com/api/v1/search/collections/static/items/areas?name=${test}`;

        neighbourhoods = await getJson(urlToSearch);
        var polygon = L.geoJSON(neighbourhoods, { style: { color: '#ffffff', fillOpacity: 0.5 } });
        var bounds = polygon.getBounds();
        map.fitBounds(bounds);
        for (i in beforeContain) {
            let clean = beforeContain[i].replace(',', '');
            allentities.push(clean);
        }
        allentities.push(entities[0]);
        // console.log(allentities);

        let iconForDisplay;

        if (allentities !== null && allentities !== '') {

            toSearch = await getJson(apiUrlTwo);
            findingTwo = toSearch.features;
            for (k = 0; k < allentities.length; k++) {
                if (allentities[k] === "park") {
                    iconForDisplay = parkIcon;
                } else if (allentities[k] === "school") {
                    iconForDisplay = schoolIcon;
                } else if (allentities[k] === "library") {
                    iconForDisplay = libraryIcon;
                } else if (allentities[k] === "pub") {
                    iconForDisplay = pubIcon;
                } else {
                    iconForDisplay = genericIcon;
                }
                var checking = findingTwo.filter(item => item.properties.fclass === allentities[k]);
                var pointresultTwo = [];
                for (var i in checking)
                    pointresultTwo.push(checking[i].geometry.coordinates);
                var points = turf.points(pointresultTwo);


                var searchWithin = turf.multiPolygon(neighbourhoods.geometry.coordinates);
                var ptsWithin = turf.pointsWithinPolygon(points, searchWithin);
                // console.log(ptsWithin);

                // console.log(ptsWithin);
                for (var i in ptsWithin.features)
                    L.marker([ptsWithin.features[i].geometry.coordinates[1], ptsWithin.features[i].geometry.coordinates[0]], { icon: iconForDisplay })
                        // .bindPopup(allentities[k])
                        .addTo(map);
            }

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
