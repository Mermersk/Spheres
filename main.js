import * as twgl from "./twgl-full.module.js";
import { m4 } from "./twgl-full.module.js";

console.log("hello i am underwater")

const canvas = document.getElementById("c");
//canvas.width = window.innerWidth
//canvas.height = window.innerHeight
const gl = canvas.getContext("webgl2")

const vertexShaderPromise = fetch("./main.vert").then(
    (response) => {
        return response.text().then( (text) => {
            return text;
        })
    }
)

const fragmentShaderPromise = fetch("./main.frag").then(
    (response) => {
        return response.text().then( (text) => {
            return text;
        })
    }
)

console.log(twgl.isWebGL2(gl))
Promise.all([vertexShaderPromise, fragmentShaderPromise]).then((shadersText) => {
    console.log(shadersText)
    
    const programInfo = twgl.createProgramInfo(gl, shadersText)


    const circleArray = {
        a_position: {numComponents: 3, data: gsv()}
    }

   //console.log(circleArray)
    
    //console.log(generateTexCoordsFromNonIndexedBuff(arrays.a_position.data))
    //arrays.a_texcoords.data = generateTexCoordsFromNonIndexedBuff(arrays.a_position.data)//.concat(generateTexCoordsFromNonIndexedBuff2(arrays.a_position.data))
    //console.log(arrays)

    const modelMatrix = m4.identity()
                                    //x, y, z
    const scalingMatrix = m4.scaling([1.8, 1.8, 1.8])
    /*
        Pro tip regarding rotation: rotationX and rotationY and so on only rotate a single axis.
        If I want to rotate a 2d shape(and such that it keeps the shape) then use rotationZ.

        3D Rotation is more complicated than 2D rotation since we must specify an axis of rotation. 
        In 2D the axis of rotation is always perpendicular to the xy plane, i.e., 
        the Z axis, but in 3D the axis of rotation can have any spatial orientation
    */
    const rotationMatrix = m4.rotationX(1.57)//m4.multiply(m4.rotationX(1.5), m4.rotationY(1.5))
    const translationMatrix = m4.translation([0, 0, 0])
    //
    let viewMatrix = m4.lookAt([0, 0, 4], //// Camera is at (4,3,3), in World Space
                                 [0, 0, 0], // and looks at the origin
                                 [0, 1, 0]) // Head is up (set to 0,-1,0 to look upside-down)
    m4.inverse(viewMatrix, viewMatrix) //OBS: in the tutorial I am following I have to use inverse of result matrix that twgl.lookAt produces 
    const projectionMatrix = m4.perspective(1.1, // The vertical Field of View, in radians: the amount of "zoom". Think "camera lens". Usually between 90° (extra wide) and 30° (quite zoomed in)
                                            canvas.width / canvas.height, // Aspect Ratio. Depends on the size of your window. Notice that 4/3 == 800/600 == 1280/960
                                            0.1, // Near clipping plane
                                            100.0) // Far clipping plane.
    const orthoMatrix = m4.ortho(-5, 5, -5, 5, 5, -5);
    //console.log(ppm(orthoMatrix))
    m4.multiply(modelMatrix, translationMatrix, modelMatrix)
    m4.multiply(modelMatrix, rotationMatrix, modelMatrix)
    m4.multiply(modelMatrix, scalingMatrix, modelMatrix)
    console.log("Model Matrix:")
    console.log(ppm(modelMatrix))
    //console.log(ppm(translationMatrix))
    //console.log(ppm(scalingMatrix))
    //console.log(ppm(rotationMatrix))
    console.log("View Matrix")
    console.log(ppm(viewMatrix))
    //console.log("Projection Matrix")
    //console.log(ppm(projectionMatrix))

    let circleBuffer = twgl.createBufferInfoFromArrays(gl, circleArray)
  

    //enabling depth testing, so that only vertices/triangles/fragments that are visible are drawn
    //it  tests the depth value of a fragment against the content of the depth buffer.
    //performs a depth test and if this test passes, the fragment is rendered and the depth buffer is updated with the new depth value. 
    //If the depth test fails, the fragment is discarded.
    //By default the depth function GL_LESS is used that discards all the fragments that have a depth value higher than or equal to the current depth buffer's value.
    //The depth buffers range is usually 0<->1 (-1<->1 ?). values close to 0 is close to the camera (the near clipping plane)
    //and values close to 1 are far away, close to the far clipping plane (clipping planes see perspective matrix)
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    const nordnesTex = twgl.createTexture(gl, {src: "nordnes.jpg"})

    const uniforms = {
        u_time: 0,
        u_resolution: [canvas.clientWidth, canvas.clientHeight],
        u_model: modelMatrix,
        u_view: viewMatrix,
        u_projection: projectionMatrix,
        u_nordNesTex: nordnesTex
    }

    let framecounter = 0;

    const draw = (time) => {
        const timeInSeconds = time * 0.001;
        const scalingMatrix = m4.scaling([1, 1, 1])
        const rotationMatrix = m4.rotationZ(0.001)
        const rotMatrixY = m4.rotationY(0.015)
        const translationMatrix = m4.translation([0, 0, 0])
        //m4.multiply(modelMatrix, translationMatrix, modelMatrix)
        m4.multiply(modelMatrix, rotationMatrix, modelMatrix)
        //m4.multiply(modelMatrix, rotMatrixY, modelMatrix)
        //m4.multiply(modelMatrix, scalingMatrix, modelMatrix)
      

        gl.useProgram(programInfo.program)
        gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight)
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)
        
        uniforms.u_time = timeInSeconds
        console.log(timeInSeconds)

        twgl.setUniforms(programInfo, uniforms)
    
        twgl.setBuffersAndAttributes(gl, programInfo, circleBuffer)
        twgl.drawBufferInfo(gl, circleBuffer, gl.POINTS)
        
        framecounter++
        requestAnimationFrame(draw)
    }
    
    requestAnimationFrame(draw)
})


