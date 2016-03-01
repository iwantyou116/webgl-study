var World = (function() {

    var vertextShaderSource =
        'attribute vec3 aVertexPosition;' +
        'attribute vec3 aPosition;' +
        'attribute vec3 aScale;' +
        'attribute vec3 aRotation;' +
        'attribute vec3 aColor;' +
        'attribute vec3 aUV;' +
        'varying vec3 vColor;' +
        'varying vec3 vUV;' +
        '' +
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
        '}' +
        '' +
        'void main(void){' +
        '   vColor = aColor;' +
        '   vUV = aUV;' +
        '   gl_Position = positionMTX(aPosition)*' +
        '   rotationMTX(aRotation)*' +
        '   scaleMTX(aScale)*' +
        '   vec4(aVertexPosition, 1.0);' +
        '}'
    ;

    var fragmentShaderSource =
        'precision lowp float;' +
        'uniform sampler2D uSampler;' +
        'varying vec3 vColor;' +
        'varying vec3 vUV;' +
        'void main(void){' +
        '   if(vColor[0] + vColor[1] + vColor[2] == 3.0){' +
        '       gl_FragColor = texture2D(uSampler, vec2(vUV[0], vUV[1]));' +
        '   }else{' +
        '       gl_FragColor = vec4(vColor, 1.0);' +
        '   }' +
        '   gl_FragColor.a = 0.75;' +
        '}'
    ;

    var glInit = function (gl) {
        var vertexShader, fragmentShader, program, result,
            key, i;

        vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertextShaderSource);
        gl.compileShader(vertexShader);

        fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        result = { };
        key = "aVertexPosition,aPosition,aScale,aRotation,aColor,aUV".split(",");
        i = key.length;
        while (i--) {
            gl.enableVertexAttribArray(result[key[i]] = gl.getAttribLocation(program, key[i]));
        }
        result["uSampler"] = gl.getUniformLocation(program, "uSampler");

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        return result;
    };

    var World = Definer.extend({
        name: 'World',

        properties: {
            gl: null,
            canvas: null,
            context: null,
            children: [],
            vertex_data: [],
            index_data: [],
            position_data: [],
            scale_data: [],
            rotation_data: [],
            color_data: [],
            uv_data: [],
            vertexChanged: true,
            changed: {
                position: [],
                scale: [],
                rotation: [],
                color: []
            },
            POSITION: 'position',
            SCALE: 'scale',
            ROTATION: 'rotation',
            COLOR: 'color'
        },

        constants: {
            "POSITION": { name:"position" },
            "SCALE": { name:"scale" },
            "ROTATION": { name:"rotation" },
            "COLOR": { name:"color" }
        },

        initialize: function(canvas) {
            this.canvas = canvas;
            var gl = this.gl = this.canvas.getContext("webgl");
            this.context = glInit(gl);
            this.backgroundColor(1,1,1,1);
        },

        methods: {
            backgroundColor: function(r, g, b, a) {
                this.gl.clearColor(r, g, b, a);
            },

            setViewport: function(isAutoSize, w, h) {
                var resizeFunc;

                if(isAutoSize) {
                    var canvas, width, height, pixelRatio;
                    width = window.innerWidth;
                    height = window.innerHeight;
                    pixelRatio = window.devicePixelRatio;
                    this.canvas.width = width * pixelRatio;
                    this.canvas.height = height * pixelRatio;
                    this.canvas.style.width = width + 'px';
                    this.canvas.style.height = height + 'px';
                    this.canvas._autoSize = isAutoSize;
                    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
                }else {
                    this.gl.viewport(0, 0, w, h);
                }
            },

            addMesh: function(mesh) {
                mesh.parent = this;
                this.children.push(mesh);
                this.vertexChanged = true;
            },

            removeMesh: function(mesh) {
                if (this !== mesh.parent || this.children.indexOf(mesh) == -1) return;
                mesh.parent = null;
                this.children.splice(this.children.indexOf(mesh),1);
                this.vertexChanged = true;
            },

            change: function(type, mesh) {
                switch (type) {
                    case World.POSITION:case World.SCALE:case World.ROTATION:case World.COLOR:
                    break;
                    default: throw "invalid type";
                }
                this.changed[type.name].push(mesh);
            },

            render: function() {
                var gl = this.gl;
                var mesh, i, j, k, len, len2, len3, keys, keys2;

                if(this.vertexChanged){
                    this.vertexChanged = false;
                    this.vertex_data.length = this.index_data.length = this.position_data.length =
                        this.scale_data.length = this.rotation_data.length = this.uv_data.length = this.color_data.length = 0;
                    for(i = 0, len = this.children.length; i < len; i++) {
                        mesh = this.children[i];

                        /*if(){
                            gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
                            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mesh.material.img);
                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
                            gl.generateMipmap(gl.TEXTURE_2D);
                        }*/

                        mesh.offset = len3 = this.vertex_data.length / 3;
                        for(j = 0, len2 = mesh.indices.length; j < len2; j++) {
                            this.index_data.push(mesh.indices[j] + len3);
                        }
                        for (j = 0, len2 = mesh.vertices.length ; j < len2 ; j++) {
                            this.vertex_data.push(mesh.vertices[j]);
                            this.uv_data.push(mesh.uv[j]);
                        }
                        for(j = 0, len2 = mesh.vertices.length / 3; j < len2; j++){
                            this.position_data.push(mesh.px, mesh.py, mesh.pz);
                            this.scale_data.push(mesh.sx, mesh.sy, mesh.sz);
                            this.rotation_data.push(mesh.rx, mesh.ry, mesh.rz);
                            this.color_data.push(mesh.material.r, mesh.material.g, mesh.material.b);
                        }
                    }

                    this.indexBuffer = gl.createBuffer(gl.ELEMENT_ARRAY_BUFFER);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
                    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.index_data), gl.STATIC_DRAW);

                    keys = "vertex,position,scale,color,rotation,uv".split(",");
                    keys2 = "aVertexPosition,aPosition,aScale,aColor,aRotation,aUV".split(",");
                    i = keys.length;
                    while(i--) {
                        gl.bindBuffer(gl.ARRAY_BUFFER, this[keys[i]+"Buffer"] = gl.createBuffer(gl.ARRAY_BUFFER));
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this[keys[i]+"_data"]), gl.STATIC_DRAW);
                        gl.vertexAttribPointer(this.context[keys2[i]], 3, gl.FLOAT, false, 0, 0);
                    }
                    gl.uniform1i(this.context.uSampler, 0);
                } else {
                    keys = "position,scale,rotation,color".split(",");
                    keys2 = "px,py,pz|sx,sy,sz|rx,ry,rz|r,g,b".split("|");
                    keys2.forEach(function(v, i){
                        keys2[i] = v.split(",");
                    });

                    i = keys.length;
                    while (i--) {
                        if (!(j = this.changed[keys[i]].length)) continue;
                        var target = this[keys[i]+"_data"];
                        while (j--) {
                            mesh = this.changed[keys[i]][j];
                            var offset = mesh.offset;
                            for(k = 0, len2 = mesh.vertices.length / 3; k < len2; k++){
                                target[3 * (offset + k)] = mesh[keys2[i][0]];
                                target[3 * (offset + k) + 1] = mesh[keys2[i][1]];
                                target[3 * (offset + k) + 2] = mesh[keys2[i][2]];
                            }
                        }
                        gl.bindBuffer(gl.ARRAY_BUFFER, this[keys[i]+"Buffer"]);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this[keys[i]+"_data"]), gl.STATIC_DRAW);
                        this.changed[keys[i]].length = 0;
                    }
                }

                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.drawElements(gl.TRIANGLES, this.index_data.length, gl.UNSIGNED_SHORT, 0);
            }
        }
    });


    return World;
})();

