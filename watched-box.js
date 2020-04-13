/**
 * @module WatchedBox
 * @description
 * A custom element for ResizeObserver observation, accepting any CSS length units
 * @property {string} widthBreaks=1024px Comma-separated list of CSS `width` values
 * @property {string} heightBreaks=768px Comma-separated list of CSS `height` values
 * @property {string} prefix=null A string to prefix each generated class
 */
export default class WatchedBox extends HTMLElement {
  constructor() {
    super();
    // Convert supplied CSS length to pixels
    // for comparison in the observer
    this.getPixels = value => {
      // A 'test' element is required for measurement
      let test = document.createElement('div');
      Object.assign(test.style, {
        // Absolute positioning to free element for resizing
        // and avoid potential jumps/jank
        position: 'absolute',
        width: value
      });
      this.appendChild(test);
      // The value needed is offsetWidth
      let pixels = test.offsetWidth;
      this.removeChild(test);
      return pixels;
    }

    this.getPrefix = () => this.prefix ? `${this.prefix}-` : '';

    this.toggleClasses = (watched, dimension, value, contentRect) => {
      const length = dimension === 'w' ? contentRect.width : contentRect.height;
      // contentRect values are in pixels, hence
      // the use of the `getPixels` conversion function
      const q = length <= this.getPixels(value);
      watched.target.classList.toggle(`${this.getPrefix()}${dimension}-lte-${value}`, q);
      watched.target.classList.toggle(`${this.getPrefix()}${dimension}-gt-${value}`, !q);
    }

    this.observe = () => {
      this.ro = new ResizeObserver(entries => {
        // We only need the custom element itself: the first entry
        const watched = entries[0];
        const contentRect = watched.contentRect;
        // Take the supplied widths, from the width attribute value
        const widths = this.widthBreaks.replace(/ /g,'').split(',');
        widths.forEach(width => {
          this.toggleClasses(watched, 'w', width, contentRect);
        });
        // Take the supplied height, from the height attribute value
        const heights = this.heightBreaks.replace(/ /g,'').split(',');
        heights.forEach(height => {
          this.toggleClasses(watched, 'h', height, contentRect);
        });

        // Orientation classes to mimic the orientation @media query
        const ratio = contentRect.width / contentRect.height;
        watched.target.classList.toggle(`${this.getPrefix()}landscape`, ratio > 1);
        watched.target.classList.toggle(`${this.getPrefix()}portrait`, ratio < 1);
        watched.target.classList.toggle(`${this.getPrefix()}square`, ratio == 1);
      });

      this.ro.observe(this);
    }

    this.unobserve = () => {
      this.ro.unobserve(this);
    }
  }

  get widthBreaks() {
    return this.getAttribute('widthBreaks') || '1024px';
  }

  set widthBreaks(val) {
    return this.setAttribute('widthBreaks', val);
  }

  get heightBreaks() {
    return this.getAttribute('heightBreaks') || '768px';
  }

  set heightBreaks(val) {
    return this.setAttribute('heightBreaks', val);
  }

  get prefix() {
    return this.getAttribute('prefix') || null;
  }

  set prefix(val) {
    return this.setAttribute('prefix', val);
  }

  static get observedAttributes() {
    return ['widthBreaks', 'heightBreaks'];
  }

  connectedCallback() {
    this.observe();
  }

  attributeChangedCallback() {
    if (this.ro) {
      this.unobserve();
    }
    this.observe();
  }
}

// If either ResizeObserver or Custom Elements are not supported,
// do not initialize, leaving the element as just an inert block
if (ResizeObserver || 'customElements' in window) {
  customElements.define('watched-box', WatchedBox);
}