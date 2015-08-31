var canvas;
var gl;
var program;
var vBuffer;


var points = [];

var drawFace = 1;
var drawEdge = 1;

var cameraMatrix, projectionMatrix;



var initialJson = '{"items":[{"type":"cone","sX":0.25,"sY":0.51,"sZ":0.43,"rX":-70,"rY":14,"rZ":49,"tX":-0.06,"tY":0.21,"tZ":0.06,"numDivisions":25,"isReceivingLight":1,"ambient":[0.7411764705882353,0.7019607843137254,0.34901960784313724,1],"diffuse":[0.8784313725490196,0.6705882352941176,0.2235294117647059,1],"specular":[0.9921568627450981,0.9372549019607843,0.803921568627451,1],"shininess":79.3},{"type":"sphere","sX":0.1,"sY":0.1,"sZ":0.1,"rX":40,"rY":10,"rZ":60,"tX":0.3,"tY":-0.13,"tZ":0,"numDivisions":30,"isReceivingLight":1,"ambient":[0.027450980392156862,0.32941176470588235,0.25882352941176473,1],"diffuse":[0.6235294117647059,0.7764705882352941,0.8117647058823529,1],"specular":[0.6745098039215687,0.9215686274509803,0.9058823529411765,1],"shininess":27.8974},{"type":"cylinder","sX":0.29,"sY":0.23,"sZ":0.24,"rX":163,"rY":-158,"rZ":-51,"tX":-0.69,"tY":-0.62,"tZ":-0.45,"numDivisions":30,"ambient":[0.5058823529411764,0.24313725490196078,0.34509803921568627,1],"diffuse":[0.8313725490196079,0.06274509803921569,0.06274509803921569,1],"specular":[0.7647058823529411,0.023529411764705882,0.6,1],"shininess":18.7,"isReceivingLight":1},{"type":"cylinder","sX":2,"sY":2,"sZ":0.01,"rX":-127,"rY":180,"rZ":-33,"tX":-0.84,"tY":-1,"tZ":-0.6,"numDivisions":4,"ambient":[0.5294117647058824,0.5294117647058824,0.5294117647058824,1],"diffuse":[0.5098039215686274,0.5098039215686274,0.5098039215686274,1],"specular":[0.4392156862745098,0.4392156862745098,0.4392156862745098,1],"shininess":37,"isReceivingLight":1}],"lighting":{"ambientLightOn":true,"ambientLight":[0.2,0.14901960784313725,0.09803921568627451,1],"pointLights":[{"on":true,"diffuse":[0.4588235294117647,0.18823529411764706,0.28627450980392155,1],"specular":[1,0.23921568627450981,0.23921568627450981,1],"position":[-0.43,-1,0.5],"moving":true,"speed":1.02},{"on":1,"diffuse":[0.48627450980392156,0.6,1,1],"specular":[0,0,0,1],"position":[-1,-0.08,-0.08],"moving":true,"speed":3},{"on":true,"diffuse":[0.6313725490196078,0.6784313725490196,0.09019607843137255,1],"specular":[1,0.9607843137254902,0,1],"position":[-0.25,-1,0.79],"moving":1,"speed":1.5}]},"viewing":{"camera":{"radius":2,"theta":45,"phi":0,"X":0,"Y":0,"Z":0},"projection":{"fov":45,"near":1,"far":-1}}}';

var items = [];
var currentItemIndex = -1;

var sldSX, sldSY, sldSZ, sldRX, sldRY, sldRZ, sldTX, sldTY, sldTZ, sldDV;
var cpkAO, cpkDO, cpkSO, sldSO, chkLO, chkLA, chkLP, chkLM, cpkLA, cpkLD, cpkLS;
var sldPX, sldPY, sldPZ, sldPS;
var sldCR, sldCT, sldCP, sldCX, sldCY, sldCZ, sldPF, sldPN, sldPA;

