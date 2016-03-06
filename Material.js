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