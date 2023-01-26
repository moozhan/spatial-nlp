//// URLS to pass to API & Fetch Function

let jsondata = "";
let apiUrlTwo = 'https://nlp-spatial-server.azurewebsites.net/api/v1/search/collections/semi-static/items/facilities?type=all';
// let apiUrl = "https://london-nlp-spatial.herokuapp.com/chargingpoints";
let namesURL = "https://nlp-spatial-server.azurewebsites.net/api/v1/search/collections/semi-static/items/names?type=all";

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