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
        // Editable fields
        const focusKeywordField = document.getElementById('focusKeyword').querySelector('span');
        const pageUriPathSegmentField = document.getElementById('pageUriPathSegment');
        const seoTitleField = document.getElementById('seoTitle');
        const metaDescriptionField = document.getElementById('metaDescription');
        const editableFieldsWrap = document.getElementById('editable-fields-wrap');

        // Containers for rendering
        const errorOutput = document.getElementById('errorOutput');
        const snippet = document.getElementById('snippet');

        // Constants
        const previewUrl = document.getElementById('previewUrl').textContent;
        const baseUrl = document.getElementById('baseUrl').textContent;

        // Generate preview then initialize plugin
        get(previewUrl)
            .then((previewDocument) => {
                const parser = new DOMParser();
                const parsedPreviewDocument = parser.parseFromString(previewDocument, "text/html");
                const metaSection = parsedPreviewDocument.querySelector('head');
                const contentElements = parsedPreviewDocument.querySelectorAll('.neos-contentcollection');

                // Store metadata in object to make easily accessible
                const metaData = {
                    title: metaSection.querySelector('title').textContent,
                    description: metaSection.querySelector('meta[name="description"]').getAttribute('content')
                };

                // Concat all found content elements
                let pageContent = '';
                contentElements.forEach((element) => {
                    pageContent += element.innerHTML;
                });

                // Create snippet preview
                const snippetPreviewContainer = new SnippetPreview({
                    data: {
                        title: metaData.title,
                        metaDesc: metaData.description,
                        urlPath: pageUriPathSegmentField.textContent
                    },
                    placeholder: {
                        urlPath: ''
                    },
                    addTrailingSlash: false,
                    baseURL: baseUrl,
                    targetElement: snippet
                });

                // Initialize plugin
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
                observer.observe(focusKeywordField, {characterData: true, subtree: true});

                // Replace snippet editor form parts with Neos inline editing fields
                const snippetEditorForm = snippet.querySelector('.snippet-editor__form');
                snippetEditorForm.prepend(editableFieldsWrap);

                // Move progress bars after new fields
                seoTitleField.after(snippetEditorForm.querySelector('.snippet-editor__progress-title'));
                metaDescriptionField.after(snippetEditorForm.querySelector('.snippet-editor__progress-meta-description'));

                // Remove all original fields
                snippetEditorForm.querySelectorAll('.snippet-editor__label').forEach((label) => {
                    label.remove();
                });

                // Update snippet when editable fields are changed
                const seoTitleObserver = new MutationObserver(function(mutations) {
                    snippetPreviewContainer.setTitle(seoTitleField.textContent);
                    snippetPreviewContainer.setUrlPath(pageUriPathSegmentField.textContent);
                    snippetPreviewContainer.setMetaDescription(metaDescriptionField.textContent);
                });

                // Observe editable fields for changes
                seoTitleObserver.observe(seoTitleField, {characterData: true, subtree: true});
                seoTitleObserver.observe(pageUriPathSegmentField, {characterData: true, subtree: true});
                seoTitleObserver.observe(metaDescriptionField, {characterData: true, subtree: true});
            })
            .catch((err) => {
                errorOutput.textContent = err;
            });
    }
})(document, window);
