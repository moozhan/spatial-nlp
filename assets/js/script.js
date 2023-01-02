$('#map-holder').hide();
getit();


// ------ Setup for receiving the NLP query from the input bar and voice recognition ------ //

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
    analyzethetext();
};

document.querySelector("[name= 'sentence']").addEventListener("keyup", async event => {
    document.getElementById('warning').style.display = 'none';
    if (!(event.which === 13))
        return;
    const phrase = await event.target.value;
    input.value = phrase;
    analyzethetext();
});


// ---------------------- All the NLP functions -----------------------------//

function checkProximity(p) {
    let near = p.match('near #Noun').terms();
    let target = near.nouns().toSingular().out('array');
    let test = p.places().out('array');
    let places;
    if (test.lenght !== 0) {
        places = test[0];
    } else {
        places = null;
    }
    let beforeProxim = near.lookBehind('#Noun').nouns().toSingular().out('array');
    if (Object.keys(near.ptrs).length !== 0) {
        if (beforeProxim.length !== 0) {
            let result = {
                message: "successful",
                value: {
                    from: target[0],
                    entities: beforeProxim,
                    area: places
                }
            };
            return result;
        } else {
            let result = {
                message: "The entity to look for is not specified",
                value: 0
            }
            return result;
        }
    } else {
        let result = {
            message: "sentence does not contain any proximity combination",
            value: 0
        }
        return result;
    }
}


function checkCustomProximity(p) {
    let customBuffer = p.match('near #Noun in my (boundary|area)').terms();
    let target = customBuffer.nouns().toSingular().out('array');
    let beforecustomBuffer = customBuffer.lookBehind('#Noun').nouns().toSingular().out('array');
    if (Object.keys(customBuffer.ptrs).length !== 0) {
        if (beforecustomBuffer.length !== 0) {
            let result = {
                message: "successful",
                value: {
                    from: target[0],
                    entities: beforecustomBuffer,
                    area: "my boundary"
                }
            };
            return result;
        } else {
            let result = {
                message: "no entity",
                value: 0
            }
            return result;
        }
    } else {
        let result = {
            message: "sentence does not contain any custom proximity combination",
            value: 0
        }
        return result;
    }
}



function checkContain(p) {
    let contain = p.match('in #Place').terms();
    let place = contain.places().text();
    let beforeContain = contain.lookBehind('#Noun').nouns().toSingular().out('array');
    if (Object.keys(contain.ptrs).length !== 0) {
        if (beforeContain.length !== 0) {
            let result = {
                message: "successful",
                value: {
                    entities: beforeContain,
                    area: place
                }
            }
            return result;
        } else {
            let result = {
                message: "no entity",
                value: 0
            }
            return result;
        }
    } else {
        let result = {
            message: "does not contain any contain phrase",
            value: 0
        }
        return result;
    }
}

function checkContainCustom(p) {
    let containCustom = p.match('in my (boundary|boundaries|area|areas)').terms();
    let beforecontainCustom = containCustom.lookBehind('#Noun').nouns().toSingular().out('array');
    if (Object.keys(containCustom.ptrs).length !== 0) {
        if (beforecontainCustom.length !== 0) {
            let result = {
                message: "successful",
                value: {
                    entities: beforecontainCustom,
                    area: "my boundary"
                }
            }
            return result;
        } else {
            let result = {
                message: "no entity",
                value: 0
            }
            return result;
        }
    } else {
        let result = {
            message: "The phrase doesn't include custom contain",
            value: 0
        }
        return result;
    }
}

function checkClean(p) {
    let clear = p.match('clear the map').terms();
    let clearalt = p.match('clear all the layers').terms();
    let clearaltother = p.match('clear them up').terms();

    if (Object.keys(clear.ptrs).length !== 0 || Object.keys(clearalt.ptrs).length !== 0 || Object.keys(clearaltother.ptrs).length !== 0) {
        let result = {
            message: "clear the map",
            value: 1
        }
        return result;
    } else {
        let result = {
            message: "The phrase dones't include any cleaning request",
            value: 0
        }
        return result;
    }
}

