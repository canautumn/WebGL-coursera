var canvas;
var gl;
var program;
var cBuffer;


var points = [];
var faceColors = [];
var edgeColors = [];

var drawFace = 1;
var drawEdge = 1;

//var debugJson = '[ { "type" : "sphere", "sX" : 0.2, "sY" : 0.1, "sZ" : 0.3, "rX" : 40, "rY" : 10, "rZ" : 60, "tX" : 0, "tY" : 0, "tZ" : 0, "numDivisions" : 30, "faceColor" : "#c55ed8", "edgeColor" : "#3f63a7"}, { "type" : "cone", "sX" : 0.5, "sY" : 0.5, "sZ" : 0.5, "rX" : 70, "rY" : 20, "rZ" : -30, "tX" : 0.1, "tY" : 0.1, "tZ" : 0, "numDivisions" : 10, "faceColor" : "#b2edff", "edgeColor" : "#4a1221"},  { "type" : "cylinder", "sX" : 0.2, "sY" : 0.5, "sZ" : 0.3, "rX" : -20, "rY" : -30, "rZ" : -10, "tX" : -0.1, "tY" : -0.5, "tZ" : 0.2, "numDivisions" : 20, "faceColor" : "#5b719a", "edgeColor" : "#646c05"}]';

var initialJson = '[{"type":"cone","sX":0.65,"sY":0.62,"sZ":0.43,"rX":15,"rY":-72,"rZ":0,"tX":-0.06,"tY":0.21,"tZ":0.06,"numDivisions":11,"faceColor":"#bdac14","edgeColor":"#ebff00"},{"type":"cone","sX":0.08,"sY":0.08,"sZ":0.37,"rX":66,"rY":48,"rZ":88,"tX":-0.35,"tY":0.11,"tZ":0.12,"numDivisions":17,"faceColor":"#bebfc9","edgeColor":"#fbc761"},{"type":"cylinder","sX":0.07,"sY":0.03,"sZ":0.87,"rX":-26,"rY":86,"rZ":-64,"tX":-0.51,"tY":-0.35,"tZ":0.2,"numDivisions":16,"faceColor":"#72100c","edgeColor":"#fbc111"},{"type":"cylinder","sX":0.81,"sY":0.73,"sZ":0.18,"rX":-50,"rY":101,"rZ":-40,"tX":-0.04,"tY":-0.74,"tZ":0.11,"numDivisions":4,"faceColor":"#612d25","edgeColor":"#876634"},{"type":"cylinder","sX":0.23,"sY":0.39,"sZ":0.05,"rX":-15,"rY":-81,"rZ":-105,"tX":-0.04,"tY":-0.63,"tZ":-0.12,"numDivisions":27,"faceColor":"#262121","edgeColor":"#594f4f"},{"type":"cylinder","sX":0.02,"sY":0.01,"sZ":0.77,"rX":-75,"rY":-88,"rZ":-61,"tX":-0.13,"tY":-0.5,"tZ":-0.17,"numDivisions":5,"faceColor":"#b8a4a0","edgeColor":"#864c15"},{"type":"sphere","sX":0.03,"sY":0.03,"sZ":0.03,"rX":105,"rY":79,"rZ":-85,"tX":0.02,"tY":-0.54,"tZ":-0.2,"numDivisions":9,"faceColor":"#b00701","edgeColor":"#879d9e"},{"type":"cylinder","sX":0.14,"sY":0.14,"sZ":0.05,"rX":-4,"rY":83,"rZ":94,"tX":-0.05,"tY":-0.62,"tZ":-0.15,"numDivisions":17,"faceColor":"#7d000f","edgeColor":"#59010c"}]';

var items = [];
var currentItemIndex = -1;

var sldSX, sldSY, sldSZ, sldRX, sldRY, sldRZ, sldTX, sldTY, sldTZ, sldDV, cpkFace, cpkEdge;

window.onload = function init() {

  items = JSON.parse(initialJson);

  pushItemPoints();

  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }


  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.enable(gl.DEPTH_TEST);

  //  Load shaders and initialize attribute buffers
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(faceColors), gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);


  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  if (items.length > 0) currentItemIndex = 0;
  initUI();
  updateListUI();
  updateEditingUI();
  render();
}

