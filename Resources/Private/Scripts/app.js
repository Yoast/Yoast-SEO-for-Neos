import '../Styles/Main.scss';
import './YoastInfoView/node_modules/yoast-components/css/loadingSpinner.scss';

import React from './YoastInfoView/node_modules/react';
import ReactDOM from './YoastInfoView/node_modules/react-dom';
import {setLocaleData} from "./YoastInfoView/node_modules/@wordpress/i18n";

import NeosYoastApp from './YoastInfoView/src/components/NeosYoastApp';

((document, window) => {
    const applicationContainer = document.querySelector('#yoast-app');
    const modalContainer = document.querySelector('#yoast-modal');
    const snippetEditorContainer = document.querySelector('.snippet-editor');
    const titleField = snippetEditorContainer.querySelector('.snippet-editor__title');
    const titleOverrideField = snippetEditorContainer.querySelector('.snippet-editor__title-override');
    const descriptionField = snippetEditorContainer.querySelector('.snippet-editor__description');
    const uriPathSegmentField = snippetEditorContainer.querySelector('.snippet-editor__uri-path-segment');
    let translations = {
        domain: "js-text-analysis",
        locale_data: {
            "js-text-analysis": {
                "": {}
            }
        }
    };

    const editorFieldMapping = {
        title: titleField,
        titleOverride: titleOverrideField,
        description: descriptionField,
        slug: uriPathSegmentField,
    };

    /**
     * Request an url and get a Promise in return.
     *
     * @param {string} url
     * @returns {Promise}
     */
    function fetch(url) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.open('GET', url);
            req.onload = () => req.status === 200 ? resolve(req.response) : reject(Error(req.statusText));
            req.onerror = (e) => reject(Error(`Network Error: ${e}`));
            req.send();
        });
    }

    /**
     * Fetch translations and set them globally
     */
    function fetchTranslations(translationsUrl) {
        return self.fetch(translationsUrl)
            .then(response => {
                if (!response) {
                    return;
                }
                return response.text();
            })
            .then(newTranslations => {
                newTranslations = JSON.parse(newTranslations);
                if (newTranslations && !newTranslations.error) {
                    translations = newTranslations;
                }
                setLocaleData(translations['locale_data']['js-text-analysis'], 'yoast-components');
            });
    }

    function _belongsTo(element, ancestor) {
        if (element === null || element === document) {
            return false;
        }

        if (element === ancestor) {
            return true;
        }

        return _belongsTo(element.parentNode, ancestor);
    }

    window.onload = () => {
        const configuration = JSON.parse(applicationContainer.dataset.configuration);

        // Hotfix for issues with mousetrap version of new Neos UI
        // This is needed as there is an issue with content editable elements not being detected correctly
        // Which causes the hotkeys to fire when editing the Yoast title and description fields.
        // This can be removed when all UI versions are fixed by using Mousetrap 1.6.3.
        if (parent.Mousetrap) {
            const originalMousetrapCallback = parent.Mousetrap.prototype.stopCallback;

            parent.Mousetrap.prototype.stopCallback = (e, element) => {
                let originalCheck = originalMousetrapCallback(e, element);
                if (originalCheck) {
                    return true;
                }

                let self = this;

                if (_belongsTo(element, self.target)) {
                    return false;
                }

                if ('composedPath' in e && typeof e.composedPath === 'function') {
                    let initialEventTarget = e.composedPath()[0];
                    if (initialEventTarget !== e.target) {
                        element = initialEventTarget;
                    }
                }

                return element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA' || element.isContentEditable;
            };
        }

        fetchTranslations(configuration.translationsUrl)
            .then(fetch(configuration.previewUrl)
                .then((documentContent) => {
                    ReactDOM.render((
                        <NeosYoastApp documentContent={documentContent} modalContainer={modalContainer}
                                      translations={translations}
                                      editorFieldMapping={editorFieldMapping} {...configuration}/>), applicationContainer);
                })
            );
    }
})(document, window);
