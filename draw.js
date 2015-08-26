
var canvas;
var gl;
var program;

var maxNumVertices = 1000;
var index = 0;


var currentColor = vec4(44.0 / 255, 62.0 / 255, 80.0 / 255, 1);

var lastPos = vec2( 0.0, 0.0 );

var lastPosVectoring = vec2( 0.0, 0.0 );


// var t1, t2, t3, t4;
// var lastT1 = vec2( 0.0, 0.0 );
// var lastT2 = vec2( 0.0, 0.0 );
// var reverted = false;

var deltaDrawing = 0.0001;
var deltaVectoring = 0.00001;


var lineWidth = 0.05;

var drawing = false;

var shapeIndexes = [0];

var pointsBackup = [];
var colorsBackup = [];

var vBuffer;
var cBuffer;

var lineStyle = "line";
var lineWidthsForLineMode = [];

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );


    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumVertices, gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    
    
    $("#buttonClear").click(function() {
        clearCanvas();
    });
    $(".pick-a-color").pickAColor({inlineDropdown: true});
    $("#brush-color input").on("change", function () {
        // console.log(hexToRgb($(this).val()));
        var rgbColor = hexToRgb($(this).val());
        currentColor = vec4(rgbColor.r / 255.0, rgbColor.g / 255.0, rgbColor.b / 255.0, 1.0);
    });
    
    var sliderWidth = new Slider("#sliderWidth");
    sliderWidth.on("change", function(slideEvt) {
        lineWidth = parseFloat(sliderWidth.getValue()) / 5.0;
    });

    for (var i = 0; i < document.formStyle.radioStyle.length; ++i) {
        document.formStyle.radioStyle[i].onclick = function() {
            if (this.value == "line") {
                lineStyle = "line";
                clearCanvas();
            }
            if (this.value == "blade") {
                lineStyle = "blade";
                clearCanvas();
            }
        }
    }

    canvas.addEventListener("mousemove", function(event){

        if (!drawing) return;
        
        if (index >= maxNumVertices) {
            
            maxNumVertices *= 2;
                        
            vBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumVertices, gl.STATIC_DRAW);
            
            var vPosition = gl.getAttribLocation( program, "vPosition");
            gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);
            
            cBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW );
            
            var vColor = gl.getAttribLocation( program, "vColor");
            gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vColor);
            
            gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
            for (var i = 0; i < index; ++i) {
                gl.bufferSubData(gl.ARRAY_BUFFER, 8*i, flatten(vec2(pointsBackup[i])));
            }
            
            gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
            for (var i = 0; i < index; ++i) {
                gl.bufferSubData(gl.ARRAY_BUFFER, 16*i, flatten(vec4(colorsBackup[i])));
            }
            
        }
        
        var mousePos = getMousePos(canvas, event);
            
        var currentPos = vec2(2*mousePos.x/canvas.width-1, 
            2*(canvas.height-mousePos.y)/canvas.height-1);

        // (has problem for now)
        // if (currentPos[0] < -1.0 || currentPos[0] > 1.0 || currentPos[1] < -1.0 || currentPos[1] > 1.0) {
        //     // stop drawing when drawing outside of the canvas
        //     drawing = false;
        //     shapeIndexes.push(index);
        //     return;
        // }

        if (Math.pow(currentPos[0] - lastPos[0], 2) + Math.pow(currentPos[1] - lastPos[1], 2)
            < deltaDrawing) return;
            
            
        if (lineStyle == "line") {
            

            
            gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
            
            gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(lastPos))
            gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+1), flatten(currentPos))

            
            pointsBackup.push(lastPos);
            pointsBackup.push(currentPos);
            
            gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
            index += 2;

            t = currentColor;

            colorsBackup.push(t);
            colorsBackup.push(t);
            
            gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-2), flatten(t));
            gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-1), flatten(t));
            
            lastPos = currentPos;
            
            
        } else if (lineStyle == "blade") {
            
                
            var trackVec = vec2(currentPos[0] - lastPosVectoring[0], currentPos[1] - lastPosVectoring[1]);
            var longEdge = Math.sqrt(Math.pow(trackVec[0], 2) + Math.pow(trackVec[1], 2));
            var sinTheta = trackVec[1] / longEdge;
            var cosTheta = trackVec[0] / longEdge;
            
            gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);

            
            var t1 = vec2(currentPos[0] + lineWidth/2 * sinTheta, currentPos[1] + lineWidth/2 * cosTheta);
            var t2 = vec2(currentPos[0] - lineWidth/2 * sinTheta, currentPos[1] - lineWidth/2 * cosTheta);
            
            
            // This method fails to address the flipping brush problem.
            // http://math.stackexchange.com/questions/162728/how-to-determine-if-2-points-are-on-opposite-sides-of-a-line
            // x1y1->t1, x2y2->lastT1, xaya->t2, xbyb->lastT2
            // if ( ((t1[1]-lastT1[1])*(t2[0]-t1[0])+(lastT1[0]-t1[0])*(t2[1]-t1[1])) * 
            //      ((t1[1]-lastT1[1])*(lastT2[0]-t1[0])+(lastT1[0]-t1[0])*(lastT2[1]-t1[1])) < 0) {
            //     console.log("rev");
            //     reverted = !reverted;
            //     lastT1 = t2;
            //     lastT2 = t1;
            // } else {
            //     lastT1 = t1;
            //     lastT2 = t2;
            // }
            // if (!reverted) {
            //     gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(t1))
            //     gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+1), flatten(t2))
            // } else {
            //     gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(t2))
            //     gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+1), flatten(t1))
            // }
                 
            
            
            // This simpler method doesn't consider blade brush reverting:
            gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(t1))
            gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+1), flatten(t2))
            
            pointsBackup.push(t1);
            pointsBackup.push(t2);
            
            
            // gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(lastPos));
            // gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(currentPos));
            
            gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
            index += 2;

            t = currentColor;
            
            colorsBackup.push(t);
            colorsBackup.push(t);
            
            // gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-4), flatten(t));
            // gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-3), flatten(t));
            gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-2), flatten(t));
            gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-1), flatten(t));
            
            lastPos = currentPos;
            if (Math.pow(currentPos[0] - lastPosVectoring[0], 2) + Math.pow(currentPos[1] - lastPosVectoring[1], 2)
                > deltaVectoring) lastPosVectoring = currentPos;
                
            // Change to this line results reverting brush for thick lines
            // if (Math.pow(currentPos[0] - lastPos[0], 2) + Math.pow(currentPos[1] - lastPos[1], 2)
            //     > deltaVectoring) lastPosVectoring = currentPos;

        }

    } );

    canvas.addEventListener("mousedown", function(event){
        drawing = true;
        if (lineStyle == "line") { // special handling for line mode
            var mousePos = getMousePos(canvas, event);
            
            lastPos = vec2(2*mousePos.x/canvas.width-1, 
                2*(canvas.height-mousePos.y)/canvas.height-1);

            lineWidthsForLineMode.push(lineWidth * 50.0);
        }
    });
    
    canvas.addEventListener("mouseup", function(event){
        drawing = false;
        shapeIndexes.push(index);
    });
    

    render();
}

