This repository contains:

* The Source for shared static assets for the DGUK web site.
  * Stylesheets (Less )
  * Javascript (Raw & Minified)
  * Images (optimised)

# Installation


To install the dependencies, you will need npm with is part of [node.js](http://nodejs.org/)


To install [gruntjs](http://gruntjs.com) and the dependencies required to compile the assets.

    # Remove any old version
    sudo npm uninstall -g grunt
    # Install Grunt CLI tools globally.
    sudo npm install -g grunt-cli
    # Install local project dependancies (eg. JS minifiers etc).
    npm install

To update the assets:

* Update stylesheet `assets/src/css/datagovuk.less` (written in [Less](http://lesscss.org), a superset of the CSS language).
  * Update the `concat` task in the Gruntfile to find any new files.
* Add or remove vendor JS files from `assets/src/js/`. 
  * Update the `concat` task in the Gruntfile to find any new files.

When changes are made, recompile everything by just executing:

    grunt

Use `grunt --help` to see a list of all available tasks. For example:

    grunt styles
    grunt scripts
    grunt imagemin

# Contents

See `Gruntfile.js` to understand how each compiled file is created. Some notes:

* `datagovuk.less` is the responsive stylesheet (work-in-progress). It is rolled up with:
  * Twitter Bootstrap 2.0.3
  * Styles for jQueryUI 1.10.2 (customised with DGU colour flavours)
  * Styles for jQuery Chosen 0.9.7 
* `vendor.min.js` is a compressed copy of:
  * **Not jQuery** 1.9.1 (we try to use a CDN, but carry a fallback)
  * Backbone 0.5.1
  * Bootstrap 2.0.3 (for tooltips etc)
    * Bootstrap hashchange plugin (for switching tabs in a page using document.hash)
  * jQuery plugins: Chosen 0.9.7, cookies, placeholders, tmpl, dotdotdot 1.5.9, UI 1.10.9
  * json2.js
  * modernizr 1.7
  * spin.js
  * underscore 1.1.6
