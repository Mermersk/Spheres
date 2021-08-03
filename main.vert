#version 300 es
precision mediump float;
in vec3 a_position;
//v = varying. Mean it came from vertex shader and was interpolated.
out vec3 v_pos;
flat out int v_inMotion;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform float u_time;

/*
GPU vertice wave

Each vertice must travel 1 Pi. Will take it up and down again.
That is a range of u_time per vertex is 0 <-> 3.14, when its reached
3.14 it must stop being active.

Overlapping behaviour: 
1. 0 <-> 3.14
2. 1 <-> 4.14
3. 2 <-> 5.14
4 3 <-> 6.14
Problem: vertexes start point will be all over the place ,
some will start at the highest point and everywhere inbetween.
Solution: Create a unique timer for each vertex. So that each timer for
each vertex goes from 0 to 3.14. 
Achieve this with: u_time - gl_VertexID!

*/

void main() {

    gl_PointSize = 5.0;
   
    vec3 pos = a_position;
    v_inMotion = 0;
    //One by one (only one active at any point in time)
    //float startAnimating = float(gl_VertexID) * 3.14;
    //float stopAnimating = startAnimating + 3.14;

    //Overlapping (multiple active at the same time)
    float modTimer = mod(u_time, 16.0);
    float startAnimating = float(gl_VertexID)/100.0;
    float stopAnimating = 3.14 + startAnimating;
    float uniqueVertTimer = ((modTimer) - startAnimating);
  
    if (startAnimating < modTimer && stopAnimating > modTimer) {
        pos *= 1.0 + (abs(sin(uniqueVertTimer))/6.0);
        v_inMotion = 1;
    }
    if (gl_VertexID == 3 && modTimer < 3.14) {
        //pos *= 1.0 + abs(sin(u_time));
    }

    v_pos = pos;

    gl_Position = u_projection * u_view * u_model * vec4(pos, 1.0);

}