// Lighting
var lighting = {"ambientLightOn":1, "ambientLight":[0.2, 0.15, 0.1, 1.0], "pointLights":
      [{"on":1, "diffuse":[1.0, 1.0, 1.0, 1.0], "specular":[1.0, 0.0, 0.0, 1.0], "position":[0.8, 0.0, 0.0], "moving":1, "speed":0.5}, 
       {"on":1, "diffuse":[1.0, 1.0, 1.0, 1.0], "specular":[0.0, 1.0, 0.0, 1.0], "position":[0.1, 0.8, 0.1], "moving":1, "speed":1.0}, 
       {"on":1, "diffuse":[1.0, 1.0, 1.0, 1.0], "specular":[1.0, 1.0, 1.0, 1.0], "position":[0.1, 0.1, 0.8], "moving":1, "speed":1.5}
       ]};
var currentLightIndex = 0;
var pointLightPos = [0.0, 0.0, 0.0];
var pointLightCurrentTheta = [0.0, 0.0, 0.0];

// viewing
var viewing = {"camera": {"radius": 2.0, "theta": 45.0, "phi": 0.0, "X": 0.0, "Y": 0.0, "Z": 0.0}, "projection": {"fov": 45.0, "near": 1.0, "far": -1.0} };

window.onload = function init() {

  loadedData = JSON.parse(initialJson);
  items = loadedData.items;
  lighting = loadedData.lighting;
  viewing = loadedData.viewing;
  
  pushItemPoints();

  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas, {preserveDrawingBuffer: true});
  if (!gl) {
    alert("WebGL isn't available");
  }


  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.05, 0.05, 0.15, 1.0);
  gl.enable(gl.DEPTH_TEST);
  
  //  Load shaders and initialize attribute buffers
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);


  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);
  
  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);


  if (items.length > 0) currentItemIndex = 0;
  initUI();
  
  render();
  $(".loading").fadeOut("fast");
}

