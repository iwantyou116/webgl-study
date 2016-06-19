var World = Definer.extend({
    name: 'World',

    properties: {
        gl: null,
        canvas: null,
        context: null,
        children: [],

        _vertexBuffer: [],
        _uvBuffer: [],
        _indexBuffer: [],

        _positionBuffer: [],
        _scaleBuffer: [],
        _rotationBuffer: [],
        _colorBuffer: [],

        isVertexChanged: false,
        isPositionChanged: false,
        isScaleChanged: false,
        isRotationChanged: false,
        isColorChanged: false,
        
        isClipSpace: false
    },

    constants: {
        'VERTEX': { name:'vertex' },
        'POSITION': { name:'position' },
        'SCALE': { name:'scale' },
        'ROTATION': { name:'rotation' },
        'COLOR': { name:'color' }
    },

    initialize: function(canvas, isClipSpace) {
        this.gl = canvas.getContext('webgl');
        this.canvas = canvas;
        this.isClipSpace = isClipSpace;
        this.context = this._glInitialize();
        this.backgroundColor(1,1,1,1);
        var that = this;

        this.addEvent('change', function(type, mesh) {
            switch (type) {
                case World.VERTEX:
                case World.POSITION:
                case World.SCALE:
                case World.ROTATION:
                case World.COLOR:
                break;
                default: throw 'invalid type';
            }
            that._updateBuffer(mesh, type);
        });
    },

    methods: {
        _glInitialize: function () {
            var gl = this.gl;
            var shader = new Shader();
            var vertexShader, fragmentShader, program, result,
                keys1, keys2, i;

            if(this.isClipSpace) {
                shader.vertexVariables.push('uniform vec2 uResolution;')
                shader.vertexMain.length = 0;
                shader.vertexMain.push(
                    'void main(void){' +
                    '   vColor = aColor;' +
                    '   vUV = aUV;' +
                    '   vec2 aVertexPosition2 = vec2(aVertexPosition[0], aVertexPosition[1]);' +
                    '   vec2 clipSpace = ((aVertexPosition2 / uResolution) * 2.0) - 1.0;' +
                    '   gl_Position = positionMTX(aPosition)*' +
                    '   rotationMTX(aRotation)*' +
                    '   scaleMTX(aScale)*' +
                    '   vec4(clipSpace * vec2(1, -1), 0, 1.0);' +
                    '}')
            }

            vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, shader.getVertexShader());
            gl.compileShader(vertexShader);

            fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, shader.getFragmentShader());
            gl.compileShader(fragmentShader);

            program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);

            result = {};
            keys1 = 'vertex,position,scale,color,rotation,uv'.split(',');
            keys2 = 'aVertexPosition,aPosition,aScale,aColor,aRotation,aUV'.split(',');
            i = keys2.length;
            while (i--) {
                gl.enableVertexAttribArray(result[keys2[i]] = gl.getAttribLocation(program, keys2[i]));

                gl.bindBuffer(gl.ARRAY_BUFFER, this[ keys1[i] + 'Buffer'] = gl.createBuffer(gl.ARRAY_BUFFER));
                gl.vertexAttribPointer(result[keys2[i]], 3, gl.FLOAT, false, 0, 0);
            }
            result['uSampler'] = gl.getUniformLocation(program, 'uSampler');
            result['uResolution'] = gl.getUniformLocation(program, 'uResolution');

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            return result;
        },

        backgroundColor: function(r, g, b, a) {
            this.gl.clearColor(r, g, b, a);
        },

        setViewport: function(isAutoSize, w, h) {
            var that = this;
            var resizeFunc = function() {
                var width, height, pixelRatio;
                width = window.innerWidth;
                height = window.innerHeight;
                pixelRatio = window.devicePixelRatio;
                that.canvas.width = width * pixelRatio;
                that.canvas.height = height * pixelRatio;
                that.canvas.style.width = width + 'px';
                that.canvas.style.height = height + 'px';
                that.canvas._autoSize = isAutoSize;
                that.gl.viewport(0, 0, that.canvas.width, that.canvas.height);
            };

            if(isAutoSize) {
                resizeFunc();

                window.addEventListener('resize', resizeFunc);
                window.addEventListener('orientationchange', resizeFunc);
            }else {
                this.canvas.width = w;
                this.canvas.height = h;
                this.canvas.style.width = w + 'px';
                this.canvas.style.height = h + 'px';
                this.gl.viewport(0, 0, w, h);
            }
        },

        addMesh: function(mesh) {
            mesh.parent = this;
            this.children.push(mesh);
            this.isVertexChanged = true;

            this._addBuffer(mesh);
        },

        removeMesh: function() {

        },

        _resetBuffer: function() {
            this._vertexBuffer.length = this._uvBuffer.length = this._indexBuffer.length = 0;
            this._positionBuffer.length = this._scaleBuffer.length = this._rotationBuffer.length = this._colorBuffer.length = 0;

            this.children.forEach(this._addMeshData, this);
        },

        _addBuffer: function(mesh) {
            var i, length, length2;

            mesh.offset = length = this._vertexBuffer.length / 3;
            for(i = 0, length2 = mesh.indices.length; i < length2; i++) {
                this._indexBuffer.push(mesh.indices[i] + length);
            }
            for (i = 0, length2 = mesh.vertices.length ; i < length2 ; i++) {
                this._vertexBuffer.push(mesh.vertices[i]);
                this._uvBuffer.push(mesh.uv[i]);
            }
            for(i = 0, length2 = mesh.vertices.length / 3; i < length2; i++){
                this._positionBuffer.push(mesh.px, mesh.py, mesh.pz);
                this._scaleBuffer.push(mesh.sx, mesh.sy, mesh.sz);
                this._rotationBuffer.push(mesh.rx, mesh.ry, mesh.rz);
                this._colorBuffer.push(mesh.material.r, mesh.material.g, mesh.material.b);
            }
        },

        _updateBuffer: function(mesh, type) {
            var index = this.children.indexOf(mesh);
            var offset = mesh.offset;
            var i, j, k, l;

            if(type === World.VERTEX) {
                this.isVertexChanged = true;

                i = 0;
                j = mesh.vertices.length;
                k = index * j;
                for(; i < j; i++, k++) {
                    this._vertexBuffer[k] = mesh.vertices[i];
                    this._uvBuffer[k] = mesh.uv[i];
                }
            }else {
                var keys = 'position,scale,rotation,color'.split(',');
                var keys2 = 'px,py,pz|sx,sy,sz|rx,ry,rz|r,g,b'.split('|');
                keys2.forEach(function(v, i){
                    keys2[i] = v.split(',');
                });

                i = keys.length;
                while (i--) {
                    var target = this['_' + keys[i] + 'Buffer'];
                    for(k = 0, l = mesh.vertices.length / 3; k < l; k++){
                        target[3 * (offset + k)] = mesh[keys2[i][0]];
                        target[3 * (offset + k) + 1] = mesh[keys2[i][1]];
                        target[3 * (offset + k) + 2] = mesh[keys2[i][2]];
                    }
                }
            }


        },

        render: function() {
            var gl = this.gl;
            var i, keys, key;

            if(this.isVertexChanged) {
                this.isVertexChanged = false;
                
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer(gl.ELEMENT_ARRAY_BUFFER));
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._indexBuffer), gl.STATIC_DRAW);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertexBuffer), gl.STATIC_DRAW);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._uvBuffer), gl.STATIC_DRAW);

                gl.uniform1i(this.context.uSampler, 0);
                if(this.isClipSpace) gl.uniform2f(this.context.uResolution, this.canvas.width, this.canvas.height);
                
            }

            keys = 'position,scale,rotation,color'.split(',');
            i = keys.length;
            while (i--) {
                key = keys[i];
                gl.bindBuffer(gl.ARRAY_BUFFER, this[key+'Buffer']);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this['_' + key+'Buffer']), gl.STATIC_DRAW);
            }
            
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.drawElements(gl.TRIANGLES, this._indexBuffer.length, gl.UNSIGNED_SHORT, 0);
        }
    }
});

