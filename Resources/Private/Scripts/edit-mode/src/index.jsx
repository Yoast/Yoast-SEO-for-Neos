import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { RecoilRoot } from 'recoil';

import './Main.scss';
import NeosYoastApp from './components/NeosYoastApp';
import { I18nProvider } from './provider/I18nProvider';
import { ConfigurationProvider } from './provider/ConfigurationProvider';

/**
 * This script creates the app for the Yoast preview mode in Neos CMS
 */
((document, window) => {
    const applicationContainer = document.querySelector('#yoast-app');
    const modalContainer = document.querySelector('#yoast-modal');
    const snippetEditorContainer = document.querySelector('.snippet-editor');
    const titleField = snippetEditorContainer.querySelector('.snippet-editor__title');
    const titleOverrideField = snippetEditorContainer.querySelector('.snippet-editor__title-override');
    const descriptionField = snippetEditorContainer.querySelector('.snippet-editor__description');
    const uriPathSegmentField = snippetEditorContainer.querySelector('.snippet-editor__uri-path-segment');
    const focusKeywordField = snippetEditorContainer.querySelector('.snippet-editor__focus-keyword');

    const editorFieldMapping = {
        title: titleField,
        titleOverride: titleOverrideField,
        focusKeyword: focusKeywordField,
        description: descriptionField,
        slug: uriPathSegmentField,
    };

    /**
     * After everything is loaded initialize providers and app
     */
    window.onload = () => {
        const configuration = JSON.parse(applicationContainer.dataset.configuration);

        ReactDOM.render(
            <I18nProvider translationsUrl={configuration.translationsUrl}>
                <ConfigurationProvider
                    modalContainer={modalContainer}
                    editorFieldMapping={editorFieldMapping}
                    configuration={configuration}
                >
                    <ThemeProvider theme={{ isRtl: false }}>
                        <RecoilRoot>
                            <NeosYoastApp />
                        </RecoilRoot>
                    </ThemeProvider>
                </ConfigurationProvider>
            </I18nProvider>,
            applicationContainer
        );
    };
})(document, window);
