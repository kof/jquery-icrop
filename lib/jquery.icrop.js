(function($) {

$.fn.icrop = function(method, options) {
    var ret;

    if (typeof method !== 'string') {
        options = method;
        method = null;
    }

    this.each(function() {
        var inst = $.data(this, 'icrop');

        if (!inst) {
            inst = new $.Icrop(this, options);
            $.data(this, 'icrop', inst);
        }

        if (method) {
            ret = inst[method](options);
        }
    });

    return ret || this;
};

$.fn.icrop.options = {
    // image url
    url: null,
    size: {},
    position: {top: 0, left: 0},
    slider: null,
    sliderOptions: {
        min: 1,
        max: 10
    },
    draggable: {}
};

var classNames = 'ui-icrop ui-widget ui-corner-all ui-state-default';

$.Icrop = function(elem, options) {
    var o;

    this.element = $(elem);
    this.elements = {};
    this.options = o = $.extend(true, {}, $.fn.icrop.options, options);

    if (!o.width) {
        o.width = this.element.width();
    }

    if (!o.height) {
        o.height = this.element.height();
    }

    if (!o.url) {
        o.url = this.element.data('url');
    }

    this.element.css({
        width: o.width,
        height: o.height,
        overflow: 'hidden'
    }).addClass(classNames);

    if (o.url) {
        this._renderImage();
    }

    if (o.slider && $.fn.slider) {
        this._applySlider();
    }

    if (o.draggable && $.fn.draggable) {
        this._applyDraggables();
    }
};

$.Icrop.prototype.destroy = function() {
    var o = this.options;

    this.elements.img.remove();
    this.element
        .removeData('icrop')
        .removeClass(classNames);

    if (o.slider && $.fn.slider) {
        $(o.slider).slider('destroy');
    }
};

$.Icrop.prototype.option = function(name, value) {
    var o = this.options;

    if (!name) {
        return o;
    }

    if (value) {
        o[name] = value;
    } else {
        return o[name];
    }
};

$.Icrop.prototype._renderImage = function() {
    var o = this.options,
        self = this;

    this.elements.img = $('<img src="'+ o.url +'"/>')
        .css($.extend({
            position: 'relative',
            width: o.width
        }, o.size, o.position))
        .appendTo(this.element);

    this._saveSize();
};

$.Icrop.prototype._applyDraggables = function() {
    var self = this,
        o = this.options,
        margin = 20;

    o.draggable.stop = function(e, ui) {
        var pos = ui.position,
            set;

        if (pos.top > o.height - margin) {
            set = true;
            pos.top = o.height - margin;
        }

        if (pos.top < (o.size.height - margin) * -1) {
            set = true;
            pos.top = (o.size.height - margin) * -1;
        }

        if (pos.left > o.width - margin) {
            set = true;
            pos.left = o.width - margin;
        }

        if (pos.left < (o.size.width - margin) * -1) {
            set = true;
            pos.left = (o.size.width - margin) * -1;
        }

        if (set) {
            self.elements.img.css(pos);
        }

        o.position = pos;
    };

    this.elements.img
        .draggable(o.draggable)
        .css('cursor', 'move');
};

$.Icrop.prototype._applySlider = function() {
    var o = this.options,
        self = this;

    o.sliderOptions.slide = function(e, ui) {
        self.elements.img.css('width', o.width * ui.value);
    };

    o.sliderOptions.change = $.proxy(this, '_saveSize');

    $(o.slider).slider(o.sliderOptions);
};

$.Icrop.prototype._saveSize = function() {
    var $img = this.elements.img,
        o = this.options;
    o.size.width = $img.width();
    o.size.height = $img.height();
};

}(jQuery));