function checkLoadBoundary(p) {
    let loadBoundary = p.match('(show|load|add)').terms();
    let boundaries = loadBoundary.lookAhead('#Place').out('array');
    if (Object.keys(loadBoundary.ptrs).length !== 0) {
        if (boundaries.length !== 0) {
            let result = {
                message: "successful",
                value: {
                    boundaries: boundaries
                }
            }
            return result;
        } else {
            let result = {
                message: "no entity",
                value: 0
            }
            return result;
        }
    } else {
        let result = {
            message: "The phrase doesn't include any loading request",
            value: 0
        }
        return result;
    }
}

function checkLoadFeatures(p) {
    let loadFeatures = p.match('(/show(ing|ed)/|/load(ing|ed)/|/add(ing|ed)/)').terms();
    let features = loadFeatures.lookAhead('#Noun').out('array');
    if (Object.keys(loadFeatures.ptrs).length !== 0) {
        if (features.length !== 0) {
            let result = {
                features: features
            }
            return result;
        } else {
            console.log("The entity/boundary to look for is not specified");
        }
    } else {
        console.log("The phrase doesn't include any loading request");
    }
}


function checkLoadMap(p) {
    let loadMap = p.match('(start|show) the map').terms();
    if (Object.keys(loadMap.ptrs).length !== 0) {
        let result = {
            message: "load the map",
            value: 1
        };
        return result;
    } else {
        let result = {
            message: "The phrase dones't include any map loading request",
            value: 0
        }
        return result;
    }
}


function checkSuperlativeTo(p) {
    let nearestCustom = p.match('(to|near) my (point|marker)').lookBehind('#Superlative').growRight('#Noun').out('array');
    if (Object.keys(nearestCustom.ptrs).length !== 0) {
        theArray = [];
        myArray = [];
        for (let i = 0; i < nearestCustom.length; i++) {
            theArray = nearestCustom[i].split(" ");
            myArray.push(theArray);
        }
        let result = {
            message: "successful",
            value: myArray
        };
        return result;
    } else {
        let result = {
            message: "The phrase dones't include any superlative to combination",
            value: 0
        }
        return result;
    }
}


function findPlaces(p) {
    let test = p.places().out('array');
    if (Object.keys(test.ptrs).length !== 0) {
        let result = test;
        return result;
    } else {
        let message = "The phrase dones't include any place";
        return message;
    }
}


// ---------------------- All the Spatial Analysis Functions -----------------------------//

async function getPlaceBoundary(x) {
    const geoBoundary = `https://london-nlp-spatial.herokuapp.com/api/v1/search/collections/static/items/areas?name=${x}`;
    place = await getJson(geoBoundary);
    var polygon = L.geoJSON(place, { style: { color: '#dd8855', fillOpacity: 0.5 } });
    var bounds = polygon.getBounds();
    map.fitBounds(bounds);
    return place;
}

async function showBoundary(x) {
    $('#map-holder').show();
    map.invalidateSize();
    resultdata = await getPlaceBoundary(x);
    var polygon = L.geoJSON(resultdata, { style: { color: '#dd8855', fillOpacity: 0.3 } });
    var showingmap = polygon.bindPopup(function (layer) {
        return layer.feature.properties.officialCode;
    }).addTo(map);
    var bounds = polygon.getBounds();
    map.fitBounds(bounds);
}

function showMultiplePoints(points, entityIcon) {
    if (entityIcon === "park") {
        iconForDisplay = parkIcon;
    } else if (entityIcon === "school") {
        iconForDisplay = schoolIcon;
    } else if (entityIcon === "library") {
        iconForDisplay = libraryIcon;
    } else if (entityIcon === "pub") {
        iconForDisplay = pubIcon;
    } else {
        iconForDisplay = genericIcon;
    }
    for (var i in points.features)
        L.marker([points.features[i].geometry.coordinates[1], points.features[i].geometry.coordinates[0]], { icon: iconForDisplay })
            .addTo(map);
}

