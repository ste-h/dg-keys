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
  tri: "Triangle",
  // add tri
  p: "Pentagon",
  r: "Rectangle",
  re: "Rectangle",
};

let callerPriority: string[] = [];

function setCallerPriority() {
  const select = document.getElementById("callerPriority") as HTMLSelectElement;
  if (select) {
    const selectedCaller = select.value;
    callerPriority = [
      selectedCaller,
      ...keyCallerUsernames.filter((caller) => caller !== selectedCaller),
    ];
    updateDisplay(output, calledKeys);
  } else {
    console.error("Caller priority dropdown not found");
    // Use default order if dropdown is not found
    callerPriority = [...keyCallerUsernames];
  }
}
function capitalizeWords(str) {
  if (str.trim() === "") {
    return "";
  }

  const words = str.split(" ").filter((word) => word !== "");
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i][0].toUpperCase() + words[i].slice(1);
  }
  return words.join(" ");
}

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
keyPermutations["dead"] = "Dead";
keyPermutations["boss"] = "Boss";

console.log(keyPermutations);

const reader = new ChatBoxReader();

reader.readargs.colors.push(
  a1lib.mixColor(165, 65, 20) // Found/used keys color
);

const keys = Object.keys(keyPermutations);
const keysFullNames = Object.values(keyPermutations);

let keyCallerUsernames = ["Fe Nechs", "Fe Conor", "Bazz21", "Lidica"];
let foundKeys = [];
let usedKeys = [];
let calledKeys = {};
let callLocations = {};
const ignoredMessages = ["thbbbbbt", "logged"];
let lastFloorStartTime = 0;

function appendKeysToPreviousCall(caller: string, keysToAppend: string[]) {
  console.log("keys to append", keysToAppend);
  if (calledKeys[caller] && calledKeys[caller].length > 0) {
    const lastCall = calledKeys[caller][calledKeys[caller].length - 1];
    lastCall.keys = lastCall.keys
      .concat(keysToAppend)
      .filter((key, index, self) => self.indexOf(key) === index);
    updateDisplay(output, calledKeys);
  }
}

function resetDaemonheimState() {
  const currentTime = Date.now();
  const cooldownPeriod = 30000;

  if (currentTime - lastFloorStartTime < cooldownPeriod) {
    console.log("Cooldown active. Skipping reset.");
    return;
  }

  foundKeys = [];
  usedKeys = [];
  calledKeys = {};
  callLocations = {};
  lastFloorStartTime = currentTime;
  updateDisplay(output, calledKeys);
}

function findKeysByValue(value) {
  const lowercaseValue = value.toLowerCase();
  return Object.keys(keyPermutations).filter(
    (key) => keyPermutations[key].toLowerCase() === lowercaseValue
  );
}

function removeKeysFromCalledKeys(keysToRemove) {
  Object.keys(calledKeys).forEach((caller) => {
    calledKeys[caller].forEach((item, index) => {
      const originalLength = item.keys.length;
      item.keys = item.keys.filter((key) => !keysToRemove.includes(key));
      const newLength = item.keys.length;
    });
  });

  updateDisplay(output, calledKeys);
}

