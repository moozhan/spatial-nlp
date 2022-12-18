
$('#map-holder').hide();

//// function to get data from urls

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


// Setup for receiving the NLP query
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

let featurestomap = [];
let markerstoMap = [];

map.on('pm:create', e => {
    map.pm.disableDraw('Marker');

    console.log(e);
    if (e.shape === "Polygon" || e.shape === "Rectangle") {
        featurestomap.push(e);
    } else if (e.shape === "Marker") {
        markerstoMap.push(e);
    }
});
console.log(markerstoMap);

// All the NLP processing and map creation

async function mapcreation() {
    document.getElementById('warningofquery').innerHTML = "";

    let requestedquery = input.value;
    let refinedquery = requestedquery.toLowerCase();
    let doc = nlp(refinedquery);
    let test = doc.places().text();
    console.log(doc);
    //-- make all nouns singular - [eg. show parks in westminster to show park in westminster - might be irrelevant later!]
    singleDoc = doc.nouns().toSingular();
    let requestedQuery = singleDoc.text();

    //-- creates a new sentence for analysis
    let analysis = nlp(requestedQuery);
    // console.log(analysis);


    //-- Load the initial place
    let boundary = analysis.match('(show|load|add) #Noun').terms();
    let boundarylength = Object.keys(boundary.ptrs).length;

    let drawingmap = doc.match('(start|show) the map').terms();
    let drawingmaplength = Object.keys(drawingmap.ptrs).length;

    //-- Clear the map
    let clear = doc.match('clear the map').terms();
    let clearlength = Object.keys(clear.ptrs).length;
    console.log(clear);

    let clearalt = analysis.match('remove all the layers').terms();
    let clearaltlength = Object.keys(clearalt.ptrs).length;



    //-- Checks if there is any combination of x in y
    let contain = analysis.match('#Noun in #Place').terms();
    let beforeContain = contain.lookBehind('#Noun').out('array');
    let containlength = Object.keys(contain.ptrs).length;


    let containCustom = analysis.match('#Noun in my (boundary|area)').terms();
    let beforecontainCustom = containCustom.lookBehind('#Noun').out('array');
    let containCustomlength = Object.keys(containCustom.ptrs).length;


    //-- Checks if there are any combination of x close to y
    let buffer = analysis.match('#Noun near #Noun in #Place').terms();
    let beforeBuffer = contain.lookBehind('#Noun').out('array');
    let bufferlength = Object.keys(buffer.ptrs).length;

    //-- Checks if there are any combination of x close to y
    let bufferCustom = analysis.match('#Noun near #Noun in my (boundary|area)').terms();
    let beforebufferCustom = bufferCustom.lookBehind('#Noun').out('array');
    let bufferCustomlength = Object.keys(bufferCustom.ptrs).length;
    console.log(beforebufferCustom);

    //-- nearest x to y
    let nearestCustom = doc.match('(to|near) my (point|marker)').lookBehind('#Superlative').growRight('#Noun').out('array');
    theArray = [];
    myArray = [];
    for (let i = 0; i < nearestCustom.length; i++) {
        theArray = nearestCustom[i].split(" ");
        myArray.push(theArray);
    }
    myArraylength = myArray.length;


    //Turn the parts to spatial queries
    if (drawingmaplength !== 0) {

        $('#map-holder').show();
        map.invalidateSize();


    } else if (myArraylength !== 0) {

        toSearch = await getJson(apiUrlTwo);
        listToSearch = toSearch.features;
        console.log(listToSearch);

        //get the boundary for analysis


        if (markerstoMap.length !== 0) {
            let mypoint = markerstoMap[0].layer;
            let coordMyPoint = [];
            coordMyPoint.push(mypoint._latlng.lng);
            coordMyPoint.push(mypoint._latlng.lat);

            var pointofcentre = turf.point(coordMyPoint);
            var buffered = turf.buffer(pointofcentre, 1, { units: 'miles' });
            console.log(buffered);
            // L.geoJSON(buffered).addTo(map);
            var searchWithin = turf.polygon(buffered.geometry.coordinates);


            for (let j = 0; j < myArray.length; j++) {
                const entities = myArray[j][1];
                const adjective = myArray[j][0];
                if (entities === "park") {
                    iconForDisplay = parkIcon;
                } else if (entities === "school") {
                    iconForDisplay = schoolIcon;
                } else if (entities === "library") {
                    iconForDisplay = libraryIcon;
                } else if (entities === "pub") {
                    iconForDisplay = pubIcon;
                } else {
                    iconForDisplay = genericIcon;
                }

                const checking = listToSearch.filter(item => item.properties.fclass === entities);
                var pointresultTwo = [];

                for (var i in checking)
                    pointresultTwo.push(checking[i].geometry.coordinates);
                var points = turf.points(pointresultTwo);
                if (adjective === "closest" || adjective === "nearest") {
                    var ptsWithin = turf.pointsWithinPolygon(points, searchWithin);
                    let varDistances = [];
                    for (i in ptsWithin.features) {
                        var to = turf.point(ptsWithin.features[i].geometry.coordinates);
                        var options = { units: 'miles' };

                        var distance = turf.distance(pointofcentre, to, options);
                        varDistances.push(distance);
                    }
                    console.log(varDistances);
                    const min = Math.min(...varDistances);
                    var getthepoition = jQuery.inArray(min, varDistances);
                    console.log(ptsWithin.features[getthepoition]);
                    L.marker([ptsWithin.features[getthepoition].geometry.coordinates[1], ptsWithin.features[getthepoition].geometry.coordinates[0]], { icon: iconForDisplay }).addTo(map);
                } else if (adjective === "furthest") {
                    let varDistances = [];
                    if (test !== null && test !== '') {
                        const urlToSearch = `https://london-nlp-spatial.herokuapp.com/api/v1/search/collections/static/items/areas?name=${test}`;
                        neighbourhoods = await getJson(urlToSearch);
                        var polygon = L.geoJSON(neighbourhoods, { style: { color: '#ffffff', fillOpacity: 0.5 } });
                        var bounds = polygon.getBounds();
                        map.fitBounds(bounds);
                        var searchWithin = turf.multiPolygon(neighbourhoods.geometry.coordinates);
                        var ptsWithin = turf.pointsWithinPolygon(points, searchWithin);
                        for (i in ptsWithin.features) {
                            var to = turf.point(ptsWithin.features[i].geometry.coordinates);
                            var options = { units: 'miles' };

                            var distance = turf.distance(pointofcentre, to, options);
                            varDistances.push(distance);
                        }
                        const max = Math.max(...varDistances);
                        var getthepoition = jQuery.inArray(max, varDistances);
                        L.marker([ptsWithin.features[getthepoition].geometry.coordinates[1], ptsWithin.features[getthepoition].geometry.coordinates[0]], { icon: iconForDisplay }).addTo(map);
                    } else if (featurestomap.length !== 0) {
                        let geometrycoord = [];
                        let finalgeo = [];
                        for (i in featurestomap[0].layer._latlngs[0]) {
                            let coord = [];
                            coord.push(featurestomap[0].layer._latlngs[0][i].lng);
                            coord.push(featurestomap[0].layer._latlngs[0][i].lat);
                            geometrycoord.push(coord);
                        }

                        let finalpoints = [];
                        finalpoints.push(featurestomap[0].layer._latlngs[0][0].lng);
                        finalpoints.push(featurestomap[0].layer._latlngs[0][0].lat);
                        geometrycoord.push(finalpoints);
                        finalgeo.push(geometrycoord);

                        var searchWithin = turf.polygon(finalgeo);
                        var ptsWithin = turf.pointsWithinPolygon(points, searchWithin);
                        for (i in ptsWithin.features) {
                            var to = turf.point(ptsWithin.features[i].geometry.coordinates);
                            var options = { units: 'miles' };

                            var distance = turf.distance(pointofcentre, to, options);
                            varDistances.push(distance);
                        }
                        const max = Math.max(...varDistances);
                        var getthepoition = jQuery.inArray(max, varDistances);
                        L.marker([ptsWithin.features[getthepoition].geometry.coordinates[1], ptsWithin.features[getthepoition].geometry.coordinates[0]], { icon: iconForDisplay }).addTo(map);
                    } else {
                        document.getElementById('warningofquery').innerHTML = "you need to specify the boundary for finding furthest point. E.g., show the furthest school to my point within Westminster or find the furthest park in Hackney to my point. ";
                    }

                }
            }

        } else {
            document.getElementById('warningofquery').innerHTML = "There doesn't seem to be any point on the map. If you haven't start the map, enter [show the map] and add a marker. Then enter your query again.";
        }

    } else if (bufferlength !== 0) {
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
        } else if (to === "pub") {
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
    } else if (bufferCustomlength !== 0) {
        let entities = bufferCustom.nouns().toSingular().out('array');
        // console.log(entities);
        let allEntities = [];
        for (i in beforebufferCustom) {
            let clean = beforebufferCustom[i].replace(',', '');
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
        } else if (to === "pub") {
            secondicon = pubIcon;
        } else {
            secondicon = genericIcon;
        }

        let geometrycoord = [];
        let finalgeo = [];
        for (i in featurestomap[0].layer._latlngs[0]) {
            let coord = [];
            coord.push(featurestomap[0].layer._latlngs[0][i].lng);
            coord.push(featurestomap[0].layer._latlngs[0][i].lat);
            geometrycoord.push(coord);
        }

        let finalpoints = [];
        finalpoints.push(featurestomap[0].layer._latlngs[0][0].lng);
        finalpoints.push(featurestomap[0].layer._latlngs[0][0].lat);
        geometrycoord.push(finalpoints);
        finalgeo.push(geometrycoord);
        console.log(finalgeo);

        var searchWithin = turf.polygon(finalgeo);

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

                for (var i in ptsWithin.features)
                    L.marker([ptsWithin.features[i].geometry.coordinates[1], ptsWithin.features[i].geometry.coordinates[0]], { icon: iconForDisplay })
                        // .bindPopup(allentities[k])
                        .addTo(map);
            }

        }
    } else if (containCustomlength !== 0) {

        $('#map-holder').show();
        map.invalidateSize();

        let allentities = [];
        let getnoun = containCustom.nouns().out('array');
        let entitiestosearch = getnoun[0];

        for (i in beforecontainCustom) {
            let clean = beforecontainCustom[i].replace(',', '');
            allentities.push(clean);
        }
        allentities.push(entitiestosearch);
        let geometrycoord = [];
        let finalgeo = [];
        for (i in featurestomap[0].layer._latlngs[0]) {
            let coord = [];
            coord.push(featurestomap[0].layer._latlngs[0][i].lng);
            coord.push(featurestomap[0].layer._latlngs[0][i].lat);
            geometrycoord.push(coord);
        }

        let finalpoints = [];
        finalpoints.push(featurestomap[0].layer._latlngs[0][0].lng);
        finalpoints.push(featurestomap[0].layer._latlngs[0][0].lat);
        geometrycoord.push(finalpoints);
        finalgeo.push(geometrycoord);
        console.log(finalgeo);


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

                var searchWithin = turf.polygon(finalgeo);
                var ptsWithin = turf.pointsWithinPolygon(points, searchWithin);

                for (var i in ptsWithin.features)
                    L.marker([ptsWithin.features[i].geometry.coordinates[1], ptsWithin.features[i].geometry.coordinates[0]], { icon: iconForDisplay })
                        .addTo(map);
            }

        }
    }

    else if (boundarylength !== 0) {

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