function initUI() {

  $('.selectpicker').on('change', function () {
    var selected = $(this).find("option:selected").val();
    currentItemIndex = parseInt(selected);
    updateEditingUI();
  });

  $('#buttonAdd').click(function () {
    addRandomItem();
    updateAllData();
    currentItemIndex = items.length - 1;
    updateListUI();
    updateEditingUI();
  });

  $('#buttonRemove').click(function () {
    if (currentItemIndex != -1) {
      items.splice(currentItemIndex, 1);
      if (items.length > 0) {
        currentItemIndex = 0;
      } else {
        currentItemIndex = -1;
      }
      updateAllData();
      updateListUI();
      updateEditingUI();
    }
  });

  $('#buttonSave').click(function () {
    var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items));
    $('<a id="downloadjson" href="data:' + data + '" download="objects.json" style="display:none" target="_blank"></a>').appendTo('body')[0].click()
  });


  $('#buttonClear').click(function () {
    if (confirm("Press OK to clear the canvas...") == true) {
      items = [];
      updateAllData();
      updateListUI();
      currentItemIndex = -1;
    }
  });



  for (var i = 0; i < document.formStyle.radioStyle.length; ++i) {
    document.formStyle.radioStyle[i].onclick = function () {
      if (this.value == "both") {
        drawFace = 1;
        drawEdge = 1;
        render();
      }
      if (this.value == "face") {
        drawFace = 1;
        drawEdge = 0;
        render();
      }
      if (this.value == "edge") {
        drawFace = 0;
        drawEdge = 1;
        render();
      }
    }
  }

  for (var i = 0; i < document.formShape.radioShape.length; ++i) {
    document.formShape.radioShape[i].onclick = function () {
      if (currentItemIndex != -1) {
        items[currentItemIndex].type = this.value;
        updateAllData();
        updateListUI();
      }
    }
  }

  cpkFace = $('#face-color').colorpicker({
      format: 'hex'
    })
    .on('changeColor.colorpicker',
      function (evt) {
        items[currentItemIndex].faceColor = evt.color.toHex();
        updateAllData();
        updateListUI();
      });
  cpkEdge = $('#edge-color').colorpicker({
      format: 'hex'
    })
    .on('changeColor.colorpicker',
      function (evt) {
        items[currentItemIndex].edgeColor = evt.color.toHex();
        updateAllData();
        updateListUI();
      });


  sldSX = $('#sliderSX').slider().on("slide", function (evt) {
    $('#labelSX').text(evt.value);
    if (currentItemIndex != -1) {
      items[currentItemIndex].sX = parseFloat(evt.value);
      updateAllData();
    }
  });
  sldSY = $('#sliderSY').slider().on("slide", function (evt) {
    $('#labelSY').text(evt.value);
    if (currentItemIndex != -1) {
      items[currentItemIndex].sY = parseFloat(evt.value);
      updateAllData();
    }
  });
  sldSZ = $('#sliderSZ').slider().on("slide", function (evt) {
    $('#labelSZ').text(evt.value);
    if (currentItemIndex != -1) {
      items[currentItemIndex].sZ = parseFloat(evt.value);
      updateAllData();
    }
  });

  sldRX = $('#sliderRX').slider().on("slide", function (evt) {
    $('#labelRX').text(evt.value);
    if (currentItemIndex != -1) {
      items[currentItemIndex].rX = parseFloat(evt.value);
      updateAllData();
    }
  });
  sldRY = $('#sliderRY').slider().on("slide", function (evt) {
    $('#labelRY').text(evt.value);
    if (currentItemIndex != -1) {
      items[currentItemIndex].rY = parseFloat(evt.value);
      updateAllData();
    }
  });
  sldRZ = $('#sliderRZ').slider().on("slide", function (evt) {
    $('#labelRZ').text(evt.value);
    if (currentItemIndex != -1) {
      items[currentItemIndex].rZ = parseFloat(evt.value);
      updateAllData();
    }
  });

  sldTX = $('#sliderTX').slider().on("slide", function (evt) {
    $('#labelTX').text(evt.value);
    if (currentItemIndex != -1) {
      items[currentItemIndex].tX = parseFloat(evt.value);
      updateAllData();
    }
  });
  sldTY = $('#sliderTY').slider().on("slide", function (evt) {
    $('#labelTY').text(evt.value);
    if (currentItemIndex != -1) {
      items[currentItemIndex].tY = parseFloat(evt.value);
      updateAllData();
    }
  });
  sldTZ = $('#sliderTZ').slider().on("slide", function (evt) {
    $('#labelTZ').text(evt.value);
    if (currentItemIndex != -1) {
      items[currentItemIndex].tZ = parseFloat(evt.value);
      updateAllData();
    }
  });

  sldDV = $('#sliderDV').slider().on("slide", function (evt) {
    $('#labelDV').text(evt.value);
    if (currentItemIndex != -1) {
      items[currentItemIndex].numDivisions = parseFloat(evt.value);
      updateAllData();
    }
  });

  // use this line to enable bootstrap tooltip
  $("[data-toggle='tooltip']").tooltip();

  
  // handles browsers that doesn't suppport FileReader
  if (typeof window.FileReader !== 'function') {
    $('#file-selector-container').html('<button id="buttonLoadPaste" class="btn btn-primary btn-xs btn-block">Load JSON</button>');
    
    $('#buttonLoadPaste').click(function () {
      var lines = prompt("File loading is not supported in this browser.\nPlease paste the JSON content below manually or use Chrome instead:", "");
      if (lines != null) {
        items = JSON.parse(lines);
        updateAllData();
        updateListUI();
        updateEditingUI();      
      }
      return;
    });

    
  } else {

    // file selector init
    $(document).on('change', '.btn-file :file', function() {
      var input = $(this),
          numFiles = input.get(0).files ? input.get(0).files.length : 1,
          label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
      input.trigger('fileselect', [numFiles, label]);
    });

    $(document).ready( function() {
      $('.btn-file :file').on('fileselect', function(event, numFiles, label) {
          loadFile();
      });
    });
  }
  
}

