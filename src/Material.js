var Material = Definer.extend({

    name: 'Material',
    
    constant: {
        'updated': { name: 'Material.updated' }
    },

    initialize: function(color, texture) {
        var that = this;
        this.color = color;
        this.texture = texture;
        if(this.texture) {
            this.texture.addEvent(Texture.loaded, false, function() {
                that.dispatch('Material.updated')
            });
        }

        if(typeof this.color == 'string'){
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