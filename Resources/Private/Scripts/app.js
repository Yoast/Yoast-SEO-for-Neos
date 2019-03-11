import '../Styles/Main.scss';

import React from './YoastInfoView/node_modules/react';
import ReactDOM from './YoastInfoView/node_modules/react-dom';
import './YoastInfoView/node_modules/yoast-components/css/loadingSpinner.scss';

import {setTranslations} from './YoastInfoView/node_modules/yoast-components/utils/i18n';
import NeosSnippetEditor from './YoastInfoView/src/components/NeosSnippetEditor.js';

((document, window) => {
    const applicationContainer = document.querySelector('#yoast-app');
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
        const configuration = JSON.parse(applicationContainer.dataset.configuration);

        get(configuration.previewUrl)
            .then((documentContent) => {
                // FIXME: Load actual translations for these components
                let translation = {
                    "domain": "yoast-components",
                    "locale_data": {
                        "yoast-components": {
                            "Next": ["Volgende"],
                            "Previous": ["Vorige"],
                            "Close": ["Sluiten"]
                        }
                    }
                };
                setTranslations(translation);

                ReactDOM.render((
                    <NeosSnippetEditor documentContent={documentContent} editorFieldMapping={editorFieldMapping} {...configuration}/>), applicationContainer);
            });
    }
})(document, window);
