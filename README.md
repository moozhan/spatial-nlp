## Spatial Natural Language Processing Attempt

Please check the demo here: https://moozhan.github.io/spatial-nlp/

This project is an attempt to create a spatial analysis tool using natural language processing capabilities (#nlp).
The user's query is taken from the front end. It is then passed through **compromise.js** library. Currently the text analysis is done mainly using .match() function of the library. **Turf.js** is then used to translate certain combination of the words into spatial query functions.

The data used in this project is mainly to show and test the functions. They are taken from **ONS** and **#openstreetmap**
