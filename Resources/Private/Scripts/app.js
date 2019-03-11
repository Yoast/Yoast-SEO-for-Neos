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
            .then(translations => {
                translations = JSON.parse(translations);
                if (translations && !translations.error) {
                    setLocaleData(translations['locale_data']['js-text-analysis'], 'yoast-components');
                }
            });
    }

    window.onload = () => {
        const configuration = JSON.parse(applicationContainer.dataset.configuration);

        fetchTranslations(configuration.translationsUrl)
            .then(fetch(configuration.previewUrl)
                .then((documentContent) => {
                    ReactDOM.render((
                        <NeosYoastApp documentContent={documentContent} modalContainer={modalContainer}
                                      editorFieldMapping={editorFieldMapping} {...configuration}/>), applicationContainer);
                })
            );
    }
})(document, window);
