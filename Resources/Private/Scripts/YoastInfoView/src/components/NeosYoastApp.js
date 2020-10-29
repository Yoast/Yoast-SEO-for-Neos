// External generic dependencies
import React, {PureComponent} from "react";
import PropTypes from "prop-types";
import {ThemeProvider} from "styled-components";
import debounce from "lodash.debounce";
import {__} from "@wordpress/i18n";

// External Yoast dependencies
import colors from '@yoast/style-guide/colors';

import Loader from "@yoast/components/Loader";
import KeywordInput from "yoast-components/composites/Plugin/Shared/components/KeywordInput";
import SvgIcon from "@yoast/components/SvgIcon";
import Tabs from "@yoast/components/Tabs";

import SnippetEditor from "@yoast/search-metadata-previews/snippet-editor/SnippetEditor";
import {MODE_DESKTOP} from "@yoast/search-metadata-previews/snippet-preview/constants";

import AnalysisWorkerWrapper from 'yoastseo/src/worker/AnalysisWorkerWrapper';
import createWorker from 'yoastseo/src/worker/createWorker';
import Paper from 'yoastseo/src/values/Paper';
import scoreToRating from "yoastseo/src/interpreters/scoreToRating";
import {measureTextWidth} from 'yoastseo/src/helpers';

