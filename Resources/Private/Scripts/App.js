import '../Styles/Main.scss';

((document, window) => {

    const SnippetPreview = require("yoastseo").SnippetPreview;
    const App = require("yoastseo").App;

    function get(url) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.open('GET', url);
            req.onload = () => req.status === 200 ? resolve(req.response) : reject(Error(req.statusText));
            req.onerror = (e) => reject(Error(`Network Error: ${e}`));
            req.send();
        });
    }

    window.onload = () => {
        const focusKeywordField = document.getElementById('focusKeyword').querySelector('span');
        const errorOutput = document.getElementById('errorOutput');
        const snippet = document.getElementById('snippet');
        const previewUrl = document.getElementById('previewUrl').textContent;
        const pageUriPathSegment = document.getElementById('pageUriPathSegment').textContent || '/';
        const baseUrl = document.getElementById('baseUrl').textContent;

        get(previewUrl)
            .then((previewDocument) => {
                const parser = new DOMParser();
                const parsedPreviewDocument = parser.parseFromString(previewDocument, "text/html");
                const metaSection = parsedPreviewDocument.querySelector('head');
                const contentElements = parsedPreviewDocument.querySelectorAll('.neos-contentcollection');

                const metaData = {
                    title: metaSection.querySelector('title').textContent,
                    description: metaSection.querySelector('meta[name="description"]').getAttribute('content')
                };

                let pageContent = '';
                contentElements.forEach((element) => {
                    pageContent += element.innerHTML;
                });

                console.log(pageContent);

                const snippetPreviewContainer = new SnippetPreview({
                    data: {
                        title: metaData.title,
                        metaDesc: metaData.description,
                        urlPath: pageUriPathSegment
                    },
                    placeholder: {
                        urlPath: 'Enter the uri path segment here'
                    },
                    baseURL: baseUrl,
                    targetElement: snippet
                });

                let app = new App({
                    snippetPreview: snippetPreviewContainer,
                    targets: {
                        output: 'output'
                    },
                    callbacks: {
                        getData: () => {
                            return {
                                title: metaData.title,
                                keyword: focusKeywordField.textContent.trim(),
                                text: pageContent
                            };
                        }
                    }
                });
                app.refresh();

                // Update analysis when focus keyword changes
                const observer = new MutationObserver(function(mutations) {
                    app.refresh();
                });

                const config = {characterData: true, subtree: true};
                observer.observe(focusKeywordField, config);
            })
            .catch((err) => {
                errorOutput.textContent = err;
            });
    }
})(document, window);