function processLine(lineText: string) {
  // Remove single quotes from the line
  lineText = lineText.replace(/'/g, "").toLowerCase();

  // Matches everything after username
  let caller = keyCallerUsernames.find((username) =>
    lineText.includes(username.toLocaleLowerCase())
  );

  if (!caller) {
    return;
  }

  if (lineText.includes("found a key")) {
    const foundKey = keysFullNames.find((key) =>
      lineText.includes(key.toLowerCase())
    );
    const key = findKeysByValue(foundKey);
    if (key.length) {
      key.forEach((k) => {
        foundKeys[k] = keyPermutations[k];
      });
      updateDisplay(output, calledKeys);
    }
    return;
  }

  if (lineText.includes("used a key")) {
    const foundKey = keysFullNames.find((key) =>
      lineText.includes(key.toLowerCase())
    );
    const keys = findKeysByValue(foundKey);
    if (keys.length) {
      keys.forEach((k) => {
        usedKeys[k] = keyPermutations[k];
      });
      removeKeysFromCalledKeys(keys);
      updateDisplay(output, calledKeys);
    }
    return;
  }

  let regex = new RegExp(`${caller.toLocaleLowerCase()}:(.*)`, "i");
  let match = lineText.match(regex);
  let message = match ? match[1].trim() : "";

  if (
    ignoredMessages.some((ignored) =>
      lineText.includes(ignored.toLocaleLowerCase())
    )
  ) {
    return;
  }

  let shouldAppendToPreviousCall = false;
  if (message.startsWith("+")) {
    message = message.substring(1).trim(); // Remove the +
    shouldAppendToPreviousCall = true;
  }

  let keysCalled = keys.filter((key) => message.split(/\s+/).includes(key));

  if (keysCalled.length > 0) {
    // Filter used keys
    let keysCalled = keys.filter((key) => message.split(/\s+/).includes(key));

    if (keysCalled.length > 0) {
      // Filter out keys that are in usedKeys
      keysCalled = keysCalled.filter((key) => !usedKeys.hasOwnProperty(key));

      if (keysCalled.length > 0) {
        // Only proceed if there are still keys after filtering
        // Append keys to the previous call
        if (shouldAppendToPreviousCall) {
          appendKeysToPreviousCall(caller, keysCalled);
        } else {
          // Remove called keys from the location
          keysCalled.forEach((key) => {
            let keyRegex = new RegExp(key, "gi");
            message = message.replace(keyRegex, "").trim();
          });

          if (!calledKeys[caller]) {
            calledKeys[caller] = [];
          }

          // Don't add duplicates
          let currentTime = Date.now();
          if (currentTime > lastFloorStartTime) {
            let existingEntry = calledKeys[caller].find(
              (entry) =>
                entry.location === message &&
                JSON.stringify(entry.keys) === JSON.stringify(keysCalled)
            );
            if (!existingEntry) {
              calledKeys[caller].push({
                location: message,
                keys: keysCalled,
                timestamp: currentTime,
              });
            }
          }
        }
      }
    }
    updateDisplay(output, calledKeys);
  }
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

    // Resets on new floor message or 3 ='s in a row
    // Sometimes alt1 will re-read and process the entire chat while missing the 'Welcome to Daemonheim' message
    // So sometimes old keys before that message may be seen as new calls. Typically only messages sent after the reset message will be read
    // There's a 30sec cooldown on resetting, so if you play with a reasonably sized chatbox the message should be spammed within in that period

    let resetIndex = lines.findIndex((line) =>
      line.text.toLowerCase().includes("welcome to daemonheim")
    );

    if (resetIndex !== -1) {
      // If "Welcome to Daemonheim" is found, only process lines from that point onwards
      lines = lines.slice(resetIndex + 1);
      resetDaemonheimState();
    }

    for (let line of lines) {
      console.log("detected text", line.text);
      // Remove single quotes
      let lineText = line.text.replace(/'/g, "").toLowerCase();

      // Can also reset with ='s
      if (/={3,}/.test(lineText)) {
        resetDaemonheimState();
      } else {
        processLine(lineText);
      }
    }
  }, alt1.captureInterval);
}

function updateDisplay(container, calledKeys) {
  if (!container) return;

  container.innerHTML = "";

  callerPriority.forEach((caller) => {
    if (calledKeys[caller]) {
      const callerDiv = document.createElement("div");
      callerDiv.className = "caller-section";

      const callerTitle = document.createElement("h2");
      callerTitle.className = "caller-name";
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
        if (entry.keys.length > 0 && entry.timestamp > lastFloorStartTime) {
          const locationItem = document.createElement("div");
          locationItem.className = "location-item";

          const locationText = document.createElement("span");
          locationText.className = "location-text";
          locationText.textContent = `${capitalizeWords(entry.location)}`;
          locationItem.appendChild(locationText);

          const iconsContainer = document.createElement("div");
          iconsContainer.className = "icons-container";

          const keysList = document.createElement("ul");
          keysList.className = "keys-list";

          entry.keys.forEach((key) => {
            if (keyPermutations[key]) {
              const keyItem = document.createElement("li");

              const keyContainer = document.createElement("div");
              keyContainer.className = "key-container";

              let imgPath;
              if (key === "dead") {
                imgPath = "./key_images/Skull.png";
              }
              if (key === "boss") {
                imgPath = "./key_images/Boss.png";
              } else {
                imgPath = `./key_images/${keyPermutations[key].replace(
                  / /g,
                  "_"
                )}.png`;
              }
              const imgElement = document.createElement("img");
              imgElement.src = imgPath;
              imgElement.alt = keyPermutations[key];

              if (foundKeys[key]) {
                keyContainer.classList.add("key-glow");
              }

              keyContainer.appendChild(imgElement);
              keyItem.appendChild(keyContainer);
              keysList.appendChild(keyItem);
            }
          });

          iconsContainer.appendChild(keysList);
          locationItem.appendChild(iconsContainer);
          callerDiv.appendChild(locationItem);
        }
      });

      container.appendChild(callerDiv);
    }
  });
}
function main() {
  if (window.alt1) {
    alt1.identifyAppUrl("./appconfig.json");
    readChatbox();

    const select = document.getElementById(
      "callerPriority"
    ) as HTMLSelectElement;
    if (select) {
      select.addEventListener("change", setCallerPriority);
      setCallerPriority();
    } else {
      console.error("Caller priority dropdown not found");
    }
  } else {
    let addappurl = `alt1://addapp/${
      new URL("./appconfig.json", document.location.href).href
    }`;
    output.insertAdjacentHTML(
      "beforeend",
      `
		Alt1 not detected, click <a href='${addappurl}'>here</a> to add this app to Alt1
	`
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  main();
});
