"use strict";

var canvas;
var gl;

var points = [];

var numTimesToSubdivide = 6;
var maxNumTimesToSubdivide = 8;

var shape = "triangle";
var verticesTriangle;
var verticesSquare;
var style = "solid";

var theta = 0.0;
var thetaStep = 0.1;
var twistFactor = 1;

var isAnimating = false;
var delay = 10;
var direction = true;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the corners of the shape with points.

    verticesTriangle = [
        vec2( -0.5, -Math.sqrt(3) / 6.0 ),
        vec2(  0,  Math.sqrt(3) / 3.0 ),
        vec2(  0.5, -Math.sqrt(3) / 6.0 )
    ];
    verticesSquare = [
        vec2( -0.5, -0.5 ),
        vec2( -0.5,  0.5 ),
        vec2(  0.5,  0.5 ),
        vec2(  0.5, -0.5 )
    ];
    
    // Prepare a zero array with the size for maximum allowed recursion.
    // If not do so, the buffer size should be increased when updating the 
    // recursion times setting.
    for (var i = 0; i < Math.pow(4, maxNumTimesToSubdivide) * 3; ++i) {
        points.push(vec2(0, 0));
    }
    // Or just run the recursion on the maximum possible loop once to 
    // get the array for the maximum allowed size the lazy way.

    
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Calculate the correct triangle point array
    prepareShape();
    
    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var sliderSubdivision = new Slider("#sliderSubdivision");
    sliderSubdivision.on("change", function(slideEvt) {
        numTimesToSubdivide = parseFloat(sliderSubdivision.getValue());
        setTimeout( function (){ prepareShape();}, 0 );
        // prepareShape();
        // Do not call render() here upon updating parameters, since render()
        // is handled by the timeOut for redrawing repeatedly.
    });

    var sliderTwist = new Slider("#sliderTwist");
    sliderTwist.on("change", function(slideEvt) {
        twistFactor = parseFloat(sliderTwist.getValue());
    });

    var sliderAngle = new Slider("#sliderAngle");
    sliderAngle.on("change", function(slideEvt) {
        theta = parseFloat(sliderAngle.getValue()) * Math.PI / 180.0;
    });
    
    // if not using bootstrap-slider, use this method below, and onchange is 
    // triggered after release the mouse, oninput is triggered before release the mouse.
    // document.getElementById("sliderTwist").oninput = function() {
    //     twistFactor = event.srcElement.value;
    // };


    document.getElementById("buttonToggleAnimation").onclick = function() {
        isAnimating = !isAnimating;
    };
    
    document.getElementById("buttonChangeDirection").onclick = function() {
        direction = !direction;
    };
    
    
    var sliderSpeed = new Slider("#sliderSpeed");
    sliderSpeed.on("change", function(slideEvt) {
        thetaStep = parseFloat(sliderSpeed.getValue());
    });

    
    for (var i = 0; i < document.formShape.radioShape.length; ++i) {
        document.formShape.radioShape[i].onclick = function() {
            if (this.value == "triangle") {
                shape = "triangle";
                prepareShape();
            }
            if (this.value == "square") {
                shape = "square";
                prepareShape();
            }
        }
    }

    for (var i = 0; i < document.formStyle.radioStyle.length; ++i) {
        document.formStyle.radioStyle[i].onclick = function() {
            if (this.value == "solid") {
                style = "solid";
                prepareShape();
            } else if (this.value == "gasket") {
                style = "gasket";
                prepareShape();    
            } else if (this.value == "wireframe") {
                style = "wireframe";
                prepareShape();
            }
        }
    }

    render();
};

function prepareShape() {
    if (shape == "triangle") {
        points = [];
        divideTriangle( verticesTriangle[0], verticesTriangle[1], verticesTriangle[2],
                        numTimesToSubdivide);        
    }
    if (shape == "square") {
        points = [];
        divideSquare( verticesSquare[0], verticesSquare[1], verticesSquare[2], verticesSquare[3], 
                      numTimesToSubdivide);
    }
    
}

function divideTriangle( a, b, c, count )
{

    // check for end of recursion

    if ( count == 0 ) {
        points.push( a, b, c );
    } else {

        // bisect the sides

        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        // three new triangles

        divideTriangle( a, ab, ac, count );
        divideTriangle( c, ac, bc, count );
        divideTriangle( b, bc, ab, count );
        if (style != "gasket") {
            divideTriangle( bc, ab, ac, count );
        }
    }
}

