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

type Colours = { [key: string]: string };
type Shapes = { [key: string]: string };

const colours: Colours = {
  cr: "Crimson",
  c: "Crimson",
  go: "Gold",
  y: "Yellow",
  p: "Purple",
  pu: "Purple",
  s: "Silver",
  si: "Silver",
  gr: "Green",
  o: "Orange",
  or: "Orange",
  b: "Blue",
  bl: "Blue",
};

const shapes: Shapes = {
  sh: "Shield",
  s: "Shield",
  co: "Corner",
  corn: "Corner",
  cr: "Crescent",
  w: "Wedge",
  we: "Wedge",
  d: "Diamond",
  di: "Diamond",
  t: "Triangle",
  tr: "Triangle",
  p: "Pentagon",
  r: "Rectangle",
  re: "Rectangle",
};

function generateKeyPermutations(colours: Colours, shapes: Shapes) {
  const permutations: { [key: string]: string } = {};

  for (const colourKey in colours) {
    for (const shapeKey in shapes) {
      const combinedKey = colourKey + shapeKey;
      const combinedValue = colours[colourKey] + " " + shapes[shapeKey];
      permutations[combinedKey] = combinedValue;
    }
  }

  return permutations;
}

const keyPermutations = generateKeyPermutations(colours, shapes);
console.log(keyPermutations);

const reader = new ChatBoxReader();

// reader.readargs = {
// 	colors: [
// 		// a1lib.mixColor(255, 255, 255), // White
// 		a1lib.mixColor(127, 169, 255), // Public chat blue
// 		a1lib.mixColor(165, 65, 20), // Found/used keys

// 		]
// 	}
reader.readargs.colors.push(
  a1lib.mixColor(165, 65, 20) // Found/used keys color
);

const keys = Object.keys(keyPermutations);
const keysFullNames = Object.values(keyPermutations);

let keyCallerUsernames = ["Fe Nechs", "Fe Conor"];
let foundKeys = [];
let usedKeys = [];
let calledKeys = {};
let callLocations = {};
const ignoredMessages = ["thbbbbbt", "logged"];

function findKeysByValue(value) {
  const lowercaseValue = value.toLowerCase();
  return Object.keys(keyPermutations).filter(
    (key) => keyPermutations[key].toLowerCase() === lowercaseValue
  );
}

function removeKeysFromCalledKeys(keysToRemove) {
  console.log("Original data:", JSON.stringify(calledKeys));
  console.log("Keys to remove:", keysToRemove);

  Object.keys(calledKeys).forEach((caller) => {
    calledKeys[caller].forEach((item, index) => {
      console.log(
        `Before modification (Caller: ${caller}, Item ${index}):`,
        JSON.stringify(item)
      );

      const originalLength = item.keys.length;
      item.keys = item.keys.filter((key) => !keysToRemove.includes(key));
      const newLength = item.keys.length;

      console.log(
        `After modification (Caller: ${caller}, Item ${index}):`,
        JSON.stringify(item)
      );
      console.log(`Keys removed: ${originalLength - newLength}`);
    });
  });

  console.log("Final data:", JSON.stringify(calledKeys));
  updateDisplay(output, calledKeys);
}