/* 
The Model, View and Projection matrices. Ofthen combined into one: mvp for 3D scenes.

Model matrix: Acts on the local space of the model. For example our triangle =
-1, -1,
-1, 1,
1, -1,
is defined like this where we have 3 vertices and the center is vec3(0, 0, 0). What the model matrix does is
take us from this local space(model space) and to world space. The model matrix usually contains stuff like:
translations, scaling and rotation.  Once the model matrix is applied then the vertices are effectively 
in world space (Their origin/vertices is defined to be the center of the world.) In local space the origin/vertices
are defined to be the in the center of the model.
Model coordinates x modelMatrix = world coordinates

OBS: usually we want these operations in this order: scaling -> rotation -> translation. Beaware in matrix multiplication order we write:
T * R * S (This means first scaling, then rotation, then translation)


*/

//Pretty print a matrix
function ppm(am) {
    const newam = m4.transpose(am)
    const outString = `
${newam.slice(0, 4).join("   ")}
${newam.slice(4, 8).join("   ")}
${newam.slice(8, 12).join("   ")}
${newam.slice(12, 16).join("   ")}`

    return outString
}

function generateSphereStackVertices(numCircles = 120) {
    /*  Plan

    */
    let out = []

    let zValue = 1.0
    const zIncrement = 2.0 / numCircles

    let radius = 0.0
    const radiusIncrement = 1.0 / numCircles
    for (let i = 0; i < numCircles; i++) {
        zValue -= zIncrement;
        if (i < (numCircles / 2)) {
            radius += radiusIncrement 
        } else {
            radius -= radiusIncrement 
        }
        
        const oneCircle = generateCircleVertices3D(36, zValue, radius)
        console.log(...oneCircle)
        out.push(...oneCircle)
    }

    console.log(out)

    return out

}