// Internal dependencies
import ReadabilityAnalysis from "./ReadabilityAnalysis";
import SocialPreviews from "./SocialPreviews";
import SeoAnalysis from "./SeoAnalysis";
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
            slug: PropTypes.object.isRequired
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
        twitterFallbackImage: PropTypes.string,
        openGraphFallbackImage: PropTypes.string
    };

    constructor(props) {
        super(props);

        const activeTitleField = this.props.titleOverride ? 'titleOverride' : 'title';

        this.state = {
            worker: null,
            error: null,
            mode: MODE_DESKTOP,
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
                twitterCard: {
                    card: null,
                    title: null,
                    site: null,
                    description: null,
                    creator: null,
                    url: null,
                    image: null
                },
                openGraph: {
                    type: null,
                    title: null,
                    'site_name': null,
                    locale: null,
                    description: null,
                    url: null,
                    image: null,
                    'image:width': null,
                    'image:height': null,
                    'image:alt': null
                },
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
            const { page, firstPageLoadComplete, activeTitleField } = this.state;
            const { contentSelector } = this.props;

            const pageParser = new PageParser(documentContent, contentSelector);
            const titleTemplate = firstPageLoadComplete ? page.titleTemplate : NeosYoastApp.buildTitleTemplate(this.props[activeTitleField], pageParser.title);

            if (!firstPageLoadComplete) {
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
                    twitterCard: pageParser.twitterCard,
                    openGraph: pageParser.openGraph,
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
                this.setState({ faviconSrc: faviconMetaTagSrc });
                return;
            }
        }

        const { faviconSrc } = this.props;
        let response = await fetch(faviconSrc);
        if (response.ok) {
            this.setState({ faviconSrc });
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
        let { worker, page } = this.state;
        const { workerUrl, isCornerstone, translations } = this.props;

        if (!worker) {
            worker = new AnalysisWorkerWrapper(createWorker(workerUrl));
            this.setState({ worker: worker });
        }
        return worker.initialize({
            useCornerstone: isCornerstone,
            locale: page.locale,
            contentAnalysisActive: true,
            keywordAnalysisActive: true,
            logLevel: "ERROR",
            translations: translations,
        });
    };

    /**
     * Send page content to worker and retrieve analysis results when it's done.
     */
    refreshAnalysis = () => {
        this.initializeWorker().then(() => {
            const { page, editorData, worker } = this.state;

            const paper = new Paper(
                page.content,
                {
                    keyword: editorData.focusKeyword || '',
                    description: page.description || '',
                    title: page.title,
                    titleWidth: measureTextWidth(page.title),
                    url: new URL(this.props.pageUrl).pathname,
                    locale: page.locale,
                    permalink: ""
                }
            );
            return worker.analyze(paper);
        }).then((results) => {
            let seoResults = parseResults(results.result.seo[''].results);
            let readabilityResults = parseResults(results.result.readability.results);

            let groupedSeoResults = groupResultsByRating(seoResults);
            let groupedReadabilityResults = groupResultsByRating(readabilityResults);

            this.setState({
                allResults: { ...seoResults, ...readabilityResults },
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
            const { seoResults, readabilityResults } = this.state;

            this.setState({
                seoResults: {
                    ...seoResults,
                    errorResults: [errorResult]
                },
                readabilityResults: {
                    ...readabilityResults,
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
                editorData: { ...this.state.editorData, [key]: data }
            });
            this.updateNeosFields(key, data);
        } else if (key === 'mode') {
            this.setState({ mode: data });
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
            description: mappedData.description || this.state.page.description,
        };
    };

    /**
     * Renders the snippet editor and analysis component
     */
    render() {
        const {
            firstPageLoadComplete,
            error,
            editorData,
            page,
            mode,
            faviconSrc,
            allResults,
            seoResults,
            isAnalyzing,
            readabilityResults
        } = this.state;

        const {
            baseUrl,
            uiLocale,
            breadcrumbs,
            isAmp,
            modalContainer,
            twitterFallbackImage,
            openGraphFallbackImage
        } = this.props;

        const editorProps = {
            data: editorData,
            baseUrl,
            locale: uiLocale,
            keyword: editorData.focusKeyword,
            breadcrumbs,
            isAmp,
            hasPaperStyle: false,
            onChange: this.onSnippetEditorChange,
            mapEditorDataToPreview: this.mapEditorDataToPreview,
            mode,
            faviconSrc,
            replacementVariables: [],
            recommendedReplacementVariables: [],
        };

        const seoRating = seoResults.score ? scoreToRating(seoResults.score / 10) : 'none';
        const seoRatingIcon = isAnalyzing ? 'loading-spinner' : 'seo-score-' + seoRating;
        const seoRatingColor = !isAnalyzing && seoRating !== 'none' ? seoRating : 'grey';

        const readabilityRating = readabilityResults.score ? scoreToRating(readabilityResults.score / 10) : 'none';
        const readabilityRatingIcon = isAnalyzing ? 'loading-spinner' : 'seo-score-' + readabilityRating;
        const readabilityRatingColor = !isAnalyzing && readabilityRating !== 'none' ? readabilityRating : 'grey';

        const tabPanels = [
            {
                id: 'seo',
                label: (
                    <>
                        <SvgIcon
                            icon={seoRatingIcon}
                            color={colors['$color_' + seoRatingColor]}
                            size="14px"
                        />
                        <span>{__('SEO', 'yoast-components')}</span>
                    </>
                ),
                content: (
                    <>
                        <div className="yoast-seo-keyphrase-editor-wrapper">
                            <KeywordInput
                                id="focus-keyphrase"
                                keyword={editorProps.keyword}
                                onChange={(value) => this.onSnippetEditorChange('focusKeyword', value)}
                                onRemoveKeyword={() => this.onSnippetEditorChange('focusKeyword', '')}
                                label={__('Focus keyphrase', 'yoast-components')}
                                ariaLabel={__('Focus keyphrase', 'yoast-components')} />
                        </div>
                        <div className="yoast-seo-snippet-editor-wrapper">
                            {firstPageLoadComplete && <SnippetEditor {...editorProps} />}
                        </div>
                        <SeoAnalysis
                            modalContainer={modalContainer}
                            allResults={allResults}
                            seoResults={seoResults}
                            seoRatingColor={seoRatingColor}
                            seoRatingIcon={seoRatingIcon}
                        />
                    </>
                )
            },
            {
                id: 'readability',
                label: (
                    <>
                        <SvgIcon
                            icon={readabilityRatingIcon}
                            color={colors['$color_' + readabilityRatingColor]}
                            size="14px"
                        />
                        <span>{__('Readability', 'yoast-components')}</span>
                    </>
                ),
                content: <ReadabilityAnalysis
                    modalContainer={modalContainer}
                    allResults={allResults}
                    readabilityResults={readabilityResults}
                />
            },
            {
                id: 'social',
                label: __('Social', 'yoast-components'),
                content: <SocialPreviews
                    editorData={editorData}
                    page={page}
                    twitterFallbackImage={twitterFallbackImage}
                    openGraphFallbackImage={openGraphFallbackImage}
                />
            }
        ]

        return (
            <ThemeProvider theme={{ isRtl: false }}>
                <Loader className={isAnalyzing ? '' : 'yoast-loader--stop'} />
                {error && <div className="yoast-seo__error">{error}</div>}
                {!error && <Tabs items={tabPanels} tabsFontSize="1em" tabsBaseWidth="auto" />}
            </ThemeProvider>
        )
    }
}