// Not an efficient way but easy to implement and sufficient
function updateAllData() {
  pushItemPoints();
  cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(faceColors), gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);


  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  render();
}


function updateListUI() {
  // update object list
  $('#objectlist').empty();
  for (var i = 0; i < items.length; ++i) {
    $('#objectlist').append(
      $('<option></option>')
      .attr("value", i)
      .attr("data-content", "<span class='label' style='background:" + items[i].faceColor + "; color:" + items[i].edgeColor + "'>" + items[i].type.capitalize() + "</span>")
    );
  }
  $('#objectlist').val(currentItemIndex);
  $('#objectlist').selectpicker('refresh');
  // handles empty list prompt
  if (items.length == 0) {
    $('#no-item-display').attr('style', '');
    $('#has-item-display').attr('style', 'display : none;');
  } else {
    $('#has-item-display').attr('style', '');
    $('#no-item-display').attr('style', 'display : none;');
  }
}

function updateEditingUI() {
  // update the editing panel
  var e = items[currentItemIndex];
  var i;
  if (e.type == "sphere") i = 0;
  else if (e.type == "cylinder") i = 1;
  else if (e.type == "cone") i = 2;
  $('input:radio[name=radioShape]')[i].checked = true;

  cpkFace.colorpicker('setValue', e.faceColor);
  cpkEdge.colorpicker('setValue', e.edgeColor);

  sldSX.slider('setValue', e.sX);
  $('#labelSX').text(e.sX);
  sldSY.slider('setValue', e.sY);
  $('#labelSY').text(e.sY);
  sldSZ.slider('setValue', e.sZ);
  $('#labelSZ').text(e.sZ);
  sldTX.slider('setValue', e.tX);
  $('#labelTX').text(e.tX);
  sldTY.slider('setValue', e.tY);
  $('#labelTY').text(e.tY);
  sldTZ.slider('setValue', e.tZ);
  $('#labelTZ').text(e.tZ);
  sldRX.slider('setValue', e.rX);
  $('#labelRX').text(e.rX);
  sldRY.slider('setValue', e.rY);
  $('#labelRY').text(e.rY);
  sldRZ.slider('setValue', e.rZ);
  $('#labelRZ').text(e.rZ);
  sldDV.slider('setValue', e.numDivisions);
  $('#labelDV').text(e.numDivisions);

}

/* CREDIT: http://stackoverflow.com/a/21446426 */
function loadFile() {
  var input, file, fr;

  if (typeof window.FileReader !== 'function') {
    var lines = prompt("File loading is not supported in this browser.\nPlease paste the JSON content below manually or use Chrome instead:", "");
    if (lines != null) {
      items = JSON.parse(lines);
      updateAllData();
      updateListUI();
      updateEditingUI();      
    }
    return;
  }

  input = document.getElementById('fileinput');
  if (!input) {
    alert("Page error: fileinput element not found.");
  } else if (!input.files) {
    alert("`files` property of file inputs is not supported in this browser.");
  } else if (!input.files[0]) {
//    alert("Please select a file before clicking 'Load'");
  } else {
    file = input.files[0];
    fr = new FileReader();
    fr.onload = receivedText;
    fr.readAsText(file);
  }

  function receivedText(e) {
    var lines = e.target.result;
    items = JSON.parse(lines);
    updateAllData();
    updateListUI();
    updateEditingUI();
  }
}

