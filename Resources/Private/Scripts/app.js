/**
 * This script creates the app for the Yoast preview mode in Neos CMS
 */

// External dependencies
import React from './YoastInfoView/node_modules/react';
import ReactDOM from './YoastInfoView/node_modules/react-dom';
import {setLocaleData} from "./YoastInfoView/node_modules/@wordpress/i18n";

// Internal dependencies
import '../Styles/Main.scss';
import NeosYoastApp from './YoastInfoView/src/components/NeosYoastApp';
import fetch from './YoastInfoView/src/helper/fetch';

((document, window) => {
    const applicationContainer = document.querySelector('#yoast-app');
    const modalContainer = document.querySelector('#yoast-modal');
    const snippetEditorContainer = document.querySelector('.snippet-editor');
    const titleField = snippetEditorContainer.querySelector('.snippet-editor__title');
    const titleOverrideField = snippetEditorContainer.querySelector('.snippet-editor__title-override');
    const descriptionField = snippetEditorContainer.querySelector('.snippet-editor__description');
    const uriPathSegmentField = snippetEditorContainer.querySelector('.snippet-editor__uri-path-segment');
    const focusKeywordField = snippetEditorContainer.querySelector('.snippet-editor__focus-keyword');

    // Generate basic translation object which is required in case the translations cannot be fetched.
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
        focusKeyword: focusKeywordField,
        description: descriptionField,
        slug: uriPathSegmentField,
    };

    /**
     * Fetch translations and store them for global usage
     */
    function fetchTranslations(translationsUrl) {
        return fetch(translationsUrl)
            .then(response => {
                if (!response) {
                    return;
                }
                return response.text ? response.text() : response;
            })
            .then(newTranslations => {
                newTranslations = JSON.parse(newTranslations);
                if (newTranslations && !newTranslations.error) {
                    translations = newTranslations;
                }
                setLocaleData(translations['locale_data']['js-text-analysis'], 'yoast-components');
            }).catch((error) => {
                console.error(error, 'An error occurred while loading translations');
            });
    }

    /**
     * Helper for checking whether an element is descendant of another
     */
    function _belongsTo(element, ancestor) {
        if (element === null || element === document) {
            return false;
        }

        if (element === ancestor) {
            return true;
        }

        return _belongsTo(element.parentNode, ancestor);
    }

    /**
     * After everything is loaded, fetch translations and run the app
     */
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
            .then(() => {
                console.log(translations);
                ReactDOM.render((
                    <NeosYoastApp modalContainer={modalContainer} translations={translations}
                                  editorFieldMapping={editorFieldMapping} {...configuration}/>), applicationContainer);
            });
    }
})(document, window);
