in vec2 vTextureCoord;
in vec4 vColor;

out vec4 finalColor;

precision highp float;
uniform float uScale;
uniform float uGain;
uniform float uLacunarity;
uniform float uMin;
uniform float uMax;
uniform float uNormalization;
uniform float uViewBoxLeft;
uniform float uViewBoxTop;
uniform float uViewBoxWidth;
uniform float uViewBoxHeight;
uniform float uOutputWidth;
uniform float uOutputHeight;
uniform sampler2D uTexture;

// from https://www.shadertoy.com/view/tdG3Rd
float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

// from https://www.shadertoy.com/view/tdG3Rd
float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);

	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

void main() {
	vec4 color = texture(uTexture, vTextureCoord);
	float randomValue = 0.0;
	vec2 mapCoordinate = vec2(
		gl_FragCoord.x * uViewBoxWidth / uOutputWidth + uViewBoxLeft,
		(uOutputHeight - gl_FragCoord.y) * uViewBoxHeight / uOutputHeight + uViewBoxTop
	);
	for (float o=0.0; o<$OCTAVES$; o++) {
		randomValue += noise(mapCoordinate * uScale * pow(uLacunarity, o)) * pow(uGain, o);
	}
	randomValue *= uNormalization;

	if (color.a > 0.0) {
		color.rgb /= color.a;
	}
	color.a *= randomValue * (uMax - uMin) + uMin;
	color.rgb *= color.a;

	finalColor = color;
}