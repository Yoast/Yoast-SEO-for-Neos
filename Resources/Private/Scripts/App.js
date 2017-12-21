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
        const focusKeywordField = document.querySelector('.yoast-seo__focus-keyword');
        const snippetFieldsWrap = document.querySelector('.yoast-seo__snippet-fields');
        const uriPathSegmentField = document.querySelector('.yoast-seo__uri-path-segment');
        const titleField = document.querySelector('.yoast-seo__title');
        const metaDescriptionField = document.querySelector('.yoast-seo__meta-description');

        // Containers for rendering
        const errorOutput = document.querySelector('.yoast-seo__errorOutput');
        const snippet = document.querySelector('.yoast-seo__snippet-preview');

        // Constants
        const previewUrl = document.getElementById('previewUrl').textContent;
        const baseUrl = document.getElementById('baseUrl').textContent;

        // Generate preview then initialize plugin
        get(previewUrl)
            .then((previewDocument) => {
                const parser = new DOMParser();
                const parsedPreviewDocument = parser.parseFromString(previewDocument, "text/html");

                // Extract meta block and content elements from parsed preview
                const metaSection = parsedPreviewDocument.querySelector('head');
                const contentElements = parsedPreviewDocument.querySelectorAll('.neos-contentcollection');

                // Store metadata in object to make easily accessible
                const metaData = {
                    title: metaSection.querySelector('title').textContent,
                    description: metaSection.querySelector('meta[name="description"]') ? metaSection.querySelector('meta[name="description"]').getAttribute('content') : ''
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
                        urlPath: uriPathSegmentField.textContent
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

                // Replace snippet editor form parts with Neos inline editing fields
                const snippetEditorForm = snippet.querySelector('.snippet-editor__form');
                snippetEditorForm.prepend(snippetFieldsWrap);

                // Move progress bars after new fields
                titleField.after(snippetEditorForm.querySelector('.snippet-editor__progress-title'));
                metaDescriptionField.after(snippetEditorForm.querySelector('.snippet-editor__progress-meta-description'));

                // Remove all original fields
                snippetEditorForm.querySelectorAll('.snippet-editor__label').forEach((label) => {
                    label.remove();
                });

                // Update snippet when editable fields are changed
                const snippetFieldsObserver = new MutationObserver(() => {
                    snippetPreviewContainer.setTitle(titleField.innerText);
                    snippetPreviewContainer.setUrlPath(uriPathSegmentField.innerText);
                    snippetPreviewContainer.setMetaDescription(metaDescriptionField.innerText);
                });

                // Observe editable fields for changes
                snippetFieldsObserver.observe(titleField, {characterData: true, subtree: true});
                snippetFieldsObserver.observe(uriPathSegmentField, {characterData: true, subtree: true});
                snippetFieldsObserver.observe(metaDescriptionField, {characterData: true, subtree: true});

                // Update analysis when focus keyword changes
                const focusKeywordObserver = new MutationObserver(app.refresh);
                focusKeywordObserver.observe(focusKeywordField, {characterData: true, subtree: true});
            })
            .catch((err) => {
                console.log(err);
                errorOutput.textContent = err;
                errorOutput.classList.remove('hidden');
            });
    }
})(document, window);
