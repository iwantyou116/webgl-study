var Shader = Definer.extend({

    name: 'Shader',

    properties: {
        vertexVariables: [
            'attribute vec3 aVertexPosition;',
            'attribute vec3 aPosition;',
            'attribute vec3 aScale;',
            'attribute vec3 aRotation;',
            'attribute vec3 aColor;',
            'attribute vec3 aUV;',
            'varying vec3 vColor;',
            'varying vec3 vUV;'
        ],
        vertexFunction: [
            'mat4 positionMTX(vec3 p){' +
            '   return mat4(1,0,0,0,  0,1,0,0,  0,0,1,0,  p[0],p[1],p[2],1);' +
            '}' +
            'mat4 scaleMTX(vec3 sc){' +
            '   return mat4(sc[0],0,0,0,  0,sc[1],0,0,  0,0,sc[2],0,  0,0,0,1);' +
            '}' +
            'mat4 rotationMTX(vec3 r){' +
            '   float s, c;' +
            '   s = sin(r[0]), c = cos(r[0]);' +
            '   mat4 mx = mat4(1,0,0,0,  0,c,-s,0,  0,s,c,0,  0,0,0,1);' +
            '   s = sin(r[1]), c = cos(r[1]);' +
            '   mat4 my = mat4(c,0,-s,0,  0,1,0,0,  s,0,c,0,  0,0,0,1);' +
            '   s = sin(r[2]), c = cos(r[2]);' +
            '   mat4 mz = mat4(c,-s,0,0,  s,c,0,0,  0,0,1,0,  0,0,0,1);' +
            '   return mx*my*mz;' +
            '}'
        ],
        vertexMain: [
            'void main(void){' +
            '   vColor = aColor;' +
            '   vUV = aUV;' +
            '   gl_Position = positionMTX(aPosition)*' +
            '   rotationMTX(aRotation)*' +
            '   scaleMTX(aScale)*' +
            '   vec4(aVertexPosition, 1.0);' +
            '}'
        ],
        fragmentVariables: [
            'precision lowp float;' +
            'uniform sampler2D uSampler;' +
            'varying vec3 vColor;' +
            'varying vec3 vUV;'
        ],
        fragmentFunction: [],
        fragmentMain: [
            'void main(void){' +
            '   if(vColor[0] + vColor[1] + vColor[2] == 3.0){' +
            '       gl_FragColor = texture2D(uSampler, vec2(vUV[0], vUV[1]));' +
            '   }else{' +
            '       gl_FragColor = vec4(vColor, 1.0);' +
            '   }' +
            '}'
        ]
    },

    initialize: function() {

    },

    methods: {
        getVertexShader: function() {
            return this.vertexVariables.join('') + this.vertexFunction.join('') + this.vertexMain.join('');
        },

        getFragmentShader: function() {
            return this.fragmentVariables.join('') + this.fragmentFunction.join('') + this.fragmentMain.join('');
        }
    }

});