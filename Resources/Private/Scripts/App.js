import '../Styles/Main.scss';

((document, window) => {

    const SnippetPreview = require("yoastseo").SnippetPreview;
    const App = require("yoastseo").App;

    /**
     * Request an url and get a Promise in return.
     *
     * @param {string} url
     * @returns {Promise}
     */
    function get(url) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.open('GET', url);
            req.onload = () => req.status === 200 ? resolve(req.response) : reject(Error(req.statusText));
            req.onerror = (e) => reject(Error(`Network Error: ${e}`));
            req.send();
        });
    }

    /**
     * Returns value of a editable snippet field.
     * If a placeholder is shown, an empty string is returned.
     * A second field can be provided as fallback.
     *
     * @param {Element} field
     * @param {Element} fallbackField
     * @returns {string}
     */
    function getSnippetFieldValue(field, fallbackField = null) {
        let value = field.classList.contains('placeholder') ? '' : field.textContent;

        if (fallbackField && !fallbackField.classList.contains('placeholder') && fallbackField.textContent) {
            value = fallbackField.textContent;
        }
        return value.trim();
    }

    window.onload = () => {
        // Editable fields
        const focusKeywordField = document.querySelector('.yoast-seo__focus-keyword');
        const snippetFieldsWrap = document.querySelector('.yoast-seo__snippet-fields');
        const uriPathSegmentField = document.querySelector('.yoast-seo__uri-path-segment');
        const titleField = document.querySelector('.yoast-seo__title');
        const titleOverrideField = document.querySelector('.yoast-seo__title-override');
        const metaDescriptionField = document.querySelector('.yoast-seo__meta-description');

        // Containers for rendering
        const errorOutput = document.querySelector('.yoast-seo__errorOutput');
        const snippet = document.querySelector('.yoast-seo__snippet-preview');

        // Constants
        const previewUrl = document.getElementById('previewUrl').textContent;
        const translationsUrl = '/neosyoastseo/fetchTranslations';
        const baseUrl = document.getElementById('baseUrl').textContent;
        const cornerstone = document.getElementById('cornerstone').textContent;

        // Retrieve translations
        let translations = {
            domain: "js-text-analysis",
            // eslint-disable-next-line camelcase
            locale_data: {
                "js-text-analysis": {
                    "": {}
                }
            }
        };

        get(translationsUrl)
            .then(response => response && JSON.parse(response))
            .then(newTranslations => {
                if (newTranslations && !newTranslations.error) {
                    translations = newTranslations;
                }
            })
            .then(() => {
                // Generate preview then initialize plugin
                get(previewUrl)
                    .then((previewDocument) => {
                        const parser = new DOMParser();
                        const parsedPreviewDocument = parser.parseFromString(previewDocument, "text/html");

                        // Extract meta block and content elements from parsed preview
                        const metaSection = parsedPreviewDocument.querySelector('head');

                        // Store metadata in object to make easily accessible
                        const renderedMetaData = {
                            title: metaSection.querySelector('title').textContent,
                            description: metaSection.querySelector('meta[name="description"]') ? metaSection.querySelector('meta[name="description"]').getAttribute('content') : ''
                        };

                        // Remove problematic tags for the Yoast plugin from preview document
                        let scriptTags = parsedPreviewDocument.querySelectorAll('script,svg');
                        scriptTags.forEach((scriptTag) => {
                            scriptTag.remove();
                        });

                        let pageContent = parsedPreviewDocument.querySelector('body').innerHTML;
                        let locale = (parsedPreviewDocument.querySelector('html').getAttribute('lang') || 'en_US').replace('-', '_');

                        const re = /data-.*?=".*?"/gim;
                        pageContent = pageContent.replace(re, '');

                        // Create snippet preview
                        const snippetPreviewContainer = new SnippetPreview({
                            data: {
                                title: getSnippetFieldValue(titleField, titleOverrideField),
                                metaDesc: getSnippetFieldValue(metaDescriptionField),
                                urlPath: getSnippetFieldValue(uriPathSegmentField)
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
                            locale: locale,
                            translations: translations,
                            callbacks: {
                                getData: () => {
                                    return {
                                        title: getSnippetFieldValue(titleField, titleOverrideField),
                                        metaTitle: renderedMetaData.title,
                                        keyword: getSnippetFieldValue(focusKeywordField),
                                        text: pageContent,
                                        excerpt: getSnippetFieldValue(metaDescriptionField),
                                        url: getSnippetFieldValue(uriPathSegmentField)
                                    };
                                }
                            }
                        });
                        app.switchAssessors(cornerstone ? true : false);
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
                            snippetPreviewContainer.setTitle(getSnippetFieldValue(titleField));
                            snippetPreviewContainer.setUrlPath(getSnippetFieldValue(uriPathSegmentField));
                            snippetPreviewContainer.setMetaDescription(getSnippetFieldValue(metaDescriptionField));
                        });

                        // Observe editable fields for changes
                        snippetFieldsObserver.observe(titleField, {characterData: true, subtree: true});
                        snippetFieldsObserver.observe(titleOverrideField, {characterData: true, subtree: true});
                        snippetFieldsObserver.observe(uriPathSegmentField, {characterData: true, subtree: true});
                        snippetFieldsObserver.observe(metaDescriptionField, {characterData: true, subtree: true});

                        // Update analysis when focus keyword changes
                        const focusKeywordObserver = new MutationObserver(app.refresh);
                        focusKeywordObserver.observe(focusKeywordField, {characterData: true, subtree: true});
                    })
                    .catch((err) => {
                        errorOutput.textContent = err;
                        errorOutput.classList.remove('hidden');
                    });
            });
    }
})(document, window);