//Generate sphere vertices
function gsv(numSectors = 36, numStacks = 36, radius = 1.0) {

    let out = []

    //Stack angles go from  90° to -90° (pi/2 to -pi/2)
    const stackAngleIncrement = Math.PI / numStacks
    //Sector angles go from 0° to 360° (0 to 2pi)
    const sectorAngleIncrement = (Math.PI * 2.0) / numSectors
    let currentStackAngle = Math.PI / 2.0;
    for (let i = 0; i < numStacks; i++) {
        currentStackAngle -= (stackAngleIncrement)
        console.log("CurrentStackAngle:  " + currentStackAngle)
        for (let v = 0; v < numSectors; v++) {
            const currentSectorAngle = ((v+1) * sectorAngleIncrement)

            const x = (radius * Math.cos(currentStackAngle)) * Math.cos(currentSectorAngle)

            const y = (radius * Math.cos(currentStackAngle)) * Math.sin(currentSectorAngle)

            const z = radius * Math.sin(currentStackAngle)
            
            //console.log(x)
            out.push(x)
            out.push(y)
            out.push(z)

            //out.push(x)
            //out.push(y)
            //out.push(z)
            //console.log(currentSectorAngle)

            if (i !== 0) {
                //Previous sector point for current x,y,z
                const prevSectorx = (radius * Math.cos(currentStackAngle)) * Math.cos(currentSectorAngle - sectorAngleIncrement)
                const prevSectory = (radius * Math.cos(currentStackAngle)) * Math.sin(currentSectorAngle - sectorAngleIncrement)
                const prevSectorz = radius * Math.sin(currentStackAngle)

                //Previous stack point for current x,y,z
                const prevStackx = (radius * Math.cos(currentStackAngle + stackAngleIncrement)) * Math.cos(currentSectorAngle)
                const prevStacky = (radius * Math.cos(currentStackAngle + stackAngleIncrement)) * Math.sin(currentSectorAngle)
                const prevStackz = radius * Math.sin(currentStackAngle + stackAngleIncrement)

                //The previous sector+stack point for current x,y,x
                const prevSectorStackx = (radius * Math.cos(currentStackAngle + stackAngleIncrement)) * Math.cos(currentSectorAngle - sectorAngleIncrement)
                const prevSectorStacky = (radius * Math.cos(currentStackAngle + stackAngleIncrement)) * Math.sin(currentSectorAngle - sectorAngleIncrement)
                const prevSectorStackz = radius * Math.sin(currentStackAngle +  stackAngleIncrement)

                //1 triangle:
                /*
                out.push(prevSectorx)
                out.push(prevSectory)
                out.push(prevSectorz)

                out.push(prevSectorStackx)
                out.push(prevSectorStacky)
                out.push(prevSectorStackz)

                //2 triangle
                out.push(x)
                out.push(y)
                out.push(z)

                out.push(prevSectorStackx)
                out.push(prevSectorStacky)
                out.push(prevSectorStackz)

                out.push(prevStackx)
                out.push(prevStacky)
                out.push(prevStackz)
                */


            }
        }
        
        
    }

    console.log(out)
    return out
}

gsv()

function generateCircleVertices3D(numVert, zVal, radius) {
    
    let out = [0, 0, zVal]
    const travelAmount = (Math.PI * 2.0) / numVert //How long to travel along the circle, depends on number of vertices
    out.push(+Math.cos(travelAmount).toFixed(3) * radius)
    out.push(+Math.sin(travelAmount).toFixed(3) * radius)
    out.push(zVal)

    for (let i = 1; i < numVert; i++) {
        const travelAccumulator = travelAmount * (i+1)
        console.log("Travel Accumulator: " + travelAccumulator)
        const x = Math.cos(travelAccumulator).toFixed(3) * radius
        console.log("X: " + x)
        const y = Math.sin(travelAccumulator).toFixed(3) * radius
        console.log("Y: " + y)
        //const z = ((Math.random() * 2) - 1);
        
        out.push(+x)
        out.push(+y)
        out.push(zVal)

        out.push(0)
        out.push(0)
        out.push(zVal)

        out.push(+x)
        out.push(+y)
        out.push(zVal)
    }

    //To close the cricle
    out.push(+Math.cos(travelAmount).toFixed(3) * radius)
    out.push(+Math.sin(travelAmount).toFixed(3) * radius)
    out.push(zVal)

    return out
}

function generateCircleVertices(radius, numVertices) {
    let out = [0, 0]
    //JS trigonometric functions take in radians.
    const travelAmount = (Math.PI * 2.0) / numVertices //How long to travel along the circle, depends on number of vertices
    out.push(+Math.cos(travelAmount).toFixed(3))
    out.push(+Math.sin(travelAmount).toFixed(3))
    console.log("travelAmount each iteration: " + travelAmount)
    for (let i = 1; i < numVertices; i++) {
        const travelAccumulator = travelAmount * (i+1)
        console.log("Travel Accumulator: " + travelAccumulator)
        const x = Math.cos(travelAccumulator).toFixed(3)
        console.log("X: " + x)
        const y = Math.sin(travelAccumulator).toFixed(3)
        console.log("Y: " + y)
        
        out.push(+x)
        out.push(+y)

        //if( (i+1) % 3 === 0) {
            out.push(0)
            out.push(0)
        //}
        out.push(+x)
        out.push(+y)
    }
    out.push(+Math.cos(travelAmount).toFixed(3))
    out.push(+Math.sin(travelAmount).toFixed(3))
    console.log("Circle construction finished")
    console.log(out)
    
    return out

}

