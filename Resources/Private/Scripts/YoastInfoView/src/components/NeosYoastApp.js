// External generic dependencies
import React, {PureComponent} from "react";
import PropTypes from "prop-types";
import {ThemeProvider} from "styled-components";
import debounce from "lodash.debounce";
import {__} from "@wordpress/i18n";

// External Yoast dependencies
import Loader from "@yoast/components/Loader";
import KeywordInput from "yoast-components/composites/Plugin/Shared/components/KeywordInput";
import SnippetEditor from "@yoast/search-metadata-previews/snippet-editor/SnippetEditor";

import {MODES} from "@yoast/search-metadata-previews/snippet-preview/constants";
import AnalysisWorkerWrapper from 'yoastseo/src/worker/AnalysisWorkerWrapper';
import createWorker from 'yoastseo/src/worker/createWorker';
import Paper from 'yoastseo/src/values/Paper';
import {measureTextWidth} from 'yoastseo/src/helpers';

// Internal dependencies
import ContentAnalysisWrapper from "./ContentAnalysisWrapper";
import PageParser from "../helper/PageParser";
import {groupResultsByRating, parseResults} from "../helper/resultParser";

const errorResult = {
    text: 'An error occurred while analyzing the page!',
    id: '1',
    rating: 'feedback',
    hasMarks: false,
};

export default class NeosYoastApp extends PureComponent {
    static propTypes = {
        modalContainer: PropTypes.object.isRequired,
        translations: PropTypes.object.isRequired,
        editorFieldMapping: PropTypes.shape({
            title: PropTypes.object.isRequired,
            titleOverride: PropTypes.object.isRequired,
            description: PropTypes.object.isRequired,
            slug: PropTypes.object.isRequired,
        }).isRequired,
        title: PropTypes.string.isRequired,
        titleOverride: PropTypes.string,
        description: PropTypes.string,
        focusKeyword: PropTypes.string,
        isCornerstone: PropTypes.bool,
        isHomepage: PropTypes.bool,
        isAmp: PropTypes.bool,
        uiLocale: PropTypes.string.isRequired,
        uriPathSegment: PropTypes.string.isRequired,
        translationsUrl: PropTypes.string.isRequired,
        workerUrl: PropTypes.string.isRequired,
        previewUrl: PropTypes.string.isRequired,
        baseUrl: PropTypes.string.isRequired,
        pageUrl: PropTypes.string.isRequired,
        contentSelector: PropTypes.string.isRequired,
        breadcrumbs: PropTypes.array,
        faviconSrc: PropTypes.string,
    };

    constructor(props) {
        super(props);

        const activeTitleField = this.props.titleOverride ? 'titleOverride' : 'title';

        this.state = {
            worker: null,
            error: null,
            mode: MODES.MODE_DESKTOP,
            activeTitleField: activeTitleField,
            firstPageLoadComplete: false,
            faviconSrc: null,
            editorData: {
                title: this.props[activeTitleField],
                description: this.props.description || '',
                slug: this.props.uriPathSegment,
                url: this.props.pageUrl,
                focusKeyword: this.props.focusKeyword || '',
            },
            page: {
                titleTemplate: '{title}',
                title: '',
                description: '',
                content: '',
                locale: '',
                isLoading: true,
            },
            isAnalyzing: true,
            allResults: {},
            seoResults: {
                score: null,
                problemsResults: [],
                improvementsResults: [],
                goodResults: [],
                considerationsResults: [],
                errorsResults: [],
            },
            readabilityResults: {
                score: null,
                problemsResults: [],
                improvementsResults: [],
                goodResults: [],
                considerationsResults: [],
                errorsResults: [],
            }
        };

        this.updateNeosFields = debounce(this.updateNeosFields.bind(this), 500);
        this.requestNewPageContent = debounce(this.requestNewPageContent.bind(this), 3000);
    };

    /**
     * Load content for the first time when component is ready.
     */
    componentDidMount() {
        this.fetchContent();
    }

    /**
     * Debounced wrapper for fetching new page content
     */
    requestNewPageContent = () => {
        this.fetchContent();
    };