function divideSquare( a, b, c, d, count ) {
    
    // This solution for dividing square is not fractal.
    
    // Since the recursion method doesn't meet the requirement of the 
    // triangle strip ordering, here use iteration instead.
    
    var squaresPerEdge = Math.pow(2, numTimesToSubdivide);
    var smallSquareLengthPortion = 1.0 / squaresPerEdge;
    for (var i = 0; i < Math.pow(2, numTimesToSubdivide); ++i) {
        var startA = mix( d, a, i * smallSquareLengthPortion);
        var startD = mix( d, a, (i + 1) * smallSquareLengthPortion);
        var startB = mix( c, b, i * smallSquareLengthPortion);
        var startC = mix( c, b, (i + 1) * smallSquareLengthPortion);
        
        points.push( startA, startD );
        if (style == "solid") {
            for (var j = 0; j < squaresPerEdge; ++j) {
                points.push( mix(startB, startA, (j + 1) * smallSquareLengthPortion), 
                             mix(startC, startD, (j + 1) * smallSquareLengthPortion) );
            }
        } else if (style == "wireframe") {
            for (var j = 0; j < squaresPerEdge; ++j) {            
                if (j % 2 == 0) {
                    points.push( mix(startC, startD, (j + 1) * smallSquareLengthPortion), 
                                 mix(startB, startA, (j + 1) * smallSquareLengthPortion) );
                } else {
                    points.push( mix(startB, startA, (j + 1) * smallSquareLengthPortion), 
                                 mix(startC, startD, (j + 1) * smallSquareLengthPortion) );                    
                }
            }
        } else if (style == "gasket") {
            
            if (count == 0) { // special case: prevent drawing a triangle when no division
                points.push( startC, startB );
            } else {
            
                for (var j = 0; j < squaresPerEdge; ++j) {            
                    if (j % 2 == 0) {
                        if (i % 2 == 0) {
                            points.push( mix(startB, startA, (j + 1) * smallSquareLengthPortion) );
                        } else {
                            points.push( mix(startC, startD, (j + 1) * smallSquareLengthPortion) );
                        }
                    } else {
                        points.push( mix(startC, startD, (j + 1) * smallSquareLengthPortion), 
                                     mix(startB, startA, (j + 1) * smallSquareLengthPortion) );             
                    }
                }
                
            }
        }
    }
}


function render()
{
    if (isAnimating) {
        theta += (direction ? thetaStep : -thetaStep);
    }

    // If rotating from last frame, inner points will rotate faster.
    var newPoints = [];
    for (var i = 0; i < points.length; ++i) {
        // there was a typo, sqrt(... , ...), which made it non-symmetric.
        var radius = Math.sqrt(Math.pow(points[i][0], 2) + Math.pow(points[i][1], 2)) / (Math.sqrt(3) / 2);
        var cosAngle = Math.cos(theta + twistFactor * radius * Math.PI);
        var sinAngle = Math.sin(theta + twistFactor * radius * Math.PI);
        var xp = points[i][0] * cosAngle - points[i][1] * sinAngle;
        var yp = points[i][0] * sinAngle + points[i][1] * cosAngle;
        newPoints.push( vec2(xp, yp) );
    }
    
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(newPoints));
    
    gl.clear( gl.COLOR_BUFFER_BIT );

    if (shape == "triangle") {
        if (style == "solid" || style == "gasket") {
            gl.drawArrays( gl.TRIANGLES, 0, points.length );
        } else if (style == "wireframe") {
            for (var i = 0; i < points.length / 3; ++i) {
                gl.drawArrays( gl.LINE_LOOP, i * 3, 3 );
            }
        }
    } else if (shape == "square") {
        if (style == "solid") {
            
            var stripCount = 2 + 2 * Math.pow(2, numTimesToSubdivide);
            for (var i = 0; i < Math.pow(2, numTimesToSubdivide); ++i) {
                gl.drawArrays( gl.TRIANGLE_STRIP, i * stripCount, stripCount);
            }
            
        } else if (style == "gasket") {
            
            if (numTimesToSubdivide == 0) { // special case handling
                gl.drawArrays( gl.TRIANGLE_FAN, 0, 4);
            }
        
            var stripCount = 2 + 3 * Math.pow(2, numTimesToSubdivide - 1);
            for (var i = 0; i < Math.pow(2, numTimesToSubdivide); ++i) {
                for (var j = 0; j < Math.pow(2, numTimesToSubdivide); ++j) {
                    if (j % 2 == 0) {
                        gl.drawArrays( gl.TRIANGLES, i * stripCount + j / 2 * 3, 3);
                    } else {
                        gl.drawArrays( gl.TRIANGLES, i * stripCount + (j + 1) / 2 * 3 - 1, 3);
                    }
                }            
            }
            
        } else if (style == "wireframe") {
            
            var stripCount = 2 + 2 * Math.pow(2, numTimesToSubdivide);
            for (var i = 0; i < Math.pow(2, numTimesToSubdivide); ++i) {
                for (var j = 0; j < Math.pow(2, numTimesToSubdivide); ++j) {
                    gl.drawArrays( gl.LINE_LOOP, i * stripCount + j * 2, 4);
                }
            }
            
        }
    }

    setTimeout(
        function (){requestAnimFrame(render);}, delay
    );

}
