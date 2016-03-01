var Definer = (function() {
    var Definer, allInstance,
        cls, methods, properties, destroy, constants,
        UUID = 0;

    Definer = {};
    allInstance = {};

    var _property = function (value) {
        var result = {
            enumerable: true,
            writable: true,
            configurable: true,
            value: null
        };
        result.value = value;
        return result;
    };

    var _constant = function(value) {
        var result = {};

        result.value = value;
        console.log(result);
        return result;
    };

    Definer.extend = function(options) {
        cls = function() {
            Object.defineProperty(this, 'uuid', {value: options.name + '_' + UUID++});
            allInstance[this.uuid] = this;
            if(properties = options.properties) {
                Object.getOwnPropertyNames(properties).forEach(function(v){
                    Object.defineProperty(this, v, _property(properties[v]));
                }, this);
            }

            options.initialize.apply(this, Array.prototype.slice.call(arguments));
        };

        if(constants = options.constants) {
            Object.getOwnPropertyNames(constants).forEach(function(v){
                Object.defineProperty(cls, v, _constant(constants[v]));
            });
        }
        if(methods = options.methods) {
            Object.getOwnPropertyNames(methods).forEach(function(v){
                Object.defineProperty(cls.prototype, v, {value: methods[v]});
            });
        }

        Object.defineProperty(cls.prototype, 'toString', {value: function() { return this.uuid; }});

        Object.freeze(cls.prototype);

        return cls;
    };

    return Definer;
})();