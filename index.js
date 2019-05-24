'use strict';

var selected = null;
var selectedElem = null;
var keycodes = [];
var keycapDisplayMode="decimal"; // "decimal" "hex" "name" or "matrix"

const layoutColumns=20;
const layoutRows=8;
var layout = [43,320,0,0,0,10,11,104,58,59,0,0,52,81,0,0,0,82,257,72,0,0,4,22,7,9,13,105,106,60,14,15,51,92,94,79,93,76,87,0,0,0,30,31,32,33,36,107,61,62,37,38,39,83,85,0,84,75,86,0,41,0,53,0,0,34,35,108,109,63,46,0,45,42,0,0,74,73,0,0,43,0,20,26,8,21,24,110,64,65,12,18,19,95,97,0,96,78,0,0,0,0,0,0,0,23,28,111,112,66,48,0,47,0,0,0,0,77,0,70,57,288,29,27,6,25,16,113,67,68,54,55,49,40,91,0,90,0,80,89,272,258,100,0,0,5,17,114,115,69,0,0,56,0,99,88,98,0,260,44]; // Default Layout as seen on an unmodified Model M 122

// Ensure that the layout is exactly layoutColumns*layoutRows and filled with
// actual keycodes
function layoutFill() {
  for (var i = 0; i < layoutColumns*layoutRows; i++){
    if (typeof(layout[i]) !== 'number' || isNaN (layout[i])) {
      layout[i]=0;
    }
    layout=layout.slice(0,layoutColumns* layoutRows);
  }
}

// Shouldn't be necesary if the default layout is sane, but it doen't cost
// anything to make sure
layoutFill();

// Write the layout into the layout box
// TODO: Rename to something less easily confused with layoutWrite
function writeLayout() {
  document.getElementById("layoutinput").value = layout;
}

// Read a key from the layout (position)
function layoutRead(row, col) {
  let ix = row*layoutColumns + col;
  return layout[ix] || 0;
}

// Write a new key definition into a layout position
function layoutWrite(row, col,v) {
  let ix = col*layoutColumns + row;
  layout[ix]=v;
}

// Get the keycap group elements from the svg file
function getKeys () {
  let doc = document.getElementById('keyboard-svg');
  return doc.contentDocument.getElementById('gkeys').children;
}

// Map a function over the key group elements
//
// Function should accept 3 arguments: The matrix row number, matrix col
// number and the SVG group element
function withKeys (f) {
  let keys = getKeys();
  for (var i=0; i<keys.length; i++){
    let elem = keys[i];
    let col = elem.getAttribute("data-matrix-col");
    let row = elem.getAttribute("data-matrix-row");
    if (col !== null && row !== null) {
      f(parseInt(row,10), parseInt(col, 10),elem);
    } else
    {
      console.log(x,y);
    }
  };
}

// Set the key label on a keycap element in the SVG
// TODO: Make less assumptions about structure of the SVG
function setKeyLabel(key, label) {
  key.getElementsByTagName("text")[0].innerHTML=label;
}

// Match key name of the form PREFIX_NAME , capturing NAME
const nameRE = /^[^_]+_([^_]+)/;


// Find the name of a key given it's code from the global keycode table
// Returns parenthesized keycode in hex if no key is found
function lookupKeyname(keycode) {
  let keyname
  if (keycodes[keycode]){
    keyname=keycodes[keycode].name;
  } else
  {
    keyname= "(0x" + keycode.toString(16) + ")";
  }
  let match = nameRE.exec(keyname);
  if (match) {
    return match[1];
  } else {
    return keyname;
  }
}

// Update the key captions in the SVG with the current layout.
function updateKeys() {
  withKeys(function(row,col,el) {
    let keycode=layoutRead(row, col);
    let label="error";
    if (keycapDisplayMode === 'decimal') {
      label=keycode.toString(10);
    } else if (keycapDisplayMode === 'hex') {
      label="0x" + keycode.toString(16);
    } else if (keycapDisplayMode === 'name') {
      label=lookupKeyname(keycode);
    } else if (keycapDisplayMode === 'matrix') {
      label=row+"/"+col;
    }

      setKeyLabel(el, label);
  });
};

// Set the keycap display mode ("decimal", "hex", "name" or "matrix")
function setKeycapMode(mode) {
  keycapDisplayMode = mode;
  updateKeys();

}

// Set the content of the "Selected" field
function showSelected(x) {
  let sel = document.getElementById('selected');
  sel.innerHTML=x;
}

// Set the content of the "Keycode" input field
function showKeycode(code) {
  let ip = document.getElementById("selected-keycode");
  ip.value=code;
}

// Set the content of the "Matrix Element" field
function showHover(x) {
  let sel = document.getElementById('hover');
  sel.innerHTML=x;
}

function readLayout(){
  let layoutdata = document.getElementById("layoutinput").value;
  layout = layoutdata.split(",").map(
    function(x){ return parseInt(x.trim());}
  );
  layoutFill();
  updateKeys();
}

function selectKey(row, column, key) {
  if (selectedElem !== null) {
    selectedElem.removeAttribute("selected"); // remove selected from old key
  }
  showSelected (row+"/"+column);
  let selectedKeycode = layoutRead(row,column);
  showKeycode(selectedKeycode);
  selected = [row,column];
  selectedElem = key;
  selectedElem.setAttribute("selected", "true");
}

function setSelectedKeycode(){
  let row = selected[0];
  let column = selected[1];
  let selectedKeyCode = document.getElementById("selected-keycode").value;
  layoutWrite(row,column,parseInt(selectedKeyCode));
  writeLayout();
  updateKeys();
}

// Match lines of the form '#define KB_CODE 1234 // some comment'
// Capturing "KB_CODE", "1234" and "some comment"
const keycodeRE = /^#define\s+([a-zA-Z0-9_]+)\s+((?:0x[0-9a-f]+)|[0-9]+)\s*(?:\/\/\s*(.*))?$/;


function parseDefinition(str){
  let res = keycodeRE.exec(str);
  if (res !== null) {
    res = {
      code: parseInt(res[2]),
      name: res[1],
      comment: res[3]
    };
    console.log(res);

    return res;
  } else
  {
    return null;
  }
}

// Fetch keycode from external file and parse.
function loadKeycodes() {
  let tmp = [];
  fetch('keycodes.txt')
    .then(response => response.text())
    .then((data) => {
      data.split("\n").forEach( (line) => {
        let parsed = parseDefinition(line);
        if(parsed !== null){
          tmp[parsed.code]=parsed;
        };
      }
                              );
      keycodes = tmp;

    });
}

window.addEventListener("load", function() {
  writeLayout();
  updateKeys();
  withKeys( function (row,col,key){
    // key.getElementsByTagName("text")[0].innerHTML=(x+"/"+y);
    key.onmouseover=function(){showHover(row+"/"+col);};
    key.onclick=function(){selectKey(row,col,key)};
  });
  loadKeycodes();

  // Enable onenter handlers
  let inputs = document.getElementsByTagName("input");
  for (let i=0; i<inputs.length; i++) {
    let el = inputs[i];
    let action = el.getAttribute("onkbenter");
    if (el) {
      el.addEventListener("keyup", (event) => {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
          // Cancel the default action, if needed
          event.preventDefault();
          // Trigger the button element with a click
          eval(action);
        };
      });
    }
  };

  });

console.log("test");
