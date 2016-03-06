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