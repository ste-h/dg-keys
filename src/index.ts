// alt1 base libs, provides all the commonly used methods for image matching and capture
// also gives your editor info about the window.alt1 api
import * as a1lib from "alt1";

// tell webpack that this file relies index.html, appconfig.json and icon.png, this makes webpack
// add these files to the output directory
// this works because in /webpack.config.js we told webpack to treat all html, json and imageimports
// as assets
import "./index.html";
import "./appconfig.json";
import "./icon.png";
import ChatBoxReader from "alt1/chatbox";

var output = document.getElementById("output");

// loads all images as raw pixel data async, images have to be saved as *.data.png
// this also takes care of metadata headers in the image that make browser load the image
// with slightly wrong colors
// this function is async, so you cant acccess the images instantly but generally takes <20ms
// use `await imgs.promise` if you want to use the images as soon as they are loaded
var imgs = a1lib.webpackImages({
	homeport: require("./homebutton.data.png")
});

const ocr = new ChatBoxReader();
ocr.readargs = {
	colors: [
		a1lib.mixColor(255, 255, 255) // White text
	]
}

type Colours = { [key: string]: string };
type Shapes = { [key: string]: string };

const colours: Colours = {
    "cr": "Crimson", "c": "Crimson",
    "go": "Gold",
    "y": "Yellow",
    "p": "Purple", "pu": "Purple",
    "s": "Silver", "si": "Silver",
    "gr": "Green",
    "o": "Orange", "or": "Orange",
    "b": "Blue", "bl": "Blue"
};

const shapes: Shapes = {
    "sh": "Shield", "s": "Shield",
    "co": "Corner", "corn": "Corner",
    "cr": "Crescent",
    "w": "Wedge", "we": "Wedge",
    "d": "Diamond", "di": "Diamond",
    "t": "Triangle", "tr": "Triangle",
    "p": "Pentagon",
    "r": "Rectangle", "re": "Rectangle"
};

const generatePermutations = (colours: Colours, shapes: Shapes): string[] => {
    const permutations: string[] = [];

    for (const colourKey in colours) {
        for (const shapeKey in shapes) {
            permutations.push(colourKey + shapeKey);
        }
    }

    return permutations;
}

const keyList = generatePermutations(colours, shapes);

function main() {
    console.log("test");
    setTimeout(main, 1000);
}

//check if we are running inside alt1 by checking if the alt1 global exists
if (window.alt1) {
	//tell alt1 about the app
	//this makes alt1 show the add app button when running inside the embedded browser
	//also updates app settings if they are changed
	alt1.identifyAppUrl("./appconfig.json");
} else {
	let addappurl = `alt1://addapp/${new URL("./appconfig.json", document.location.href).href}`;
	output.insertAdjacentHTML("beforeend", `
		Alt1 not detected, click <a href='${addappurl}'>here</a> to add this app to Alt1
	`);
}

//also the worst possible example of how to use global exposed exports as described in webpack.config.js
output.insertAdjacentHTML("beforeend", `
	<div>paste an image of rs with homeport button (or not)</div>
	<div onclick='TestApp.capture()'>Click to capture if on alt1</div>`
);

main();