function addRandomItem() {
  var randomShape = ["sphere", "cylinder", "cone"][getRandomInt(0, 2)];
  var item = {
    "type": randomShape,
    "sX": getRandomInt(20, 50) / 100,
    "sY": getRandomInt(20, 50) / 100,
    "sZ": getRandomInt(20, 50) / 100,
    "rX": getRandomInt(-180, 180),
    "rY": getRandomInt(-180, 180),
    "rZ": getRandomInt(-180, 180),
    "tX": getRandomInt(-100, 100) / 100,
    "tY": getRandomInt(-100, 100) / 100,
    "tZ": getRandomInt(-50, 50) / 100,
    "numDivisions": 25,
    "faceColor": rgbToHex(getRandomInt(0, 255),
      getRandomInt(0, 255),
      getRandomInt(0, 255)),
    "edgeColor": rgbToHex(getRandomInt(0, 255),
      getRandomInt(0, 255),
      getRandomInt(0, 255))
  };
  items.push(item);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

// push items array into points array
function pushItemPoints() {
  points = [];
  faceColors = [];
  edgeColors = [];
  for (var i = 0; i < items.length; ++i) {
    var e = items[i];
    var faceRgbColor = hexToRgb(e.faceColor);
    var faceColor = vec4(faceRgbColor.r / 255.0, faceRgbColor.g / 255.0, faceRgbColor.b / 255.0, 1.0);
    var edgeRgbColor = hexToRgb(e.edgeColor);
    var edgeColor = vec4(edgeRgbColor.r / 255.0, edgeRgbColor.g / 255.0, edgeRgbColor.b / 255.0, 1.0);

    if (e.type == "sphere") {
      pushSphereData(e.numDivisions, faceColor, edgeColor);
    } else if (e.type == "cylinder") {
      pushCylinderData(e.numDivisions, faceColor, edgeColor);
    } else if (e.type == "cone") {
      pushConeData(e.numDivisions, faceColor, edgeColor);
    }
  }
}

function pushSphereData(numDivisions, faceColor, edgeColor) {

  var latitude = 0;
  var longitude = 0;
  var deltaLongitude = 2 * Math.PI / numDivisions;
  var deltaLatitude = deltaLongitude / 2;

  for (var iLa = 0; iLa < numDivisions; ++iLa) {
    var cosLa1 = Math.cos(latitude);
    var sinLa1 = Math.sin(latitude);
    latitude += deltaLatitude;
    var cosLa2 = Math.cos(latitude);
    var sinLa2 = Math.sin(latitude);
    for (var iLo = 0; iLo < numDivisions; ++iLo) {
      var cosLo1 = Math.cos(longitude);
      var sinLo1 = Math.sin(longitude);
      longitude += deltaLongitude;
      var cosLo2 = Math.cos(longitude);
      var sinLo2 = Math.sin(longitude);

      var p1 = vec4(sinLa1 * cosLo1,
        sinLa1 * sinLo1,
        cosLa1, 1.0);
      var p2 = vec4(sinLa1 * cosLo2,
        sinLa1 * sinLo2,
        cosLa1, 1.0);
      var p3 = vec4(sinLa2 * cosLo2,
        sinLa2 * sinLo2,
        cosLa2, 1.0);
      var p4 = vec4(sinLa2 * cosLo1,
        sinLa2 * sinLo1,
        cosLa2, 1.0);

      points.push(p1);
      points.push(p2);
      points.push(p3);
      points.push(p4);

      for (var iC = 0; iC < 4; iC++) {
        faceColors.push(faceColor);
        edgeColors.push(edgeColor);
      }
    }
  }
}


function pushCylinderData(numDivisions, faceColor, edgeColor) {

  var angle = 0;
  var deltaAngle = 2 * Math.PI / (numDivisions);

  var p0u = vec4(0.0, 0.0, 0.5, 1.0);
  var p0d = vec4(0.0, 0.0, -0.5, 1.0);

  for (var i = 0; i < numDivisions; ++i) {
    var cosTheta1 = Math.cos(angle);
    var sinTheta1 = Math.sin(angle);
    angle += deltaAngle;
    var cosTheta2 = Math.cos(angle);
    var sinTheta2 = Math.sin(angle);

    var p1u = vec4(cosTheta1, sinTheta1, 0.5, 1.0);
    var p1d = vec4(cosTheta1, sinTheta1, -0.5, 1.0);
    var p2u = vec4(cosTheta2, sinTheta2, 0.5, 1.0);
    var p2d = vec4(cosTheta2, sinTheta2, -0.5, 1.0);
    points.push(p1u);
    points.push(p1d);
    points.push(p2d);
    points.push(p2u);

    points.push(p0u);
    points.push(p1u);
    points.push(p2u);

    points.push(p0d);
    points.push(p1d);
    points.push(p2d);

    for (var iC = 0; iC < 10; ++iC) {
      faceColors.push(faceColor);
      edgeColors.push(edgeColor);
    }
  }

}


function pushConeData(numDivisions, faceColor, edgeColor) {

  var angle = 0;
  var deltaAngle = 2 * Math.PI / (numDivisions);

  var p0u = vec4(0.0, 0.0, 0.5, 1.0);
  var p0d = vec4(0.0, 0.0, -0.5, 1.0);

  for (var i = 0; i < numDivisions; ++i) {
    var cosTheta1 = Math.cos(angle);
    var sinTheta1 = Math.sin(angle);
    angle += deltaAngle;
    var cosTheta2 = Math.cos(angle);
    var sinTheta2 = Math.sin(angle);

    var p1d = vec4(cosTheta1, sinTheta1, -0.5, 1.0);
    var p2d = vec4(cosTheta2, sinTheta2, -0.5, 1.0);
    points.push(p0u);
    points.push(p1d);
    points.push(p2d);
    points.push(p0d);

    for (var iC = 0; iC < 4; ++iC) {
      faceColors.push(faceColor);
      edgeColors.push(edgeColor);
    }
  }
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var pointsCounter = 0;

  for (var t = 0; t < items.length; ++t) {

    var e = items[t];

    var numPointsSphere = Math.pow(e.numDivisions, 2) * 4.0;
    var numPointsCylinder = e.numDivisions * 10;
    var numPointsCone = e.numDivisions * 4;



    var thetaLoc = gl.getUniformLocation(program, 'theta');
    var scaleLoc = gl.getUniformLocation(program, 'scale');
    var translateLoc = gl.getUniformLocation(program, 'translate');
    gl.uniform3fv(thetaLoc, [e.rX, e.rY, e.rZ]);
    gl.uniform3fv(scaleLoc, [e.sX, e.sY, e.sZ]);
    gl.uniform3fv(translateLoc, [e.tX, e.tY, e.tZ]);


    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);


    if (items[t].type == "sphere") {
      if (drawFace == 1) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(faceColors));
        for (var i = 0; i < numPointsSphere; i += 4) {
          gl.drawArrays(gl.TRIANGLE_FAN, pointsCounter + i, 4);
        }
      }
      if (drawEdge == 1) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(edgeColors));
        for (var i = 0; i < numPointsSphere; i += 4) {
          gl.drawArrays(gl.LINE_STRIP, pointsCounter + i, 4);
        }
      }
      pointsCounter += numPointsSphere;
    } else if (items[t].type == "cylinder") {
      if (drawFace == 1) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(faceColors));
        for (var i = 0; i < numPointsCylinder; i += 10) {
          gl.drawArrays(gl.TRIANGLE_FAN, pointsCounter + i, 4);
          gl.drawArrays(gl.TRIANGLE_STRIP, pointsCounter + i + 4, 3);
          gl.drawArrays(gl.TRIANGLE_STRIP, pointsCounter + i + 7, 3);
        }
      }
      if (drawEdge == 1) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(edgeColors));
        for (var i = 0; i < numPointsCylinder; i += 10) {
          gl.drawArrays(gl.LINE_STRIP, pointsCounter + i, 4);
          gl.drawArrays(gl.LINE_STRIP, pointsCounter + i + 4, 3);
          gl.drawArrays(gl.LINE_STRIP, pointsCounter + i + 7, 3);
        }
      }
      pointsCounter += numPointsCylinder;
    } else if (items[t].type == "cone") {
      if (drawFace == 1) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(faceColors));
        for (var i = 0; i < numPointsCone; i += 4) {
          gl.drawArrays(gl.TRIANGLE_STRIP, pointsCounter + i, 4);
        }
      }
      if (drawEdge == 1) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(edgeColors));
        for (var i = 0; i < numPointsCone; i += 4) {
          gl.drawArrays(gl.LINE_STRIP, pointsCounter + i, 4);
        }
      }
      pointsCounter += numPointsCone;
    }

  }

}