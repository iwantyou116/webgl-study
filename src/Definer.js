var Definer = (function() {
    var Definer, allInstance, listeners,
        cls, methods, properties, destroy, constants,
        UUID = 0;

    Definer = {};
    allInstance = {};
    listeners = {};

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
            if(constants = options.constants) {
                Object.getOwnPropertyNames(constants).forEach(function(v){
                    Object.defineProperty(cls, v, _constant(constants[v]));
                });
            }

            options.initialize.apply(this, Array.prototype.slice.call(arguments));
        };

        if(methods = options.methods) {
            Object.getOwnPropertyNames(methods).forEach(function(v){
                Object.defineProperty(cls.prototype, v, {value: methods[v]});
            });
        }

        Object.defineProperty(cls.prototype, 'toString', { value: function() { return this.uuid; }});
        Object.defineProperty(cls.prototype, 'addEvent', {
            value: function(type, isGlobal, listener) {
                listeners[type] = listeners[type] || [];
                if(listeners[type].indexOf(listener) == -1) {
                    listeners[type].push({
                        f: listener,
                        ctx: this,
                        isGlobal: isGlobal
                    });
                }
            }
        });

        Object.defineProperty(cls.prototype, 'dispatch', {
            value: function(type) {
                if(!listeners[type]) return;
                var evt = listeners[type], i = evt.length,
                    params = Array.prototype.slice.call(arguments, 1);

                while (i--) {
                    if(evt[i].ctx === this || evt[i].isGlobal)
                        evt[i].f.apply(evt[i].ctx, params);
                }
            }
        });
        
        Object.defineProperty(cls.prototype, 'destroy', {
            value: function() {
                if(options.destroy) options.destroy();
                delete allInstance[this.uuid];
            }
        });

        Object.freeze(cls.prototype);

        return cls;
    };

    return Definer;
})();