# Yoast SEO integration for Neos CMS

[![Latest Stable Version](https://poser.pugx.org/shel/yoast-seo-neos/v/stable)](https://packagist.org/packages/shel/yoast-seo-neos)
[![Total Downloads](https://poser.pugx.org/shel/yoast-seo-neos/downloads)](https://packagist.org/packages/shel/yoast-seo-neos)
[![License](https://poser.pugx.org/shel/yoast-seo-neos/license)](https://packagist.org/packages/shel/yoast-seo-neos)

## What does it do

This package provides a new backend preview in [Neos CMS](https://neos.io) to look at your page with the help of the [Yoast SEO](https://github.com/Yoast/YoastSEO.js) plugin.

This view will show you a preview snippet how the selected page will look in the Google search results
and will give you insights and helpers to further improve the page for search engines.

These insights are generated via the official **Yoast SEO** javascript plugin.

**Attention!** This package is still an alpha version but you should be able to use it without 
problems as it just provides an additional view in Neos. 

## Example

![Plugin example in Neos demo site](Documentation/Neos-Yoast-SEO-Example.png | width=300) 

## Installation

    composer require shel/neos-yoast-seo
    
## Dependencies

This package currently only requires Neos 3.* but it's suggested to also have the `neos/seo` package installed.
This package expects some document node properties to be present like `titleOverride` and `metaDescription` which
are provided via the `neos/seo` package. But you can of course provide them yourself if you don't want to use
the `neos/seo` package.

## Usage

After installation the new preview mode is available in the Neos backend.

Currently there is no configuration needed. But additional configuration options
might be added in the future to make the plugin work well with different site setups.  

## Contributing

Contributions are very welcome. 
Please create issues for problems or new ideas your have.
Pull requests are even better!

### Building the assets

You can generate the `js` and `css` files by running the following commands in the package folder:

    npm install
    npm run build
    
Rebuilding the assets with browsersync when developing:

    npm run watch

### Roadmap

* Implement inspector view to see some feedback from Yoast plugin while editing a page
* Test plugin with various projects to check behavior
* Implement more features from the Yoast javascript library (Text reading ease, etc...)
* Nicer backend view
