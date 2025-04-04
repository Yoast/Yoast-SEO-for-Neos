// External generic dependencies
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Jed from 'jed';
import debounce from 'lodash.debounce';

// External Neos dependencies
import { Icon, IconButton } from '@neos-project/react-ui-components';
import { neos } from '@neos-project/neos-ui-decorators';
import { selectors } from '@neos-project/neos-ui-redux-store';
import { fetchWithErrorHandling } from '@neos-project/neos-ui-backend-connector';

// External Yoast dependencies
import Paper from 'yoastseo/src/values/Paper';
import AnalysisWorkerWrapper from 'yoastseo/src/worker/AnalysisWorkerWrapper';
import createWorker from 'yoastseo/src/worker/createWorker';
import scoreToRating from 'yoastseo/src/interpreters/scoreToRating';
import { measureTextWidth } from 'yoastseo/src/helpers';

// Shared internal dependencies
import PageParser from '@yoast-seo-for-neos/shared/src/helper/PageParser';
import { groupResultsByRating, parseResults } from '@yoast-seo-for-neos/shared/src/helper/resultParser';

// Internal dependencies
import style from './style.css';
import { actions as yoastActions, selectors as yoastSelectors } from './actions';
import SnippetPreviewButton from './components/SnippetPreviewButton';
import ResultGroup from './components/ResultGroup';

const iconRatingMapping = {
    error: 'circle',
    feedback: 'circle',
    bad: 'frown',
    ok: 'meh',
    good: 'smile',
};

const WORKER_FALLBACK_URL = '/_Resources/Static/Packages/Yoast.YoastSeoForNeos/Assets/webWorker.js';

@connect(
    (state) => ({
        focusedNodeContextPath: selectors.CR.Nodes.focusedNodePathSelector(state),
        getNodeByContextPath: selectors.CR.Nodes.nodeByContextPath(state),
        worker: yoastSelectors.worker(state),
        translations: yoastSelectors.translations(state),
        configuration: yoastSelectors.configuration(state),
        analysis: yoastSelectors.analysis(state),
    }),
    {
        setWorker: yoastActions.setWorker,
        setTranslations: yoastActions.setTranslations,
        setConfiguration: yoastActions.setConfiguration,
        setAnalysis: yoastActions.setAnalysis,
    }
)
@connect(
    state => ({
        contextPath: (((state || {}).ui || {}).contentCanvas || {}).contextPath, // Only works with Neos UI 1.x
        documentNodePath: (((state || {}).cr || {}).nodes || {}).documentNode, // Only works with Neos UI 2+
        canvasSrc: (((state || {}).ui || {}).contentCanvas || {}).src,
    })
)
@neos((globalRegistry) => ({
    i18nRegistry: globalRegistry.get('i18n'),
    serverFeedbackHandlers: globalRegistry.get('serverFeedbackHandlers'),
    contentSelector: globalRegistry.get('frontendConfiguration').get('Yoast.YoastSeoForNeos').contentSelector,
}))
export default class YoastInfoView extends PureComponent {
    static propTypes = {
        worker: PropTypes.object,
        translations: PropTypes.object,
        configuration: PropTypes.object,
        analysis: PropTypes.object,
        canvasSrc: PropTypes.string,
        contextPath: PropTypes.string,
        documentNodePath: PropTypes.string,
        contentSelector: PropTypes.string,
        focusedNodeContextPath: PropTypes.string,
        getNodeByContextPath: PropTypes.func.isRequired,
        setTranslations: PropTypes.func.isRequired,
        setConfiguration: PropTypes.func.isRequired,
        setWorker: PropTypes.func.isRequired,
        setAnalysis: PropTypes.func.isRequired,
        options: PropTypes.shape({
            defaultEditPreviewMode: PropTypes.string,
        }),
    };

    constructor(props) {
        super(props);
        const { documentNodePath, getNodeByContextPath } = this.props;
        const documentNode = getNodeByContextPath(documentNodePath);

        this.state = {
            nodeUri: (documentNode || {}).uri,
            focusKeyword: ((documentNode || {}).properties || {}).focusKeyword || '',
            isCornerstone: ((documentNode || {}).properties || {}).isCornerstone,
            isAnalyzing: false,
            page: this.props.analysis.page || {
                title: '',
                description: '',
                isAnalyzing: false,
                locale: 'en_US',
            },
            i18n: {}
        };
    }