function showSinglePoint(point, entityIcon) {
    if (entityIcon === "park") {
        iconForDisplay = parkIcon;
    } else if (entityIcon === "school") {
        iconForDisplay = schoolIcon;
    } else if (entityIcon === "library") {
        iconForDisplay = libraryIcon;
    } else if (entityIcon === "pub") {
        iconForDisplay = pubIcon;
    } else {
        iconForDisplay = genericIcon;
    }
    L.marker([point.geometry.coordinates[1], point.geometry.coordinates[0]], { icon: iconForDisplay })
        .addTo(map);
}

async function getFeature(entity) {
    toSearch = await getJson(apiUrlTwo);
    findingTwo = toSearch.features;
    var result = findingTwo.filter(item => item.properties.fclass === entity);
    if (result.lenght !== 0) {
        return result;
    } else {
        let response = {
            message: "couldn't find the feature",
            value: 0
        }
        return response;
    }
};

async function getMultipleFeatures(entityArray) {
    toSearch = await getJson(apiUrlTwo);
    findingTwo = toSearch.features;
    allresults = [];
    for (i in entityArray) {
        var result = findingTwo.filter(item => item.properties.fclass === entityArray[i]);
        for (j in result)
            allresults.push(result[j]);
    }
    if (allresults.lenght !== 0) {
        return allresults;
    } else {
        let response = {
            message: "couldn't find the feature",
            value: 0
        }
        return response;
    }
};

async function findFeaturesWithin(feature, area) {
    let features = await getFeature(feature);
    let withinArea = await getPlaceBoundary(area);
    var pointresultTwo = [];
    for (var i in features)
        pointresultTwo.push(features[i].geometry.coordinates);
    var points = turf.points(pointresultTwo);
    var ptsWithin = turf.pointsWithinPolygon(points, withinArea);
    return ptsWithin;
}

async function findFeaturesWithinCustom(feature, customArea) {
    let features = await getFeature(feature);
    var pointresultTwo = [];
    for (var i in features)
        pointresultTwo.push(features[i].geometry.coordinates);
    var points = turf.points(pointresultTwo);
    var ptsWithin = turf.pointsWithinPolygon(points, customArea);
    return ptsWithin;
}


async function findMultiFeaturesWithin(featureArray, area) {
    let features = await getMultipleFeatures(featureArray);
    let withinArea = await getPlaceBoundary(area);
    var pointresultTwo = [];
    for (i in features) {
        pointresultTwo.push(features[i].geometry.coordinates);
    }
    var points = turf.points(pointresultTwo, { properties: { entity: "blue" } });
    var ptsWithin = turf.pointsWithinPolygon(points, withinArea);
    return ptsWithin;
}

// --- finding proximity function as well


