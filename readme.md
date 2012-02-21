## icrop - jquery plugin for very simple image cropping.

## API

## options

    // image url
    url: null,
    // image selector/element/object, is used if no url defined
    image: 'img',
    width: null,
    height: null,
    size: {},
    position: {top: 0, left: 0},
    slider: null,
    sliderOptions: {
        min: 1,
        max: 5,
        step: 0.1
    },
    draggable: {},
    // minimal size of the image, which have to be always visible
    minVisibleSize: 20,
    // onchange callback
    change: $.noop


### init

    $('selector').icrop({
        // path to the image
        url: 'http://farm4.static.flickr.com/3509/3912427039_a79b87119a.jpg',
        // size of container
        width: 150,
        height: 200,
        // selector/element/jquery objekt of slider
        slider: 'slider-selector'
    });

### get option

    $('selector').icrop('option', 'size');
    $('selector').icrop('option', 'position');

### destroy

    $('selector').icrop('destroy');

## Dependencies

 - jquery.js
 - jquery.ui.draggable.js
 - jquery.ui.slider.js

## License

Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