    componentDidMount() {
        this.fetchTranslations();
        this.fetchConfiguration();

        // Check if we can reuse that last analysis that ran if we are on the same page
        const { analysis } = this.props;
        if (!analysis || analysis.analyzedNodePath !== this.props.documentNodePath) {
            this.fetchContent();
        }

        this.onDocumentUpdated = debounce(this.onDocumentUpdated.bind(this), 2000);
        this.props.serverFeedbackHandlers.set(
            'Neos.Neos.Ui:ReloadDocument/DocumentUpdated',
            this.onDocumentUpdated,
            'after Neos.Neos.Ui:ReloadDocument/Main'
        );
        this.props.serverFeedbackHandlers.set(
            'Neos.Neos.Ui:UpdateNodeInfo/YoastSeo',
            this.onDocumentUpdated,
            'after Neos.Neos.Ui:UpdateNodeInfo/Main'
        );
    }

    onDocumentUpdated = () => {
        const { documentNodePath, getNodeByContextPath } = this.props;
        const documentNode = getNodeByContextPath(documentNodePath);
        this.setState(
            {
                nodeUri: (documentNode || {}).uri,
                focusKeyword: ((documentNode || {}).properties || {}).focusKeyword || '',
                isCornerstone: ((documentNode || {}).properties || {}).isCornerstone,
            },
            this.fetchContent
        );
    };

    fetchConfiguration = () => {
        if (this.props.configuration) {
            return;
        }

        fetchWithErrorHandling
            .withCsrfToken((csrfToken) => ({
                url: '/neosyoastseo/data/fetchConfiguration',
                method: 'GET',
                credentials: 'include',
                headers: {
                    'X-Flow-Csrftoken': csrfToken,
                    'Content-Type': 'application/json',
                },
            }))
            .then((response) => response && response.json())
            .then((configuration) => {
                if (configuration && !configuration.error) {
                    this.props.setConfiguration(configuration);
                }
            })
            .catch(() => {
                console.error('[Yoast SEO] Error fetching configuration - applying defaults');
                this.props.setConfiguration({
                    workerUrl: WORKER_FALLBACK_URL,
                });
            });
    }

    /**
     * Fetch new translations from the backend.
     */
    fetchTranslations = () => {
        if (this.props.translations) {
            this.setState({
                i18n: new Jed(this.props.translations),
            });
            return;
        }

        fetchWithErrorHandling
            .withCsrfToken((csrfToken) => ({
                url: '/neosyoastseo/data/fetchTranslations',
                method: 'GET',
                credentials: 'include',
                headers: {
                    'X-Flow-Csrftoken': csrfToken,
                    'Content-Type': 'application/json',
                },
            }))
            .then((response) => response && response.json())
            .then((translations) => {
                if (!translations || translations.error) {
                    translations = {
                        domain: 'js-text-analysis',
                        // eslint-disable-next-line camelcase
                        locale_data: {
                            'js-text-analysis': {
                                '': {},
                            },
                        },
                    };
                }

                this.setState({
                    i18n: new Jed(translations),
                });
                this.props.setTranslations(translations);
            });
    };