// ------------------------- Visualizing the outcome --------------------------------------//
async function analyzethetext() {
    let requestedquery = input.value;
    let cleaned = requestedquery.replace(',', '').toLowerCase();;
    let doc = nlp(cleaned);
    let sentences = doc.fullSentences().out('array');
    for (i in sentences) {
        let analysis = nlp(sentences[i]);

        let firstcheck = checkLoadMap(analysis);
        if (firstcheck.value !== 0) {
            $('#map-holder').show();
            map.invalidateSize();
        } else {
            let customProximity = checkCustomProximity(analysis);
            if (customProximity.value !== 0) {
                if (customProximity.value !== 0) {
                    var bufferpolygons = [];
                    $('#map-holder').show();
                    map.invalidateSize();
                    let baseFeatures = await findFeaturesWithinCustom(customProximity.value.from, customPolygon[0]);
                    for (var i in baseFeatures) {
                        bufferpolygons.push(turf.buffer(baseFeatures, 0.1, { units: 'miles' }));
                    };
                } else {
                    console.log("we can't seem to find the place to look for entities");
                };
                for (var i in bufferpolygons[0].features) {
                    L.geoJSON(bufferpolygons[0].features[i], { style: { color: '#ffffff', fillOpacity: 0.1, stroke: "#555555" } }).addTo(map);
                };
                let entitiestolook = customProximity.value.entities;
                for (i in entitiestolook) {
                    let finalpoints = [];
                    let results = await findFeaturesWithinCustom(entitiestolook[i], customPolygon[0]);
                    for (j in bufferpolygons[0].features) {
                        findpoints = turf.pointsWithinPolygon(results, bufferpolygons[0].features[j]);
                        if (findpoints.features.length !== 0) {
                            for (r in findpoints.features) {
                                finalpoints.push(findpoints.features[r]);
                            }
                        }
                    }
                    for (v in finalpoints) {
                        showSinglePoint(finalpoints[v], entitiestolook[i]);
                    }
                    console.log(finalpoints);
                }
            } else {
                let proximityResult = checkProximity(analysis);
                if (proximityResult.value !== 0) {
                    var bufferpolygons = [];
                    if (proximityResult.value.area !== null) {
                        $('#map-holder').show();
                        map.invalidateSize();
                        let baseFeatures = await findFeaturesWithin(proximityResult.value.from, proximityResult.value.area);
                        for (var i in baseFeatures) {
                            bufferpolygons.push(turf.buffer(baseFeatures, 0.1, { units: 'miles' }));
                        };
                    } else {
                        console.log("we can't seem to find the place to look for entities");
                    };
                    for (var i in bufferpolygons[0].features) {
                        L.geoJSON(bufferpolygons[0].features[i], { style: { color: '#ffffff', fillOpacity: 0.1, stroke: "#555555" } }).addTo(map);
                    };
                    let entitiestolook = proximityResult.value.entities;
                    for (i in entitiestolook) {
                        let finalpoints = [];
                        let results = await findFeaturesWithin(entitiestolook[i], proximityResult.value.area);
                        for (j in bufferpolygons[0].features) {
                            findpoints = turf.pointsWithinPolygon(results, bufferpolygons[0].features[j]);
                            if (findpoints.features.length !== 0) {
                                for (r in findpoints.features) {
                                    finalpoints.push(findpoints.features[r]);
                                }
                            }
                        }
                        for (v in finalpoints) {
                            showSinglePoint(finalpoints[v], entitiestolook[i]);
                        }
                    }
                } else {
                    let customcontainr = checkContainCustom(analysis);
                    if (customcontainr.value !== 0) {
                        $('#map-holder').show();
                        map.invalidateSize();
                        for (i in customcontainr.value.entities) {
                            for (j in customPolygon) {
                                let contresults = await findFeaturesWithinCustom(customcontainr.value.entities[i], customPolygon[j]);
                                showMultiplePoints(contresults, customcontainr.value.entities[i]);
                            }
                        }
                    } else {
                        let containResult = checkContain(analysis);
                        if (containResult.value !== 0) {
                            $('#map-holder').show();
                            map.invalidateSize();
                            // let constResults = await findMultiFeaturesWithin(containResult.value.entities, containResult.value.area);
                            for (i in containResult.value.entities) {
                                let contresults = await findFeaturesWithin(containResult.value.entities[i], containResult.value.area);
                                showMultiplePoints(contresults, containResult.value.entities[i]);
                            }
                        }
                        else {
                            let loadMap = checkLoadBoundary(analysis);
                            if (loadMap.value !== 0) {
                                for (i in loadMap.value.boundaries) {
                                    showBoundary(loadMap.value.boundaries[i]);
                                }
                            }
                            else {
                                let clean = checkClean(analysis);
                                if (clean.value !== 0) {
                                    map.eachLayer(function (layer) {
                                        map.removeLayer(layer);
                                    });
                                    map.addLayer(tile);
                                    featurestomap = [];
                                    markerstoMap = [];

                                }
                                else {
                                    console.log("cannot match it with anything");
                                }

                            }
                        }
                    }

                }
            }
        };
    }
};
