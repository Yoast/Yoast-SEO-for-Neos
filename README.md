# Yoast SEO integration for Neos CMS

[![Latest Stable Version](https://poser.pugx.org/shel/neos-yoast-seo/v/stable)](https://packagist.org/packages/shel/neos-yoast-seo)
[![Total Downloads](https://poser.pugx.org/shel/neos-yoast-seo/downloads)](https://packagist.org/packages/shel/neos-yoast-seo)
[![License](https://poser.pugx.org/shel/neos-yoast-seo/license)](https://packagist.org/packages/shel/neos-yoast-seo)
[![Build Status](https://travis-ci.com/Sebobo/Shel.Neos.YoastSeo.svg?branch=master)](https://travis-ci.com/Sebobo/Shel.Neos.YoastSeo)

## What does it do

This package provides a new backend preview and inspector integration for [Neos CMS](https://neos.io) to look at 
your page with the help of the [Yoast SEO](https://github.com/Yoast/YoastSEO.js) plugin.

This view will show you a preview snippet how the selected page will look in the Google search results
and will give you insights and helpers to further improve the page for search engines.

These insights are generated via the official Open Source **Yoast SEO** javascript plugin by [Yoast](https://yoast.com).
This package is being developed in partnership with *Yoast BV* and will be moved in the Yoast namespace starting version 1.0.

We try to keep this package up-to-date with releases by Yoast but depending on the compatibility and available time 
this might take up to a few weeks after Yoast releases a new version of their library.

**Attention!** This package is still a pre-release version but you should be able to use it without 
problems as it just provides a additionals views in Neos. 

## Examples

![Preview in the Neos demo site](Documentation/Neos-Yoast-SEO-Example.png) 

![Inspector view in a blog](Documentation/Neos-Yoast-SEO-Inspector.jpg) 

## Compatibility chart

| Yoast SEO version | Neos CMS | Old UI | New UI |
| ----------------- | -------- | ------ | ------ |
| 0.2.0+            | 3.3+     | No     | Yes    |
| 0.1.*             | 3.3+     | Yes    | Yes    |

Find the installation instructions for the new Neos UI [here](https://github.com/neos/neos-ui).

## Installation

Add the dependency to your site package like this

    `composer require --no-update shel/neos-yoast-seo`
    
And then run `composer update` in your projects root folder.
    
## Dependencies

This package currently only requires Neos >= 3.0 but it's suggested to also have the `neos/seo` package installed.
This package expects some document node properties to be present like `titleOverride` and `metaDescription` which
are provided via the `neos/seo` package. But you can of course provide them yourself if you don't want to use
the `neos/seo` package.

## Using this package with Neos CMS 3.3 and the old UI

To use this package with the old UI you have to use version 0.1.*.
Version 0.2.0 dropped the support for the old UI.

To remove a javascript error and to make the Yoast tab work correctly you should override 
the provided SEO mixin in your site package:

    'Shel.Neos.YoastSeo:Mixin.SEO':
      superTypes:
        'Shel.Neos.YoastSeo:Mixin.Analysis.OldUi': true

## Supported languages

There are three different kinds of language support:

### Backend localization for the Neos implementation

These are localizations for all Neos CMS specifics not related to the wordpress version of YoastSEO.

* English ✅             
* German ✅   

If you can provide the backend localizations for other languages than the ones provided in the 
table above, please create a PR.                                                                                   

### Supported languages of the analyzer results in the backend 

These are localizations for the recommendations that the analysis provides and will be selected based on 
the current users backend language.

Please consult [YoastSEO on wordpress](https://translate.wordpress.org/projects/wp-plugins/wordpress-seo).

### Supported content languages for the analyzer                 

These are the content languages that the analyzer supports. If the language of your content is not contained in the
list the analysis will still work but not give the same quality of recommendations.

Please consult [YoastSEO.js readme](https://github.com/Yoast/YoastSEO.js/blob/develop/README.md).

## Configuration

In your `Settings.yaml` you can override the following options:

    Shel:
      Neos:
        YoastSeo:
          defaultContentLocale: en-US
          languageToLocaleMapping: [...]
          
and

    Neos:
      Neos:
        UI:    
          frontendConfiguration:
            'Shel.Neos.YoastSeo':
               contentSelector: 'body'
          
### defaultContentLocale 

The analyzer will use the `lang` attribute rendered by the `Neos.Seo` package of your website to detect the 
language of your content. This option sets the default if `Neos.Seo` cannot detect it.
If no `lang` attribute is rendered the javascript part will use `en_US`.

Note that the html standard requires a `-` in the locale while Neos and Yoast internally use `_` and convert if needed. 

Check https://github.com/Yoast/YoastSEO.js#supported-languages for supported languages and the capabilities.
If you use a locale that Yoast doesn't understand don't expect perfect results. 

### languageToLocaleMapping

This array defines which translation should be used in the Yoast SEO analyzer depending on the selected interface
language of a Neos user.

See the `Settings.yaml` of this package and if you for example want a different version localized translation,
check out the folder `Resources/Private/Languages` and see which ones are supported and then update the mapping
accordingly.

For example the default mapping for `de` is `de_DE` but can be changed to Swiss German with the following configuration:

    Shel:
      Neos:
        YoastSeo:
          languageToLocaleMapping: 
            de: 'de_CH'
            
### contentSelector

This setting allows you to specify a different element in your rendered page where the analysis should retrieve it's
content from. This can be used for example to select your content wrap to exclude hidden content for modals and other
elements.

Example:

    Neos:
      Neos:
        UI:    
          frontendConfiguration:
            'Shel.Neos.YoastSeo':
               contentSelector: '.my-content'

## Usage 

### Preview mode

After installation the new preview mode is available in the Neos backend which you can select form the `Edit / Preview` panel.

This is useful to check several pages after another and optimize SEO properties.
The preview also shows a preview how a page could look as Google search result.

### Inspector

In the inspector a new group "Yoast" is added in the SEO-Tab with the following fields:

* focusKeyword: The main keyword this document is optimzed for. This is needed by yoast for calculating metrics.
* isCornerstone: Mark the document as exceptionally important for yoast. This will enforce more strict content-rules.

The group also contains a live analyzer which will check your content and SEO data and show you the results.
Depending on your nodetype configuration the analyzer will update after you change something and show you up-to-date
information without needing a reload of the whole page.  

This view is helpful when optimizing a single page while working on it's content.

## Notes about the packages capabilities

* The language of your content is used in the analyzer but the summaries are currently english only.
* We try to render your site as good as possible for the YoastSEO analyzer to parse it. This might not work for every usecase! 

## Contributing && issues

* Contributions are very welcome. 
* Pull requests are even better!
* Please open issues for [this project](https://github.com/Sebobo/Shel.Neos.YoastSeo/issues) if you have problems with the backend module or other Neos specific features.
* Please open issues for [Yoast SEO](https://github.com/Yoast/YoastSEO.js) if you have problems with the analyzer itself or translations of any hints and warnings generated by the analyzer.

### Building the assets

You can generate the `js` and `css` files by running the following commands in the package folder:

    yarn install
    yarn run build-all
    
#### Building and watchting the app for the edit mode
    
    yarn run build-app
    
    yarn run watch-app
    
#### Building and watching the inspector view

    yarn run build-inspector
    
    yarn run watch-inspector

### Roadmap

* Test plugin with various projects to check behavior
* Implement more features from the Yoast javascript library (Text reading ease, etc...)
* Nicer backend view