function clearCanvas() {
    
    pointsBackup = [];
    colorsBackup = [];
    shapeIndexes = [0];
    lineWidthsForLineMode = [];
    index = 0;

}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}
      
function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    
    if (lineStyle == "line") {
        
        for (var i = 0; i < shapeIndexes.length - 1; ++i) {
            gl.lineWidth(lineWidthsForLineMode[i]);
            gl.drawArrays( gl.LINES, shapeIndexes[i], shapeIndexes[i+1] - shapeIndexes[i]);
        }

        if (drawing) {
            gl.lineWidth(lineWidthsForLineMode[shapeIndexes.length-1]);
            gl.drawArrays( gl.LINES, shapeIndexes[shapeIndexes.length-1], index - shapeIndexes[shapeIndexes.length-1]);
        }
        
        
    
    } else if (lineStyle == "blade") {

        // Draw them all results in blade brush when turning
        for (var i = 0; i < shapeIndexes.length - 1; ++i) {
            gl.drawArrays( gl.TRIANGLE_STRIP, shapeIndexes[i], shapeIndexes[i+1] - shapeIndexes[i]);
        }
        
        if (drawing) {
            gl.drawArrays( gl.TRIANGLE_STRIP, shapeIndexes[shapeIndexes.length-1], index - shapeIndexes[shapeIndexes.length-1]);
        }
        
        // for(var i = 0; i<index; i+=4) 
        //     gl.drawArrays( gl.TRIANGLE_STRIP, i, 4);
            // if (i < index - 1) gl.drawArrays( gl.TRIANGLE_STRIP, i + 2, 4 );
        // }
    }
    
    window.requestAnimFrame(render);

}
