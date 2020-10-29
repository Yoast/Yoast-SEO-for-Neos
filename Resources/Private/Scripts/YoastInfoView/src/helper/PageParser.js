export default class PageParser {
    constructor(documentContent, contentSelector) {
        if (!contentSelector) {
            contentSelector = 'body';
        }

        this.parser = new DOMParser();
        const parsedPreviewDocument = this.parser.parseFromString(documentContent, 'text/html');

        this.metaSection = parsedPreviewDocument.querySelector('head');

        // Remove problematic tags for the Yoast plugin from preview document
        const scriptTags = parsedPreviewDocument.querySelectorAll('script,svg');
        scriptTags.forEach(scriptTag => {
            scriptTag.remove();
        });

        this.locale = (parsedPreviewDocument.querySelector('html').getAttribute('lang') || 'en_US').replace('-', '_');

        this.pageContent = parsedPreviewDocument.querySelector(contentSelector).innerHTML;
        // Remove problematic data attributes for the Yoast plugin from preview document
        const re = /data-.*?=".*?"/gim;
        this.pageContent = this.pageContent.replace(re, '');

        debugger;
    }

    get title() {
        return this.metaSection.querySelector('title') ? this.metaSection.querySelector('title').textContent : '';
    }

    get description() {
        const query = 'meta[name="description"]';
        return this.metaSection.querySelector(query) ? this.metaSection.querySelector(query).getAttribute('content') : '';
    }

    get faviconSrc() {
        const query = 'link[rel="shortcut icon"],link[rel="icon"]';
        return this.metaSection.querySelector(query) ? this.metaSection.querySelector(query).getAttribute('href') : '';
    }

    get twitterCard() {
        const query = 'meta[name^="twitter:"]';
        const tags = this.metaSection.querySelectorAll(query);

        const twitterData = {
            card: null,
            title: null,
            site: null,
            description: null,
            creator: null,
            url: null,
            image: null
        };

        tags.forEach(tag => {
            const tagName = tag.getAttribute('name').replace('twitter:', '');
            twitterData[tagName] = tag.getAttribute('content');
        });

        return twitterData;
    }

    get openGraph() {
        const query = 'meta[property^="og:"]';
        const tags = this.metaSection.querySelectorAll(query);

        const openGraphData = {
            type: null,
            title: null,
            'site_name': null,
            locale: null,
            description: null,
            url: null,
            image: null,
            'image:width': null,
            'image:height': null,
            'image:alt': null
        };

        tags.forEach(tag => {
            const tagName = tag.getAttribute('property').replace('og:', '');
            openGraphData[tagName] = tag.getAttribute('content');
        });

        return openGraphData;
    }
}
