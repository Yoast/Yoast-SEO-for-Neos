import '../Styles/Main.scss';
import PageParser from "./YoastInfoView/src/helper/pageParser";
import ContentAnalysisWrapper from "./YoastInfoView/src/components/contentAnalysisWrapper";

import React from './YoastInfoView/node_modules/react';
import ReactDOM from './YoastInfoView/node_modules/react-dom';
import {IntlProvider} from './YoastInfoView/node_modules/react-intl';

import {SnippetPreview} from './YoastInfoView/node_modules/yoast-components/composites/Plugin/SnippetPreview';
import Loader from "./YoastInfoView/node_modules/yoast-components/composites/basic/Loader";
import {setTranslations} from './YoastInfoView/node_modules/yoast-components/utils/i18n';
import './YoastInfoView/node_modules/yoast-components/css/loadingSpinner.scss';

import AnalysisWorkerWrapper from './YoastInfoView/node_modules/yoastseo/src/worker/AnalysisWorkerWrapper';
import createWorker from './YoastInfoView/node_modules/yoastseo/src/worker/createWorker';
import Paper from './YoastInfoView/node_modules/yoastseo/src/values/Paper';

((document, window) => {

    let worker = null;

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

    function handleSnippetPreviewMouseUp() {
        console.log('Snippet preview mouse up');
    }

    window.onload = () => {
        const applicationContainer = document.querySelector('#yoast-app');

        // Constants
        const configuration = JSON.parse(document.getElementById('configuration').dataset.configuration);
        const {pageUrl, previewUrl, translationsUrl, focusKeyword, baseUrl, isCornerstone, contentSelector, isAmp, breadcrumbs, workerUrl} = configuration;

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
        console.log('previewdata', configuration);
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

                        // Define callback to allow content analysis to get results
                        const refreshAnalysisCallback = () => {
                            if (!worker) {
                                worker = new AnalysisWorkerWrapper(createWorker(workerUrl));
                            }
                            return worker.initialize({
                                useCornerstone: isCornerstone,
                                locale: pageParser.locale,
                                contentAnalysisActive: true,
                                keywordAnalysisActive: true,
                                logLevel: "ERROR"
                            }).then(() => {
                                let paper = new Paper(
                                    pageParser.pageContent,
                                    {
                                        keyword: focusKeyword,
                                        description: pageParser.description,
                                        title: pageParser.title,
                                        titleWidth: 100, // Retrieve via helper
                                        url: new URL(pageUrl).pathname,
                                        locale: pageParser.locale,
                                        permalink: ""
                                    }
                                );
                                return worker.analyze(paper);
                            });
                        };

                        let snippetPreviewProps = {
                            title: pageParser.title,
                            description: pageParser.description,
                            locale: pageParser.locale,
                            url: pageUrl,
                            keyword: focusKeyword,
                            breadcrumbs: breadcrumbs,
                            isAmp: isAmp,
                            onMouseUp: handleSnippetPreviewMouseUp,
                        };
                        ReactDOM.render((
                            <IntlProvider locale={pageParser.locale}>
                                <div>
                                    <Loader className=""/>
                                    <div className="yoast-seo__snippet-preview-wrapper">
                                        <SnippetPreview {...snippetPreviewProps}/>
                                    </div>
                                    <ContentAnalysisWrapper refreshAnalysisCallback={refreshAnalysisCallback}/>
                                </div>
                            </IntlProvider>
                        ), applicationContainer);
                    });
            });
    }
})(document, window);