function initUI() {

  $('#objectlist').on('change', function () {
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
    var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({"items":items, "lighting":lighting, "viewing":viewing}));
    $('<a id="downloadjson" href="data:' + data + '" download="cad.json" style="display:none" target="_blank"></a>').appendTo('body')[0].click()
  });


  $('#buttonClear').click(function () {
    if (confirm("Press OK to clear the canvas...") == true) {
      items = [];
      updateAllData();
      updateListUI();
      currentItemIndex = -1;
    }
  });

  $('#buttonExport').click(function () {
    var dataURL = canvas.toDataURL('image/png');
    window.open(dataURL, "_blank");
  });



  for (var i = 0; i < document.formStyle.radioStyle.length; ++i) {
    document.formStyle.radioStyle[i].onclick = function () {
      if (this.value == "face") {
        drawFace = 1;
        drawEdge = 0;
      }
      if (this.value == "edge") {
        drawFace = 0;
        drawEdge = 1;
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

  cpkAO = $('#clrAmbientObject').colorpicker({
      format: 'hex'
    })
    .on('changeColor.colorpicker',
      function (evt) {
        items[currentItemIndex].ambient = rgbStructToArray(evt.color.toRGB());
        updateListUI();
      });
  cpkDO = $('#clrDiffuseObject').colorpicker({
      format: 'hex'
    })
    .on('changeColor.colorpicker',
      function (evt) {
        items[currentItemIndex].diffuse = rgbStructToArray(evt.color.toRGB());
        updateListUI();
      });
  cpkSO = $('#clrSpecularObject').colorpicker({
      format: 'hex'
    })
    .on('changeColor.colorpicker',
      function (evt) {
        items[currentItemIndex].specular = rgbStructToArray(evt.color.toRGB());
        updateListUI();
      });
    
  sldSO = $('#sliderShininess').slider().on("slide", function (evt) {
    $('#labelShininess').text(evt.value);
    if (currentItemIndex != -1) {
      items[currentItemIndex].shininess = parseFloat(evt.value);
    }
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


  
  // handles browsers that doesn't suppport FileReader
  if (typeof window.FileReader !== 'function') {
    $('#file-selector-container').html('<button id="buttonLoadPaste" class="btn btn-primary btn-xs btn-block" data-toggle="tooltip" data-placement="top" data-original-title="Load Data from JSON"><span class="glyphicon glyphicon-open"></button>');
    
    $('#buttonLoadPaste').click(function () {
      var lines = prompt("File loading is not supported in this browser.\nPlease paste the JSON content below manually or use Chrome instead:", "");
      if (lines != null) {
        loadFromJsonString(lines);
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

  // use this line to enable bootstrap tooltip. This line should be after the replacement of load button above
  $("[data-toggle='tooltip']").tooltip();
  
  // lighting panel
  $("#chkReceivingLighting").bootstrapSwitch({"size":"mini"});
  $("#chkReceivingLighting").on('switchChange.bootstrapSwitch', function(evt, state) {
    items[currentItemIndex].isReceivingLight = state;
  });
  $("#chkAmbient").bootstrapSwitch({"size":"mini"});
  $("#chkAmbient").on('switchChange.bootstrapSwitch', function(evt, state) {
    lighting.ambientLightOn = state;
  });
  cpkLA = $('#clrAmbient').colorpicker({
      format: 'hex'
    })
    .on('changeColor.colorpicker',
      function (evt) {
        lighting.ambientLight = rgbStructToArray(evt.color.toRGB());
      });
  
  cpkLD = $('#clrDiffuse').colorpicker({
      format: 'hex'
    })
    .on('changeColor.colorpicker',
      function (evt) {
        lighting.pointLights[currentLightIndex].diffuse = rgbStructToArray(evt.color.toRGB());
      });
  
  cpkLS = $('#clrSpecular').colorpicker({
      format: 'hex'
    })
    .on('changeColor.colorpicker',
      function (evt) {
        lighting.pointLights[currentLightIndex].specular = rgbStructToArray(evt.color.toRGB());
        updateLightListUI();
      });
  
  sldPX = $('#sliderPX').slider().on("slide", function (evt) {
    $('#labelPX').text(evt.value);
    if (currentLightIndex != -1) {
      lighting.pointLights[currentLightIndex].position[0] = parseFloat(evt.value);
    }
  });
  
  sldPY = $('#sliderPY').slider().on("slide", function (evt) {
    $('#labelPY').text(evt.value);
    if (currentLightIndex != -1) {
      lighting.pointLights[currentLightIndex].position[1] = parseFloat(evt.value);
    }
  });
  
  sldPZ = $('#sliderPZ').slider().on("slide", function (evt) {
    $('#labelPZ').text(evt.value);
    if (currentLightIndex != -1) {
      lighting.pointLights[currentLightIndex].position[2] = parseFloat(evt.value);
    }
  });
  
  sldPS = $('#sliderPS').slider().on("slide", function (evt) {
    $('#labelPS').text(evt.value);
    if (currentLightIndex != -1) {
      lighting.pointLights[currentLightIndex].speed = parseFloat(evt.value);
    }
  });
  
  
  $('#lightlist').on('change', function () {
    var selected = $(this).find("option:selected").val();
    currentLightIndex = parseInt(selected);
    updateLightEditingUI();
  }); 
  
  
  $("#chkPoint").bootstrapSwitch({"size":"mini"});
  $("#chkPoint").on('switchChange.bootstrapSwitch', function(evt, state) {
    lighting.pointLights[currentLightIndex].on = state;
  });
  
  
  
  
  $("#chkPointLightMoving").bootstrapSwitch({"size":"mini"});
  $("#chkPointLightMoving").on('switchChange.bootstrapSwitch', function(evt, state) {
    lighting.pointLights[currentLightIndex].moving = state;
  });
  
  
  
  // initial global setting according to preloaded data
  $("#chkAmbient").bootstrapSwitch('state', lighting.ambientLightOn, true);
  cpkLA.colorpicker('setValue', rgbArrayToHex(lighting.ambientLight));
  
  
  // camera panel
  sldCR = $('#sliderCR').slider().on("slide", function (evt) {
    $('#labelCR').text(evt.value);
    viewing.camera.radius = parseFloat(evt.value);
  });
  sldCT = $('#sliderCT').slider().on("slide", function (evt) {
    $('#labelCT').text(evt.value);
    viewing.camera.theta = parseFloat(evt.value);
  });
  sldCP = $('#sliderCP').slider().on("slide", function (evt) {
    $('#labelCP').text(evt.value);
    viewing.camera.phi = parseFloat(evt.value);
  });
  sldCX = $('#sliderCX').slider().on("slide", function (evt) {
    $('#labelCX').text(evt.value);
    viewing.camera.X = parseFloat(evt.value);
  });
  sldCY = $('#sliderCY').slider().on("slide", function (evt) {
    $('#labelCY').text(evt.value);
    viewing.camera.Y = parseFloat(evt.value);
  });
  sldCZ = $('#sliderCZ').slider().on("slide", function (evt) {
    $('#labelCZ').text(evt.value);
    viewing.camera.Z = parseFloat(evt.value);
  });
  sldPF = $('#sliderPF').slider().on("slide", function (evt) {
    $('#labelPF').text(evt.value);
    viewing.projection.fov = parseFloat(evt.value);
  });
  sldPN = $('#sliderPN').slider().on("slide", function (evt) {
    $('#labelPN').text(evt.value);
    viewing.projection.near = parseFloat(evt.value);
  });
  sldPA = $('#sliderPA').slider().on("slide", function (evt) {
    $('#labelPA').text(evt.value);
    viewing.projection.far = parseFloat(evt.value);
  });
  
  
  
  // update some UI according to preloaded data
  updateListUI();
  updateEditingUI();
  updateLightListUI();
  updateLightEditingUI();
}

// Not an efficient way but easy to implement and sufficient
function updateAllData() {
  pushItemPoints();
  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);


  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);
  
  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

}


function updateListUI() {
  // update object list
  $('#objectlist').empty();
  for (var i = 0; i < items.length; ++i) {
    $('#objectlist').append(
      $('<option></option>')
      .attr("value", i)
      .attr("data-content", "<span class='label' style='background:" + rgbArrayToHex(items[i].diffuse) + "; color:" + rgbArrayToHex(items[i].specular) + "'>" + items[i].type.capitalize() + "</span>")
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

  cpkAO.colorpicker('setValue', rgbArrayToHex(e.ambient));
  cpkDO.colorpicker('setValue', rgbArrayToHex(e.diffuse));
  cpkSO.colorpicker('setValue', rgbArrayToHex(e.specular));
  sldSO.slider('setValue', e.shininess);
  
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

  $("#chkReceivingLighting").bootstrapSwitch('state', e.isReceivingLight, true);

}

function updateLightListUI() {
  // update light list
  $('#lightlist').empty();
  for (var i = 0; i < lighting.pointLights.length; ++i) {
    $('#lightlist').append(
      $('<option></option>')
      .attr("value", i)
      .attr("data-content", "<span class='label' style='background:" + 
        rgbArrayToHex(lighting.pointLights[i].diffuse) + 
        "; color:" + 
        rgbArrayToHex(lighting.pointLights[i].specular) + 
        "'>LIGHT " + 
        (i+1) + "</span>")
    );
  }
  $('#lightlist').val(currentLightIndex);
  $('#lightlist').selectpicker('refresh');
}

function updateLightEditingUI() {
  // update the light editing section
  var el = lighting.pointLights[currentLightIndex];
  $("#chkPoint").bootstrapSwitch('state', el.on, true);
  cpkLD.colorpicker('setValue', rgbArrayToHex(el.diffuse));
  cpkLS.colorpicker('setValue', rgbArrayToHex(el.specular));
  
  sldPX.slider('setValue', el.position[0]);
  $('#labelPX').text(el.position[0]);
  sldPY.slider('setValue', el.position[1]);
  $('#labelPY').text(el.position[1]);
  sldPZ.slider('setValue', el.position[2]);
  $('#labelPZ').text(el.position[2]);

  $("#chkPointLightMoving").bootstrapSwitch('state', el.moving, true);
  sldPS.slider('setValue', el.speed);
  $('#labelPS').text(el.speed);

}

function updateCameraUI() {
  // update the camera panel UI from data, only used when loading from JSON
  sldCR.slider('setValue', viewing.camera.radius);
  $('#labelCR').text(viewing.camera.radius);
  sldCT.slider('setValue', viewing.camera.theta);
  $('#labelCT').text(viewing.camera.theta);
  sldCP.slider('setValue', viewing.camera.phi);
  $('#labelCP').text(viewing.camera.phi);
  sldCX.slider('setValue', viewing.camera.X);
  $('#labelCX').text(viewing.camera.X);
  sldCY.slider('setValue', viewing.camera.Y);
  $('#labelCY').text(viewing.camera.Y);
  sldCZ.slider('setValue', viewing.camera.Z);
  $('#labelCZ').text(viewing.camera.Z);
  sldPF.slider('setValue', viewing.projection.fov);
  $('#labelPF').text(viewing.projection.fov);
  sldPN.slider('setValue', viewing.projection.near);
  $('#labelPN').text(viewing.projection.near);
  sldPA.slider('setValue', viewing.projection.far);
  $('#labelPA').text(viewing.projection.far);  
}

/* loadFile() CREDIT: http://stackoverflow.com/a/21446426 */
function loadFile() {
  var input, file, fr;

  if (typeof window.FileReader !== 'function') {
    var lines = prompt("File loading is not supported in this browser.\nPlease paste the JSON content below manually or use Chrome instead:", "");
    if (lines != null) {
      loadFromJsonString(lines);
    }
    return;
  }

  input = document.getElementById('fileinput');
  if (!input) {
    alert("Page error: fileinput element not found.");
  } else if (!input.files) {
    alert("`files` property of file inputs is not supported in this browser.");
  } else {
    file = input.files[0];
    fr = new FileReader();
    fr.onload = receivedText;
    fr.readAsText(file);
  }

  function receivedText(e) {
    var lines = e.target.result;
    loadFromJsonString(lines);
  }
}

function loadFromJsonString(lines) {
  loadedData = JSON.parse(lines);
  items = loadedData.items;
  lighting = loadedData.lighting;
  viewing = loadedData.viewing;
  updateAllData();
  updateListUI();
  updateEditingUI();
  updateLightListUI();
  updateLightEditingUI();
  updateCameraUI();
}

function addRandomItem() {
  var randomShape = ["sphere", "cylinder", "cone"][getRandomInt(0, 2)];
  var item = {
    "type": randomShape,
    "sX": getRandomInt(10, 30) / 100,
    "sY": getRandomInt(10, 30) / 100,
    "sZ": getRandomInt(10, 30) / 100,
    "rX": getRandomInt(-180, 180),
    "rY": getRandomInt(-180, 180),
    "rZ": getRandomInt(-180, 180),
    "tX": getRandomInt(-100, 100) / 100,
    "tY": getRandomInt(-100, 100) / 100,
    "tZ": getRandomInt(-50, 50) / 100,
    "numDivisions": 30,
    "ambient": [getRandomInt(0, 255) / 255.0,
      getRandomInt(0, 255) / 255.0,
      getRandomInt(0, 255) / 255.0],
    "diffuse": [getRandomInt(0, 255) / 255.0,
      getRandomInt(0, 255) / 255.0,
      getRandomInt(0, 255) / 255.0],
    "specular": [getRandomInt(0, 255) / 255.0,
      getRandomInt(0, 255) / 255.0,
      getRandomInt(0, 255) / 255.0],
    "shininess": getRandomInt(5, 50),
    "isReceivingLight": 1
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
  for (var i = 0; i < items.length; ++i) {
    var e = items[i];

    if (e.type == "sphere") {
      pushSphereData(e.numDivisions);
    } else if (e.type == "cylinder") {
      pushCylinderData(e.numDivisions);
    } else if (e.type == "cone") {
      pushConeData(e.numDivisions);
    }
  }
}

function pushSphereData(numDivisions) {

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

    }
  }
}


function pushCylinderData(numDivisions) {

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

  }

}


function pushConeData(numDivisions) {

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

function rgbStructToArray(rgb) {
  return [rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0, 1.0];
}

function rgbArrayToHex(rgb) {
  return rgbToHex(Math.floor(rgb[0] * 255.0), Math.floor(rgb[1] * 255.0), Math.floor(rgb[2] * 255.0));
}

function toInverseMat3(m)
{
    if ( !m.matrix ) {
        return "transpose(): trying to transpose a non-matrix";
    }

    // Cache the matrix values (makes for huge speed increases!)
    var a00 = m[0][0], a01 = m[0][1], a02 = m[0][2],
        a10 = m[1][0], a11 = m[1][1], a12 = m[1][2],
        a20 = m[2][0], a21 = m[2][1], a22 = m[2][2],

        b01 = a22 * a11 - a12 * a21,
        b11 = -a22 * a10 + a12 * a20,
        b21 = a21 * a10 - a11 * a20,

        d = a00 * b01 + a01 * b11 + a02 * b21,
        id;
    if (!d) { return null; }
    id = 1 / d;

    var result = mat3();

    result[0][0] = b01 * id;
    result[0][1] = (-a22 * a01 + a02 * a21) * id;
    result[0][2] = (a12 * a01 - a02 * a11) * id;
    result[1][0] = b11 * id;
    result[1][1] = (a22 * a00 - a02 * a20) * id;
    result[1][2] = (-a12 * a00 + a02 * a10) * id;
    result[2][0] = b21 * id;
    result[2][1] = (-a21 * a00 + a01 * a20) * id;
    result[2][2] = (a11 * a00 - a01 * a10) * id;
    return result;
};


function multMatVect( m, v )
{
    var result = [];

    if ( m.matrix  ) {
        if ( m[0].length != v.length ) {
            throw "multMatVect(): dimension mismatch";
        }

        for ( var i = 0; i < m.length; ++i ) {
            if ( m[i].length != v.length ) {
                throw "multMatVect(): dimension mismatch";
            }
        }

        for ( var i = 0; i < m.length; ++i ) {
            var sum = 0.0;
            for ( var j = 0; j < v.length; ++j ) {
                sum += m[i][j] * v[j];
            }
            result.push( sum );
        }

        return result;
    }
    else {
        throw "multMatVect(): 1st argument is not a matrix";
    }
}


function setCameraMatrix(zoom, theta, phi, x, y, z) {
    var eye = vec3(
        zoom * Math.sin(radians(theta)) * Math.cos(radians(phi)),
        zoom * Math.sin(radians(theta)) * Math.sin(radians(phi)),
        zoom * Math.cos(radians(theta))
    );
    cameraMatrix = lookAt(eye, [x, y, z] , [0.0, 1.0, 0.0]);
}

function loadGlobalUniform() {
    // set camera matrix and project matrix
    projectionMatrix = perspective(viewing.projection.fov, canvas.width / canvas.height, viewing.projection.near, viewing.projection.far);
    setCameraMatrix(viewing.camera.radius, viewing.camera.theta, viewing.camera.phi, viewing.camera.X, viewing.camera.Y, viewing.camera.Z);
    
    // load global uniforms
    gl.uniform1i(gl.getUniformLocation(program, "isAmbientLightOn"), lighting.ambientLightOn);
    gl.uniform1iv(gl.getUniformLocation(program, "isPointLightOn"), [lighting.pointLights[0].on,lighting.pointLights[1].on,lighting.pointLights[2].on]);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientLight"), flatten(lighting.ambientLight));
    gl.uniform4fv(gl.getUniformLocation(program, "pointLightSpecular"), flatten([lighting.pointLights[0].specular, lighting.pointLights[1].specular, lighting.pointLights[2].specular]));
    gl.uniform4fv(gl.getUniformLocation(program, "pointLightDiffuse"), flatten([lighting.pointLights[0].diffuse, lighting.pointLights[1].diffuse, lighting.pointLights[2].diffuse]));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "cameraMatrix"), false, flatten(cameraMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));
}

function loadObjectUniform(e) {
    gl.uniform1i(gl.getUniformLocation(program, "isReceivingLight"), e.isReceivingLight);
    gl.uniform1f(gl.getUniformLocation(program, "shininessObject"), e.shininess);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientObject"), flatten(e.ambient));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseObject"), flatten(e.diffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "specularObject"), flatten(e.specular));
    var modelViewMatrix = mult(cameraMatrix, translate(e.tX, e.tY, e.tZ));
        modelViewMatrix = mult(modelViewMatrix, rotate(e.rZ, [0, 0, 1]));
        modelViewMatrix = mult(modelViewMatrix, rotate(e.rY, [0, 1, 0]));
        modelViewMatrix = mult(modelViewMatrix, rotate(e.rX, [1, 0, 0]));
        modelViewMatrix = mult(modelViewMatrix, scalem(e.sX, e.sY, e.sZ));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
    var normalMatrix = toInverseMat3(modelViewMatrix);
    if (normalMatrix != null) {
        normalMatrix = transpose(normalMatrix);
        gl.uniformMatrix3fv(gl.getUniformLocation(program, "normalMatrix"), false, flatten(normalMatrix));
    }
    
    gl.uniform4fv(gl.getUniformLocation(program, "pointLightPos"), flatten([multMatVect(cameraMatrix, vec4(pointLightPos[0], 1.0)), 
                                                                            multMatVect(cameraMatrix, vec4(pointLightPos[1], 1.0)), 
                                                                            multMatVect(cameraMatrix, vec4(pointLightPos[2], 1.0))]));
}

function setAnimatedLighting() {
  var pointLightPosOriginal = [lighting.pointLights[0].position, lighting.pointLights[1].position, lighting.pointLights[2].position];
  var sT = [Math.sin(radians(pointLightCurrentTheta[0])), 
            Math.sin(radians(pointLightCurrentTheta[1])), 
            Math.sin(radians(pointLightCurrentTheta[2]))];
  var cT = [Math.cos(radians(pointLightCurrentTheta[0])), 
            Math.cos(radians(pointLightCurrentTheta[1])), 
            Math.cos(radians(pointLightCurrentTheta[2]))];
  
  pointLightPos[0] = [pointLightPosOriginal[0][0] * sT[0], pointLightPosOriginal[0][1] * cT[0], pointLightPosOriginal[0][2]];
  pointLightPos[1] = [pointLightPosOriginal[1][0] * sT[1], pointLightPosOriginal[1][1], pointLightPosOriginal[1][2] * cT[1]];
  pointLightPos[2] = [pointLightPosOriginal[2][0], pointLightPosOriginal[2][1] * sT[2], pointLightPosOriginal[2][2] * cT[2]];
  
  for (var i = 0; i < 3; ++i) {
    pointLightCurrentTheta[i] += lighting.pointLights[i].moving ? lighting.pointLights[i].speed : 0.0;
  }
}

function render() {
  
  setAnimatedLighting();
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  loadGlobalUniform();
  
  var pointsCounter = 0;

  for (var t = 0; t < items.length; ++t) {
    
    var e = items[t];

    loadObjectUniform(e);
    
    var numPointsSphere = Math.pow(e.numDivisions, 2) * 4.0;
    var numPointsCylinder = e.numDivisions * 10;
    var numPointsCone = e.numDivisions * 4;



    var thetaLoc = gl.getUniformLocation(program, 'theta');
    var scaleLoc = gl.getUniformLocation(program, 'scale');
    var translateLoc = gl.getUniformLocation(program, 'translate');
    gl.uniform3fv(thetaLoc, [e.rX, e.rY, e.rZ]);
    gl.uniform3fv(scaleLoc, [e.sX, e.sY, e.sZ]);
    gl.uniform3fv(translateLoc, [e.tX, e.tY, e.tZ]);


    if (items[t].type == "sphere") {
      if (drawFace == 1) {
        for (var i = 0; i < numPointsSphere; i += 4) {
          gl.drawArrays(gl.TRIANGLE_FAN, pointsCounter + i, 4);
        }
      }
      if (drawEdge == 1) {
        for (var i = 0; i < numPointsSphere; i += 4) {
          gl.drawArrays(gl.LINE_STRIP, pointsCounter + i, 4);
        }
      }
      pointsCounter += numPointsSphere;
    } else if (items[t].type == "cylinder") {
      if (drawFace == 1) {
        for (var i = 0; i < numPointsCylinder; i += 10) {
          gl.drawArrays(gl.TRIANGLE_FAN, pointsCounter + i, 4);
          gl.drawArrays(gl.TRIANGLE_STRIP, pointsCounter + i + 4, 3);
          gl.drawArrays(gl.TRIANGLE_STRIP, pointsCounter + i + 7, 3);
        }
      }
      if (drawEdge == 1) {
        for (var i = 0; i < numPointsCylinder; i += 10) {
          gl.drawArrays(gl.LINE_STRIP, pointsCounter + i, 4);
          gl.drawArrays(gl.LINE_STRIP, pointsCounter + i + 4, 3);
          gl.drawArrays(gl.LINE_STRIP, pointsCounter + i + 7, 3);
        }
      }
      pointsCounter += numPointsCylinder;
    } else if (items[t].type == "cone") {
      if (drawFace == 1) {
        for (var i = 0; i < numPointsCone; i += 4) {
          gl.drawArrays(gl.TRIANGLE_STRIP, pointsCounter + i, 4);
        }
      }
      if (drawEdge == 1) {
        for (var i = 0; i < numPointsCone; i += 4) {
          gl.drawArrays(gl.LINE_STRIP, pointsCounter + i, 4);
        }
      }
      pointsCounter += numPointsCone;
    }

  }
  
  requestAnimFrame(render);
}