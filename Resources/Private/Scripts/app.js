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
     * After everything is loaded, fetch translations and run the app
     */
    window.onload = () => {
        const configuration = JSON.parse(applicationContainer.dataset.configuration);

        fetchTranslations(configuration.translationsUrl)
            .then(() => {
                console.log(translations);
                ReactDOM.render((
                    <NeosYoastApp modalContainer={modalContainer} translations={translations}
                                  editorFieldMapping={editorFieldMapping} {...configuration}/>), applicationContainer);
            });
    }
})(document, window);
