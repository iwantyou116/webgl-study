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
        r: 0,
        g: 0,
        b: 0
    },


    initialize: function(vertices, indices, uv, material) {
        var that = this;
        this.vertices = vertices;
        this.indices = indices;
        this.uv = uv;
        this.material = material;

        this.r = material.r;
        this.g = material.g;
        this.b = material.b;
        this.dispatch('change', World.COLOR, this);

        this.material.addEvent('Material.updated', false, function() {
            that.dispatch('change', World.TEXTURE, that);
        });
    },

    methods: {

        setVertices: function(vertices) {
            this.vertices = vertices;
            this.dispatch('change', World.VERTEX, this);
        },

        setPosition: function(px, py, pz){
            this.px = px;
            this.py = py;
            this.pz = pz;
            this.dispatch('change', World.POSITION, this);
        },

        setRotate: function(rx, ry, rz){
            this.rx = rx;
            this.ry = ry;
            this.rz = rz;
            this.dispatch('change', World.ROTATION, this);
        },

        setScale: function(sx, sy, sz){
            this.sx = sx;
            this.sy = sy;
            this.sz = sz;
            this.dispatch('change', World.SCALE, this);
        }
    }
});