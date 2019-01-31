import '../Styles/Main.scss';
import PageParser from "./YoastInfoView/src/helper/pageParser";
import App from './YoastInfoView/node_modules/yoastseo/src/app';
import SnippetPreview from './YoastInfoView/node_modules/yoastseo/src/snippetPreview';
import Jed from './YoastInfoView/node_modules/jed/jed';

((document, window) => {
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
        const spinner = document.querySelector('.yoast-seo__spinner');

        // Containers for rendering
        const errorOutput = document.querySelector('.yoast-seo__errorOutput');
        const snippet = document.querySelector('.yoast-seo__snippet-preview');

        // Constants
        const configuration = JSON.parse(document.getElementById('configuration').dataset.configuration);
        const {previewUrl, translationsUrl, baseUrl, cornerstone, contentSelector} = configuration;

        let refreshTimeout = undefined;

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
                    .then((documentContent) => {
                        let pageParser = new PageParser(documentContent, contentSelector);
                        let jed = new Jed(translations);

                        const snippetPreview = new SnippetPreview({
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
                            targetElement: snippet,
                            i18n: jed
                        });
                        // Render template once to avoid race conditions with yoast pluggable system
                        snippetPreview.renderTemplate();

                        let app = new App({
                            snippetPreview: snippetPreview,
                            targets: {
                                output: 'output'
                            },
                            locale: pageParser.locale,
                            translations: translations,
                            callbacks: {
                                getData: () => {
                                    return {
                                        title: getSnippetFieldValue(titleField, titleOverrideField),
                                        metaTitle: pageParser.title,
                                        keyword: getSnippetFieldValue(focusKeywordField),
                                        text: pageParser.pageContent,
                                        excerpt: getSnippetFieldValue(metaDescriptionField),
                                        url: getSnippetFieldValue(uriPathSegmentField)
                                    };
                                },
                                updatedContentResults: () => {
                                    spinner.classList.add('yoast-seo__spinner--hidden');
                                }
                            }
                        });
                        app.changeAssessorOptions(!!cornerstone);
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
                            snippetPreview.setTitle(getSnippetFieldValue(titleField));
                            snippetPreview.setUrlPath(getSnippetFieldValue(uriPathSegmentField));
                            snippetPreview.setMetaDescription(getSnippetFieldValue(metaDescriptionField));
                        });

                        // Observe editable fields for changes
                        snippetFieldsObserver.observe(titleField, {characterData: true, subtree: true});
                        snippetFieldsObserver.observe(titleOverrideField, {characterData: true, subtree: true});
                        snippetFieldsObserver.observe(uriPathSegmentField, {characterData: true, subtree: true});
                        snippetFieldsObserver.observe(metaDescriptionField, {characterData: true, subtree: true});

                        // Update analysis when focus keyword changes after some time
                        const focusKeywordChanged = (e) => {
                            clearTimeout(refreshTimeout);
                            refreshTimeout = setTimeout(() => {
                                spinner.classList.remove('yoast-seo__spinner--hidden');
                                setTimeout(() => app.refresh(), 1);
                            }, 2000);
                        };

                        focusKeywordField.addEventListener('input', focusKeywordChanged);
                        focusKeywordField.addEventListener('keyup', focusKeywordChanged);
                    })
                    .catch((err) => {
                        errorOutput.textContent = err;
                        errorOutput.classList.remove('hidden');
                        throw err;
                    });
            });
    }
})(document, window);