function readChatbox() {
  if (!window.alt1) {
    console.log("Alt1 not detected");
    return;
  }

  setInterval(() => {
    if (!reader.pos) {
      try {
        reader.find();
      } catch (e) {
        console.warn(e);
        return;
      }
    }

    let lines = reader.read();
    if (!lines) {
      return;
    }

    for (let line of lines) {
      console.log("detected text", line.text);
      let lineText = line.text.toLocaleLowerCase();

      console.log("line text", lineText);

      if (
        ignoredMessages.some((ignored) =>
          lineText.includes(ignored.toLocaleLowerCase())
        )
      ) {
        continue;
      }

      let test = findKeysByValue("blue shield");
      console.log("sdfsdfsdfsfd", test);

      if (lineText.includes("found a key")) {
        const foundKey = keysFullNames.find((key) =>
          lineText.includes(key.toLowerCase())
        );
        const key = findKeysByValue(foundKey);
        console.log("KEY FOUND", key);
        if (key.length) {
          foundKeys[key[0]] = keyPermutations[key[0]];
          console.log("wwwwwwwwwwwwwww", foundKeys);
          updateDisplay(output, calledKeys);
        }
        continue;
      }

      if (lineText.includes("used a key")) {
        const foundKey = keysFullNames.find((key) =>
          lineText.includes(key.toLowerCase())
        );
        const keys = findKeysByValue(foundKey);
        if (keys.length > 0) {
          usedKeys[keys[0]] = keyPermutations[keys[0]];
          console.log("gggggggggggg", usedKeys);
          removeKeysFromCalledKeys(keys);
          updateDisplay(output, calledKeys);
        }
        continue;
      }

      let caller = keyCallerUsernames.find((username) =>
        lineText.includes(username.toLocaleLowerCase())
      );

      if (!caller) {
        continue;
      }

      // Matches everything after username
      let regex = new RegExp(`${caller.toLocaleLowerCase()}:(.*)`, "i");
      let match = lineText.match(regex);
      let location = match ? match[1].trim() : "";

      let keysCalled = keys.filter((key) =>
        lineText.split(/\s+/).includes(key)
      );

      if (keysCalled.length > 0) {
        // Filter used keys
        keysCalled = keysCalled.filter((key) => !usedKeys.includes(key));

        // Remove called keys from the location
        keysCalled.forEach((key) => {
          let keyRegex = new RegExp(key, "gi");
          location = location.replace(keyRegex, "").trim();
        });

        if (!calledKeys[caller]) {
          calledKeys[caller] = [];
        }

        // Don't add duplicates
        let existingEntry = calledKeys[caller].find(
          (entry) =>
            entry.location === location &&
            JSON.stringify(entry.keys) === JSON.stringify(keysCalled)
        );

        if (!existingEntry) {
          calledKeys[caller].push({ location: location, keys: keysCalled });
        }
      }

      updateDisplay(output, calledKeys);
      console.log("called keys", calledKeys);
    }
  }, alt1.captureInterval);
}

function updateDisplay(container, calledKeys) {
  if (!container) return;

  container.innerHTML = "";

  Object.keys(calledKeys).forEach((caller) => {
    const callerDiv = document.createElement("div");
    callerDiv.className = "caller-section";

    const callerTitle = document.createElement("h2");
    callerTitle.textContent = caller;
    callerDiv.appendChild(callerTitle);

    const uniqueLocations = new Map();

    for (let i = calledKeys[caller].length - 1; i >= 0; i--) {
      const entry = calledKeys[caller][i];
      if (!uniqueLocations.has(entry.location)) {
        uniqueLocations.set(entry.location, entry);
      }
    }

    uniqueLocations.forEach((entry) => {
      // Only create and append the location if it has keys
      if (entry.keys.length > 0) {
        const locationDiv = document.createElement("div");
        locationDiv.className = "location-item";
        locationDiv.textContent = `${entry.location}`;

        const keysDiv = document.createElement("div");
        keysDiv.style.display = "flex";

        entry.keys.forEach((key) => {
          const keyItem = document.createElement("div");
          keyItem.style.marginRight = "10px";

          if (keyPermutations[key]) {
            const imgPath = `./key_images/${keyPermutations[key].replace(
              / /g,
              "_"
            )}.png`;
            const imgElement = document.createElement("img");
            imgElement.src = imgPath;
            imgElement.alt = keyPermutations[key];
            keyItem.appendChild(imgElement);
          }

          keysDiv.appendChild(keyItem);
        });

        locationDiv.appendChild(keysDiv);
        callerDiv.appendChild(locationDiv);
      }
    });

    container.appendChild(callerDiv);
  });
}
function main() {
  readChatbox();
}

main();