    /**
     * Fetch the page preview to extract the content for analysis.
     */
    fetchContent = () => {
        this.setState({
            isAnalyzing: true,
            page: {
                ...this.state.page,
                isAnalyzing: true,
            },
        });

        const { contentSelector, contextPath, documentNodePath } = this.props;

        // Depending on the Neos version only one of these variables is set
        const previewPageNodePath = contextPath || documentNodePath;

        if (previewPageNodePath === undefined) {
            console.error('Error loading page preview, context path is missing', previewPageNodePath, 1548861908);
            this.setState({
                isAnalyzing: false,
                page: {
                    ...this.state.page,
                    isAnalyzing: false,
                },
            });
            return;
        }

        fetchWithErrorHandling
            .withCsrfToken((csrfToken) => ({
                url: `/neosyoastseo/page/renderPreviewPage?node=${encodeURIComponent(previewPageNodePath)}`,
                method: 'GET',
                credentials: 'include',
                headers: {
                    'X-Flow-Csrftoken': csrfToken,
                    'Content-Type': 'text/html',
                },
            }))
            .then((response) => {
                if (!response) {
                    return;
                }
                if (!response.ok) {
                    throw new Error(
                        `Failed fetching preview for Yoast SEO analysis: ${response.status} ${response.statusText}`
                    );
                }
                this.setState({ slug: new URL(response.url).pathname.split('@')[0] });
                return response.text();
            })
            .then((documentContent) => {
                const pageParser = new PageParser(documentContent, contentSelector);

                this.setState(
                    {
                        pageContent: pageParser.pageContent,
                        page: {
                            locale: pageParser.locale,
                            title: pageParser.title,
                            description: pageParser.description,
                            isAnalyzing: false,
                        },
                    },
                    this.refreshAnalysis
                );
            })
            .catch((reason) => fetchWithErrorHandling.generalErrorHandler(reason));
    };

    /**
     * Create and initialize worker and return a promise for it to finish.
     * @returns {Promise}
     */
    initializeWorker = () => {
        let { worker } = this.props;
        if (!worker) {
            worker = new AnalysisWorkerWrapper(createWorker(this.props.configuration.workerUrl));
            this.props.setWorker(worker);
        }
        return worker.initialize({
            useCornerstone: this.state.isCornerstone,
            locale: this.state.page.locale,
            contentAnalysisActive: true,
            keywordAnalysisActive: true,
            logLevel: 'ERROR',
            translations: this.props.translations,
        });
    };

    /**
     * Passes the preview pages content and other attributes to the worker
     * for analysis and updates the state on success.
     */
    refreshAnalysis = () => {
        this.initializeWorker()
            .then(() => {
                const { page, slug, focusKeyword, pageContent } = this.state;
                let paper = new Paper(pageContent, {
                    keyword: focusKeyword,
                    description: page.description,
                    title: page.title,
                    titleWidth: measureTextWidth(page.title),
                    url: slug,
                    locale: page.locale,
                    permalink: '',
                });
                return this.props.worker.analyze(paper);
            })
            .then((results) => {
                this.setState({
                    isAnalyzing: false,
                });
                this.props.setAnalysis({
                    analyzedNodePath: this.props.documentNodePath,
                    page: this.state.page,
                    seo: {
                        ...this.props.analysis.seo,
                        score: results.result.seo[''].score,
                        results: parseResults(results.result.seo[''].results),
                    },
                    readability: {
                        ...this.props.analysis.readability,
                        score: results.result.readability.score,
                        results: parseResults(results.result.readability.results),
                    },
                });
            })
            .catch((error) => {
                console.error(error, 'An error occurred while analyzing the page');
            });
    };

    /**
     * Renders a group of results
     *
     * @param results
     * @param filter
     */
    renderResults = (results, filter = []) => {
        const { i18nRegistry } = this.props;
        let groupedResults = groupResultsByRating(results, filter);

        return (
            <li className={style.yoastInfoView__item}>
                <div className={style.yoastInfoView__title}>
                    {i18nRegistry.translate('inspector.results', 'Analysis results', {}, 'Yoast.YoastSeoForNeos')}
                </div>
                {groupedResults.bad.length > 0 && (
                    <ResultGroup
                        heading={i18nRegistry.translate('inspector.problems', 'Problems', {}, 'Yoast.YoastSeoForNeos')}
                        results={groupedResults.bad}
                    />
                )}
                {groupedResults.ok.length > 0 && (
                    <ResultGroup
                        heading={i18nRegistry.translate(
                            'inspector.improvements',
                            'Improvements',
                            {},
                            'Yoast.YoastSeoForNeos'
                        )}
                        results={groupedResults.ok}
                    />
                )}
                {groupedResults.good.length > 0 && (
                    <ResultGroup
                        heading={i18nRegistry.translate(
                            'inspector.goodResults',
                            'Good results',
                            {},
                            'Yoast.YoastSeoForNeos'
                        )}
                        results={groupedResults.good}
                    />
                )}
            </li>
        );
    };

