const thisForm = document.getElementById('myForm');

// const data = new URLSearchParams();
// for (const pai of new FormData(thisForm)) {
//     data.append(pair[0], pair[1]);
// }
thisForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(thisForm).entries();
    const response = await fetch('https://nlp-spatial-server.azurewebsites.net/api/v1/collections/functions/items/geo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(formData))
    });

    const result = await response.json();
    console.log(result);
    const unique = [... new Set(result.result.places)]
    console.log(unique);
    tbl = document.createElement('table');
    tbl.style.width = '70%';
    tbl.style.margin = '2%';
    tableSpatial = document.createElement('table');
    tableSpatial.style.width = '70%';
    tableSpatial.style.margin = '2%';
    tableUnique = document.createElement('table');
    tableUnique.style.width = '70%';
    tableUnique.style.margin = '2%';
    // tbl.style.border = '1px solid black';

    allplacesName = [];
    for (i in result.result.places) {
        allplacesName.push(result.result.places[i].properties.name);
    }

    console.log(allplacesName);
    let outputArray = Array.from(new Set(allplacesName));
    console.log(outputArray)

    for (i in outputArray) {
        const trThree = document.createElement('tr');
        trThree.style.border = '1px solid black';

        const tdThree = document.createElement('td');
        tdThree.style.border = '1px solid black';
        tdThree.style.padding = '0.5%';


        const name = document.createTextNode(outputArray[i]);
        tdThree.appendChild(name);
        trThree.appendChild(tdThree);
        tableUnique.appendChild(trThree);
        document.getElementById('listHolderName').appendChild(tableUnique);
    }



    for (i in result.result.places) {
        const tr = document.createElement('tr');
        tr.style.border = '1px solid black';

        const td = document.createElement('td');
        td.style.border = '1px solid black';
        td.style.padding = '0.5%';


        const name = document.createTextNode(result.result.places[i].properties.name);
        td.appendChild(name);
        tr.appendChild(td);
        tbl.appendChild(tr);
        document.getElementById('listHolder').appendChild(tbl);
    }



    for (i in result.result.spatialities) {

        const trTwo = document.createElement('tr');
        trTwo.style.border = '1px solid black';

        const tdTwo = document.createElement('td');
        tdTwo.style.border = '1px solid black';
        tdTwo.style.padding = '0.5%';


        const nameTwo = document.createTextNode(result.result.spatialities[i]);
        tdTwo.appendChild(nameTwo);
        trTwo.appendChild(tdTwo);
        tableSpatial.appendChild(trTwo);
        document.getElementById('listHolderterms').appendChild(tableSpatial);

    }

    document.getElementById('resultContain').style.display = "block"
    document.getElementById('visualize').style.display = "inline-block"
    document.getElementById('refresh').style.display = "inline-block"
    document.getElementById('postSubmit').style.display = "none"
    document.getElementById('download').style.display = "inline-block"


    let allplaces = result.result.places;
    let allresults = {
        "features": allplaces
    }
    document.getElementById('result').innerHTML = JSON.stringify(allresults);


});


function download(args) {
    var datafromtext = document.getElementById('result').innerHTML;
    var csv = 'data:text/json;charset=utf-8,' + datafromtext;

    filename = args.filename || 'result.json';

    data = encodeURI(csv);

    link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();
}
function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.name) {
        layer.bindPopup(feature.properties.name);
    }
}

function visualize() {

    var datafromtext = document.getElementById('result').innerHTML;
    var data = JSON.parse(datafromtext);
    console.log(data);
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#dd8855",
        color: "#dd8855",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.3
    };
    for (i in data.features)
        L.geoJSON(data.features[i], {
            onEachFeature: onEachFeature,
            style: { color: '#dd8855', fillOpacity: 0.3 },
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, geojsonMarkerOptions);
            }
        }).addTo(map);

    $('#map-holder').show();
    map.invalidateSize();
}