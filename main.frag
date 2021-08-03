#version 300 es
precision mediump float;
//v = varying. Mean it came from vertex shader and was interpolated.
in vec3 v_pos;
flat in int v_inMotion;

layout(location = 0) out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_nordNesTex;

void main() {
	vec2 uv = gl_FragCoord.xy/u_resolution;
	//uv = uv * 6.0;
	//vec2 id = floor(uv);

	vec3 colz = vec3(sin(u_time + 14.0), sin(u_time*0.67), sin(u_time*0.89));

	vec3 vertPosCol = (v_pos + 1.0) / 2.0;

	if (v_inMotion == 1) {
		vertPosCol = vec3(1.0, 0.0, vertPosCol.z);
	}

	vec4 nordnesTex = texture(u_nordNesTex, gl_PointCoord);

	outColor = vec4(vertPosCol, 1.0);//vec4(tex, 1.0);
}