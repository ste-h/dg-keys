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
import * as Handlebars from "handlebars";

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
  p: "Pentagon",
  r: "Rectangle",
  re: "Rectangle",
};

function capitalizeWords(str) {
  if (!str.trim()) return "";

  const capitalized = str
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

  console.log("Capitalized", str, "as", capitalized);
  return capitalized;
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
// Add additional calls
keyPermutations["dead"] = "Dead";
keyPermutations["boss"] = "Boss";

console.log("Key Permutations:", keyPermutations);

const reader = new ChatBoxReader();

reader.readargs.colors.push(
  a1lib.mixColor(165, 65, 20) // Add the found / used keys color
);

const keys = Object.keys(keyPermutations);
const keysFullNames = Object.values(keyPermutations);

let keyCallerUsernames = ["Fe Nechs", "Fe Conor", "Bazz21", "Lidica"];
let foundKeys = [];
let usedKeys = [];
let calledKeys = {};
const ignoredMessages = ["thbbbbbt", "logged"];
const resetMessages = ["welcome to daemonheim!", "==="];
let lastFloorStartTime = 0;
let latestProcessedTimestamp = new Date(0);
let callerPriority: string[] = [...keyCallerUsernames];

function parseTimestamp(line: string): Date | null {
  const match = line.match(/^\[(\d{2}):(\d{2}):(\d{2})\]/);
  //   console.log("Timestamp detected:", match);

  if (match) {
    const [, hours, minutes, seconds] = match;
    const now = new Date();
    console.log("Current date", now);

    const parsedDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    );

    // console.log("Parsed date:", parsedDate);
    return parsedDate;
  }
  return null;
}

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
  }
}

function appendKeysToPreviousCall(caller: string, keysToAppend: string[]) {
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
    console.log("Reset cooldown active. Skipping reset.");
    return;
  }

  foundKeys = [];
  usedKeys = [];
  calledKeys = {};
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
  // Replace multiple spaces with singular spaces
  //   lineText = lineText.replace(/\s+/g, " ");

  // Skip this line if its not more recent than the last processed timestamp
  const timestamp = parseTimestamp(lineText);
  console.log(
    "Timestamp detected:",
    timestamp,
    "Last process timestamp:",
    latestProcessedTimestamp
  );

  if (!timestamp || timestamp <= latestProcessedTimestamp) {
    console.log("Skipping line because of timestamp");
    return;
  }

  // Reset state and update the timestamp when a 'reset' message is detected ie. Welcome to Daemonheim!
  if (
    resetMessages.some((reset) => lineText.includes(reset.toLocaleLowerCase()))
  ) {
    console.log("Reset message detected, resetting state");
    resetDaemonheimState();
    latestProcessedTimestamp = timestamp;
  }

  if (
    ignoredMessages.some((ignored) =>
      lineText.includes(ignored.toLocaleLowerCase())
    )
  ) {
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
    if (foundKey) {
      const keys = Object.keys(keyPermutations).filter(
        (k) => keyPermutations[k].toLowerCase() === foundKey.toLowerCase()
      );
      if (keys.length > 0) {
        keys.forEach((key) => {
          usedKeys[key] = keyPermutations[key];
        });
        removeKeysFromCalledKeys(keys);
        updateDisplay(output, calledKeys);
      }
    }
    return;
  }

  let caller = keyCallerUsernames.find((username) =>
    lineText.includes(username.toLocaleLowerCase())
  );

  if (!caller) {
    return;
  }

  // Matches everything after username
  let regex = new RegExp(`${caller.toLocaleLowerCase()}:(.*)`, "i");
  let match = lineText.match(regex);
  let message = match ? match[1] : "";

  console.log("Message = ", message);

  console.log("Should append?", message.trim().startsWith("+"));
  let shouldAppend = message.trim().startsWith("+");
  if (shouldAppend) {
    lineText = lineText.replace(/\+/, "");
    console.log("Appending keys from line:", lineText);
  }

  // Detect all keys in the message
  let keysCalled = keys.filter((key) => lineText.split(/\s+/).includes(key));
  console.log("Keys called = ", keysCalled);

  // Remove called keys from the location
  // Ensures keys wont be used for the location
  keysCalled.forEach((key) => {
    let keyRegex = new RegExp(`\\b${key}\\b`, "gi");
    let originalMessage = message;
    message = message.replace(keyRegex, "");
    console.log(
      `Removing keys '${key}': Original:'${originalMessage}' New: '${message}'`
    );
  });

  if (keysCalled.length > 0) {
    // Filter out used keys
    console.log("Used keys:", usedKeys);
    keysCalled = keysCalled.filter((key) => !usedKeys.hasOwnProperty(key));

    if (keysCalled.length > 0) {
      if (shouldAppend) {
        console.log("Attempting to append keys:", keysCalled);
        appendKeysToPreviousCall(caller, keysCalled);
      } else {
        // Trim to get location
        let location = message.trim();

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
    } else {
      console.log("No valid keys to process after filtering used keys");
    }
  } else {
    console.log("No keys detected in the message");
  }

  latestProcessedTimestamp = timestamp;
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
      let lineText = line.text.toLowerCase();
      processLine(lineText);
    }
  }, alt1.captureInterval);
}

Handlebars.registerHelper("capitalizeWords", function (str) {
  return capitalizeWords(str);
});

Handlebars.registerHelper("imagePath", function (key) {
  if (key === "dead") {
    return "./key_images/Skull.png";
  } else if (key === "boss") {
    return "./key_images/Boss.png";
  } else {
    return `./key_images/${keyPermutations[key].replace(/ /g, "_")}.png`;
  }
});

Handlebars.registerHelper("keyName", function (key) {
  return keyPermutations[key] || key;
});

function updateDisplay(container: HTMLElement, calledKeys: any) {
  if (!container) return;

  const templateSource = document.getElementById(
    "keys-template"
  ) as HTMLElement;
  if (!templateSource) {
    console.error("Template not found");
    return;
  }

  const template = Handlebars.compile(templateSource.innerHTML);

  const data = {
    callers: {},
  };

  callerPriority.forEach((caller) => {
    if (calledKeys[caller]) {
      data.callers[caller] = [];
      const uniqueLocations = new Map();

      for (let i = calledKeys[caller].length - 1; i >= 0; i--) {
        const entry = calledKeys[caller][i];
        if (!uniqueLocations.has(entry.location)) {
          uniqueLocations.set(entry.location, entry);
        }
      }

      uniqueLocations.forEach((entry) => {
        if (entry.keys.length > 0 && entry.timestamp > lastFloorStartTime) {
          data.callers[caller].push({
            location: entry.location,
            keys: entry.keys.map((key) => ({
              key: key,
              found: foundKeys.hasOwnProperty(key),
            })),
          });
        }
      });
    }
  });

  container.innerHTML = template(data);
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
      `Alt1 not detected, click <a href='${addappurl}'>here</a> to add this app to Alt1`
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  main();
});
