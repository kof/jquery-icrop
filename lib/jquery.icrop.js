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
    // image selector/element/object, is used if no url defined
    image: 'img',
    size: {},
    position: {top: 0, left: 0},
    slider: null,
    sliderOptions: {
        min: 1,
        max: 10,
        step: 0.1
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

    this._oStyle = this.element.attr('style');

    this.element.css({
        width: o.width,
        height: o.height,
    }).addClass(classNames);

    if (o.url) {
        this._renderImage();
    } else {
        this.elements.img = this.element.find(o.image);
    }

    this._saveSize();

    if (o.slider && $.fn.slider) {
        this._applySlider();
    }

    if (o.draggable && $.fn.draggable) {
        this._applyDraggables();
    }
};

$.Icrop.prototype.destroy = function() {
    var o = this.options;

    this.element
        .removeData('icrop')
        .removeClass(classNames)
        .attr('style', this._oStyle || '');

    if (o.slider && $.fn.slider) {
        $(o.slider).slider('destroy');
    }

    if (o.url) {
        this.elements.img.remove();
    } else if (o.draggable && $.fn.draggable) {
        this.elements.img.draggable('destroy');
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
    var o = this.options;

    this.elements.img = $('<img src="'+ o.url +'"/>')
        .css($.extend({
            width: o.width
        }, o.size, o.position))
        .appendTo(this.element);

};

$.Icrop.prototype._applyDraggables = function() {
    var self = this,
        o = this.options,
        margin = 20;

    o.draggable.stop = function(e, ui) {
        o.position = ui.position;
        self._fixPos();
    };

    this.elements.img
        .draggable(o.draggable);
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
    this._fixPos();
};

$.Icrop.prototype._fixPos = function() {
    var o = this.options,
        pos = o.position,
        margin = 20,
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
        this.elements.img.css(pos);
    }
};

}(jQuery));