    /**
     * Fetch new content from page preview and trigger analysis at the end.
     */
    fetchContent = () => {
        this.setState({
            page: {
                ...this.state.page,
                isLoading: true,
            },
            isAnalyzing: true,
        });

        fetch(this.props.previewUrl)
            .then(response => {
                if (!response) {
                    return;
                }
                if (!response.ok) {
                    throw new Error(`Failed fetching preview for Yoast SEO analysis: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(documentContent => {
                const pageParser = new PageParser(documentContent, this.props.contentSelector);
                const titleTemplate = this.state.firstPageLoadComplete ? this.state.page.titleTemplate : NeosYoastApp.buildTitleTemplate(this.props[this.state.activeTitleField], pageParser.title);

                if (!this.state.firstPageLoadComplete) {
                    this.updateFavicon(pageParser.faviconSrc);
                }

                this.setState({
                    firstPageLoadComplete: true,
                    page: {
                        titleTemplate: titleTemplate,
                        title: pageParser.title,
                        description: pageParser.description,
                        locale: pageParser.locale,
                        content: pageParser.pageContent,
                        isLoading: false,
                    },
                    results: {}
                }, this.refreshAnalysis);
            })
            .catch((error) => {
                this.setState({
                    error: error.message,
                    page: {
                        isLoading: false,
                    },
                });
                console.error(error, 'An error occurred while loading the preview');
            });
    };

    /**
     * Checks the page content for a favicon meta tag and will try to retrieve it.
     * If it fails it will try to load the favicon from the default src.
     * If it fails it will instruct the yoast component to use it's default.
     *
     * @returns {Promise<void>}
     */
    async updateFavicon(faviconMetaTagSrc) {
        if (faviconMetaTagSrc) {
            let response = await fetch(faviconMetaTagSrc);

            if (response.ok) {
                this.setState({faviconSrc: faviconMetaTagSrc});
                return;
            }
        }

        const {faviconSrc} = this.props;
        let response = await fetch(faviconSrc);
        if (response.ok) {
            this.setState({faviconSrc});
        }
    };

    /**
     * Generate a title template by searching for the configured title in the rendered title.
     *
     * @param pageTitle the entered title from the page properties
     * @param renderedTitle the generated title how it appears in the frontend
     */
    static buildTitleTemplate(pageTitle, renderedTitle) {
        if (renderedTitle.indexOf(pageTitle) >= 0) {
            return renderedTitle.replace(pageTitle, '{title}');
        }
        return '{title}';
    }

    /**
     * Create and initialize worker and return a promise for it to finish.
     * @returns {Promise}
     */
    initializeWorker = () => {
        let {worker} = this.state;
        if (!worker) {
            worker = new AnalysisWorkerWrapper(createWorker(this.props.workerUrl));
            this.setState({worker: worker});
        }
        return worker.initialize({
            useCornerstone: this.props.isCornerstone,
            locale: this.state.page.locale,
            contentAnalysisActive: true,
            keywordAnalysisActive: true,
            logLevel: "ERROR",
            translations: this.props.translations,
        });
    };

    /**
     * Send page content to worker and retrieve analysis results when it's done.
     */
    refreshAnalysis = () => {
        this.initializeWorker().then(() => {
            const paper = new Paper(
                this.state.page.content,
                {
                    keyword: this.state.editorData.focusKeyword || '',
                    description: this.state.page.description || '',
                    title: this.state.page.title,
                    titleWidth: measureTextWidth(this.state.page.title),
                    url: new URL(this.props.pageUrl).pathname,
                    locale: this.state.page.locale,
                    permalink: ""
                }
            );
            return this.state.worker.analyze(paper);
        }).then((results) => {
            let seoResults = parseResults(results.result.seo[''].results);
            let readabilityResults = parseResults(results.result.readability.results);

            let groupedSeoResults = groupResultsByRating(seoResults);
            let groupedReadabilityResults = groupResultsByRating(readabilityResults);

            this.setState({
                allResults: {...seoResults, ...readabilityResults},
                seoResults: {
                    score: results.result.seo[''].score,
                    problemsResults: groupedSeoResults.bad,
                    improvementsResults: groupedSeoResults.ok,
                    goodResults: groupedSeoResults.good,
                    considerationsResults: groupedSeoResults.feedback,
                },
                readabilityResults: {
                    score: results.result.readability.score,
                    problemsResults: groupedReadabilityResults.bad,
                    improvementsResults: groupedReadabilityResults.ok,
                    goodResults: groupedReadabilityResults.good,
                    considerationsResults: groupedReadabilityResults.feedback,
                },
                isAnalyzing: false,
            });
        }).catch((error) => {
            console.error(error, 'An error occurred while analyzing the page');

            this.setState({
                seoResults: {
                    ...this.state.seoResults,
                    errorResults: [errorResult]
                },
                readabilityResults: {
                    ...this.state.readabilityResults,
                    errorResults: [errorResult]
                },
                isAnalyzing: false,
            })
        });
    };

    /**
     * Update hidden Neos fields from the changed values of the editor fields.
     * Or in case of `mode` switch the preview template.
     *
     * @param key
     * @param data
     */
    onSnippetEditorChange = (key, data) => {
        if (this.props.editorFieldMapping[key]) {
            this.setState({
                editorData: {...this.state.editorData, [key]: data}
            });
            this.updateNeosFields(key, data);
        } else if (key === 'mode') {
            this.setState({mode: data});
        }
    };

    /**
     * Update hidden Neos editable fields to forward changes to the backend
     *
     * @param key
     * @param data
     */
    updateNeosFields = (key, data) => {
        if (key === 'title') {
            key = this.state.activeTitleField;
        }
        let field = this.props.editorFieldMapping[key].querySelector('.neos-inline-editable');

        // Try to update the hidden fields data via the CKEDITOR api
        // The api might not be initialized yet
        if (window.CKEDITOR && window.CKEDITOR.instances && Object.keys(window.CKEDITOR.instances).length > 0) {
            for (let [key, editor] of Object.entries(window.CKEDITOR.instances)) {
                if (editor.element.$ === field) {
                    editor.setData(data);
                }
            }
        } else {
            // Update the hidden field without the api. This works fine with CKEditor 5
            if (field.hasChildNodes() && field.childNodes.length === 1 && field.childNodes[0].nodeType === 1) {
                field.childNodes[0].innerHTML = data;
            } else {
                field.innerHTML = data;
            }
        }

        // Request new page content and analysis after changes were applied
        this.requestNewPageContent();
    };

    /**
     * Process field values before giving them to the preview.
     * We modify the title in the preview according to the template we generated in the constructor.
     *
     * @param mappedData contains title, description and url
     * @param context
     */
    mapEditorDataToPreview = (mappedData, context) => {
        return {
            title: this.state.page.titleTemplate.replace('{title}', mappedData.title),
            url: this.props.isHomepage ? this.props.baseUrl : mappedData.url,
            description: mappedData.description,
        };
    };

    /**
     * Renders the snippet editor and analysis component
     */
    render() {
        const {firstPageLoadComplete, error} = this.state;

        const editorProps = {
            data: this.state.editorData,
            baseUrl: this.props.baseUrl,
            locale: this.props.uiLocale,
            keyword: this.state.editorData.focusKeyword,
            breadcrumbs: this.props.breadcrumbs,
            isAmp: this.props.isAmp,
            hasPaperStyle: false,
            onChange: this.onSnippetEditorChange,
            mapEditorDataToPreview: this.mapEditorDataToPreview,
            mode: this.state.mode,
            faviconSrc: this.state.faviconSrc,
            replacementVariables: [],
            recommendedReplacementVariables: [],
        };

        const analysisProps = {
            modalContainer: this.props.modalContainer,
            allResults: this.state.allResults,
            readabilityResults: this.state.readabilityResults,
            seoResults: this.state.seoResults,
            isAnalyzing: this.state.isAnalyzing,
            onChange: this.onSnippetEditorChange,
            focusKeyword: this.state.editorData.focusKeyword,
        };

        return (
            <ThemeProvider theme={{isRtl: false}}>
                <div>
                    <Loader className={analysisProps.isAnalyzing ? '' : 'yoast-loader--stop'}/>
                    {error && <div className="yoast-seo__error">{error}</div>}
                    {!error &&
                        <>
                            <div className="yoast-seo__keyphrase-editor-wrapper">
                                <KeywordInput
                                    id="focus-keyphrase"
                                    keyword={editorProps.keyword}
                                    onChange={(value) => this.onSnippetEditorChange('focusKeyword', value)}
                                    onRemoveKeyword={() => this.onSnippetEditorChange('focusKeyword', '')}
                                    label={__('Focus keyphrase', 'yoast-components')}
                                    ariaLabel={__('Focus keyphrase', 'yoast-components')}/>
                            </div>
                            <div className="yoast-seo__snippet-editor-wrapper">
                                {firstPageLoadComplete && <SnippetEditor {...editorProps}/>}
                            </div>
                            <ContentAnalysisWrapper {...analysisProps}/>
                        </>
                    }
                </div>
            </ThemeProvider>
        )
    }
}