var Mesh = Definer.extend({
    name: 'Mesh',

    properties: {
        material: null,
        vertices: null,
        indices: null,
        uv: null,
        px: 0,
        py: 0,
        pz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        sx: 1,
        sy: 1,
        sz: 1,
        parent: null
    },

    initialize: function(vertices, indices, uv, material) {
        this.material = material;
        this.vertices = vertices;
        this.indices = indices;
        this.uv = uv;
    },

    methods: {
        setType: function(type) {
            this.type = type;
        },

        translate: function(px, py, pz){
            this.px = px;
            this.py = py;
            this.pz = pz;
            if(this.parent){
                this.parent.change(World.POSITION, this);
            }
        },

        rotate: function(rx, ry, rz){
            this.rx = rx;
            this.ry = ry;
            this.rz = rz;
            if(this.parent){
                this.parent.change(World.ROTATION, this);
            }
        },

        scale: function(sx, sy, sz){
            this.sx = sx;
            this.sy = sy;
            this.sz = sz;
            if(this.parent){
                this.parent.change(World.SCALE, this);
            }
        }
    }
});


var Material = Definer.extend({

    name: 'Material',

    initialize: function(color) {
        this.color = color;

        if(typeof this.color == "string"){
            this.r = parseInt(this.color.substr(1,2), 16)/255;
            this.g = parseInt(this.color.substr(3,2), 16)/255;
            this.b = parseInt(this.color.substr(5,2), 16)/255;
        }else if(this.color instanceof Array){
            this.r = this.color[0];
            this.g = this.color[1];
            this.b = this.color[2];
        } else {
            this.r = 1;
            this.g = 1;
            this.b = 1;
        }
    }

});