function* circleVertGenerator(numVert) {
    let counter = 0
    let out = [0, 0]
    const travelAmount = (Math.PI * 2.0) / numVert //How long to travel along the circle, depends on number of vertices
    out.push(+Math.cos(travelAmount).toFixed(3))
    out.push(+Math.sin(travelAmount).toFixed(3))

    while (counter < numVert) {
        const travelAccumulator = travelAmount * (counter+1)
        console.log("Travel Accumulator: " + travelAccumulator)
        const x = Math.cos(travelAccumulator).toFixed(3)
        console.log("X: " + x)
        const y = Math.sin(travelAccumulator).toFixed(3)
        console.log("Y: " + y)
        
        out.push(+x)
        out.push(+y)

        out.push(0)
        out.push(0)

        out.push(+x)
        out.push(+y)
        counter++
        yield out
    }

    return out
}

function* circleVertGenerator3D(numVert) {
    let counter = 0
    let out = [0, 0, 0]
    const travelAmount = (Math.PI * 2.0) / numVert //How long to travel along the circle, depends on number of vertices
    out.push(+Math.cos(travelAmount).toFixed(3))
    out.push(+Math.sin(travelAmount).toFixed(3))
    out.push(+Math.sin(travelAmount).toFixed(3))

    while (counter < numVert) {
        const travelAccumulator = travelAmount * (counter+1)
        console.log("Travel Accumulator: " + travelAccumulator)
        const x = Math.cos(travelAccumulator).toFixed(3)
        console.log("X: " + x)
        const y = Math.sin(travelAccumulator).toFixed(3)
        console.log("Y: " + y)
        const z = ((Math.random() * 2) - 1);
        
        out.push(+x)
        out.push(+y)
        out.push(z)

        out.push(0)
        out.push(0)
        out.push(0)

        out.push(+x)
        out.push(+y)
        out.push(z)
        counter++
        yield out
    }

    return out
}

//let ii = circleVertGenerator(70)
//console.log(ii.next())
//console.log(ii.next())
//console.log(ii.next())

function* makeCircleVertIterator(start = 0, end = Infinity, step = 1) {
    let iterationCount = 0
    let circleVertices = generateCircleVertices(0, 70)
    let fillSlowly = []
    
    while (circleVertices.length > 0) {
        const randIndex = Math.round((Math.random() * circleVertices.length))
        const vertToAdd = circleVertices.splice(randIndex, 2)
        console.log("Vert ot add: ")
        console.log(vertToAdd)
        fillSlowly.push(...vertToAdd)
        console.log(fillSlowly)
        
        yield fillSlowly
        iterationCount++
    }

    return iterationCount
    //yield iterationCount
    
}

/*
const ii = makeCircleVertIterator()
console.log(ii.next())
console.log(ii.next())
console.log(ii.next())
console.log(ii.next())
console.log(ii.next())
console.log(ii.next())
*/

function generateTexCoordsFromNonIndexedBuff(positions) {
    let out = []
    //positions = positions.reverse()
    for (let i = 0; i < positions.length; i++) {
        if ((i-1) % 3 === 0) {
            continue;
        }
        const point = positions[i]
        if (Math.sign(point) === 1) {
            out.push(1)
        } else {
            out.push(0)
        }
    }
    console.log(out)
    return out;
}

function generateTexCoordsFromNonIndexedBuff2(positions) {
    let out = []
    for (let i = 0; i < positions.length; i++) {
        if ((i+0) % 3 === 0) {
            continue;
        }
        const point = positions[i]
        if (Math.sign(point) === 1) {
            out.push(1)
        } else {
            out.push(0)
        }
    }
    console.log(out)
    return out;
}

function generateRandomVec3(size) {

    const inner = (output) => {
        if (size == 0) {
            return output
        }
    
        //const singleVector3 = [Math.random(), Math.random(), Math.random()]
        output.push(Math.random())
        size -= 1
        return inner(output)
    }

    return inner([])
    
}

//generates random colors
function generateRandomVec3InPairsOf(size, pairSize) {
    const out = [];

    const callSize = size / pairSize

    for (let i = 0; i < callSize; i++) {
        const singleRNG = Math.random() //R
        const singleRNG2 = Math.random() //G
        const singleRNG3 = Math.random() //B
        for (let v = 0; v < pairSize/3; v++) {
            out.push(singleRNG)
            out.push(singleRNG2)
            out.push(singleRNG3)
            //out.push(Math.random())
            //out.push(Math.random())
        }
    }
    return out

}

//console.log(generateRandomVec3InPairsOf(108, 18))
/*
function generateRandomVec3AtInterval(size) {
    let out;
    setInterval( () => {
        console.log("hoooga")
        out = generateRandomVec3(size, [])
        //console.log(out)
    }, 1000)
    return out;
}
*/

//console.log(ppm([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]))
//console.log(generateRandomVec3(9))