    handleExpandContentClick = () => {
        this.props.setAnalysis({
            ...this.props.analysis,
            readability: {
                ...this.props.analysis.readability,
                expanded: !this.props.analysis.readability.expanded,
            },
        });
    };

    handleExpandSeoClick = () => {
        this.props.setAnalysis({
            ...this.props.analysis,
            seo: {
                ...this.props.analysis.seo,
                expanded: !this.props.analysis.seo.expanded,
            },
        });
    };

    renderTextElement = (heading, text) => {
        const { i18nRegistry } = this.props;
        return (
            <li className={style.yoastInfoView__item}>
                <strong className={style.yoastInfoView__title}>{heading}</strong>
                <p className={style.yoastInfoView__value}>
                    {text
                        ? text
                        : i18nRegistry.translate('inspector.emptyText', 'Not available', {}, 'Yoast.YoastSeoForNeos')}
                </p>
            </li>
        );
    };

    renderOverallScore = (label, rating) => {
        const ratingStyle = scoreToRating(rating / 10);
        const iconType = iconRatingMapping[ratingStyle];

        return (
            <span className={style.yoastInfoView__score}>
                <Icon icon={iconType} padded={'right'} className={style['yoastInfoView__rating_' + ratingStyle]} />{' '}
                {label}
            </span>
        );
    };

    render() {
        const { i18nRegistry, analysis, options } = this.props;
        const { isAnalyzing, page } = this.state;
        const contentResultsIconState = analysis.readability.expanded ? 'chevron-circle-up' : 'chevron-circle-down';
        const seoResultsIconState = analysis.seo.expanded ? 'chevron-circle-up' : 'chevron-circle-down';

        return (
            <ul className={style.yoastInfoView}>
                <li className={style.yoastInfoView__item}>
                    <SnippetPreviewButton defaultEditPreviewMode={options.defaultEditPreviewMode || 'inPlace'}/>
                </li>

                {!page.isAnalyzing &&
                    this.renderTextElement(
                        i18nRegistry.translate(
                            'inspector.renderedTitle',
                            'Rendered title',
                            {},
                            'Yoast.YoastSeoForNeos'
                        ),
                        page.title
                    )}
                {!page.isAnalyzing &&
                    this.renderTextElement(
                        i18nRegistry.translate(
                            'inspector.renderedDescription',
                            'Rendered description',
                            {},
                            'Yoast.YoastSeoForNeos'
                        ),
                        page.description
                    )}

                {!isAnalyzing && (
                    <li className={style.yoastInfoView__item}>
                        <div className={style.yoastInfoView__heading} onClick={this.handleExpandSeoClick}>
                            {this.renderOverallScore(
                                i18nRegistry.translate(
                                    'inspector.seoScore',
                                    'Focus Keyphrase',
                                    {},
                                    'Yoast.YoastSeoForNeos'
                                ),
                                analysis.seo.score
                            )}
                            <IconButton icon={seoResultsIconState} className={style.rightSideBar__toggleBtn} />
                        </div>
                    </li>
                )}
                {!isAnalyzing && analysis.seo.expanded && this.renderResults(analysis.seo.results)}

                {!isAnalyzing && (
                    <li className={style.yoastInfoView__item}>
                        <div className={style.yoastInfoView__heading} onClick={this.handleExpandContentClick}>
                            {this.renderOverallScore(
                                i18nRegistry.translate(
                                    'inspector.contentScore',
                                    'Readability analysis',
                                    {},
                                    'Yoast.YoastSeoForNeos'
                                ),
                                analysis.readability.score
                            )}
                            <IconButton icon={contentResultsIconState} className={style.rightSideBar__toggleBtn} />
                        </div>
                    </li>
                )}
                {!isAnalyzing && analysis.readability.expanded && this.renderResults(analysis.readability.results)}

                {isAnalyzing && (
                    <li style={{ textAlign: 'center' }}>
                        <Icon spin={true} icon={'spinner'} />
                        &nbsp;{i18nRegistry.translate('inspector.loading', 'Loading…', {}, 'Yoast.YoastSeoForNeos')}
                    </li>
                )}
            </ul>
        );
    }
}
