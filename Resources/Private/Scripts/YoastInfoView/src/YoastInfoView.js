import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {$transform, $get} from 'plow-js';
import {Icon, IconButton} from '@neos-project/react-ui-components';
import {neos} from '@neos-project/neos-ui-decorators';
import {actions, selectors} from '@neos-project/neos-ui-redux-store';
import {fetchWithErrorHandling} from '@neos-project/neos-ui-backend-connector';
import Paper from 'yoastseo/src/values/Paper';
import AnalysisWorkerWrapper from 'yoastseo/src/worker/AnalysisWorkerWrapper';
import createWorker from 'yoastseo/src/worker/createWorker';
import scoreToRating from 'yoastseo/src/interpreters/scoreToRating';
import Jed from "jed";
import style from './style.css';
import PageParser from "./helper/PageParser";
import {yoastActions} from './actions';
import SnippetPreviewButton from "./components/SnippetPreviewButton";
import ResultGroup from "./components/ResultGroup";
import {groupResultsByRating, parseResults} from "./helper/resultParser";

const iconRatingMapping = {
    error: 'circle',
    feedback: 'circle',
    bad: 'frown',
    ok: 'meh',
    good: 'smile'
};

@connect(state => ({
    focusedNodeContextPath: selectors.CR.Nodes.focusedNodePathSelector(state),
    getNodeByContextPath: selectors.CR.Nodes.nodeByContextPath(state),
    worker: $get('ui.yoastInfoView.worker', state),
    translations: $get('ui.yoastInfoView.translations', state),
}), {
    setWorker: yoastActions.setWorker,
    setTranslations: yoastActions.setTranslations,
})
@connect($transform({
    contextPath: $get('ui.contentCanvas.contextPath'), // Only works with Neos UI 1.x
    documentNodePath: $get('cr.nodes.documentNode'), // Only works with Neos UI 3.x
    canvasSrc: $get('ui.contentCanvas.src'),
}))
@neos(globalRegistry => ({
    i18nRegistry: globalRegistry.get('i18n'),
    serverFeedbackHandlers: globalRegistry.get('serverFeedbackHandlers'),
    contentSelector: globalRegistry.get('frontendConfiguration').get('Shel.Neos.YoastSeo').contentSelector,
}))
export default class YoastInfoView extends PureComponent {
    static propTypes = {
        translations: PropTypes.array,
        canvasSrc: PropTypes.string,
        contextPath: PropTypes.string,
        documentNodePath: PropTypes.string,
        contentSelector: PropTypes.string,
        focusedNodeContextPath: PropTypes.string,
        getNodeByContextPath: PropTypes.func.isRequired,
        setTranslations: PropTypes.func.isRequired,
        setWorker: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        const {documentNodePath, getNodeByContextPath} = this.props;
        const node = getNodeByContextPath(documentNodePath);

        this.state = {
            nodeUri: $get('uri', node),
            focusKeyword: $get('properties.focusKeyword', node),
            isCornerstone: $get('properties.isCornerstone', node),
            workerUrl: '/_Resources/Static/Packages/Shel.Neos.YoastSeo/Assets/webWorker.js', // TODO: Resolve path via Neos api
            isAnalyzing: false,
            page: {
                title: '',
                description: '',
                isAnalyzing: false,
                locale: 'en_US'
            },
            content: {
                score: 0,
                results: [],
                expanded: false
            },
            seo: {
                score: 0,
                results: [],
                expanded: false
            },
            i18n: {}
        };
    }

    componentDidMount() {
        this.fetchTranslations();
        this.fetchContent();
        this.props.serverFeedbackHandlers.set('Neos.Neos.Ui:ReloadDocument/DocumentUpdated', () => {
            this.fetchContent();
        }, 'after Neos.Neos.Ui:ReloadDocument/Main');
    }

    fetchTranslations = () => {
        if (this.props.translations) {
            this.setState({
                i18n: new Jed(this.props.translations)
            });
            return;
        }

        fetchWithErrorHandling.withCsrfToken(csrfToken => ({
            url: '/neosyoastseo/data/fetchTranslations',
            method: 'GET',
            credentials: 'include',
            headers: {
                'X-Flow-Csrftoken': csrfToken,
                'Content-Type': 'application/json'
            }
        }))
            .then(response => response && response.json())
            .then(translations => {
                if (!translations || translations.error) {
                    translations = {
                        domain: "js-text-analysis",
                        // eslint-disable-next-line camelcase
                        locale_data: {
                            "js-text-analysis": {
                                "": {}
                            }
                        }
                    };
                }

                this.setState({
                    i18n: new Jed(translations)
                });
                this.props.setTranslations(translations);
            });
    };

    fetchContent = () => {
        this.setState({
            isAnalyzing: true,
            page: {
                ...this.state.page,
                isAnalyzing: true
            }
        });

        const {contentSelector, contextPath, documentNodePath} = this.props;

        // Depending on the Neos version only one of these variables is set
        const previewPageNodePath = contextPath || documentNodePath;


        if (previewPageNodePath === undefined) {
            console.error('Error loading page preview, context path is missing', previewPageNodePath, 1548861908);
            this.setState({
                isAnalyzing: false,
                page: {
                    ...this.state.page,
                    isAnalyzing: false
                }
            });
            return;
        }

        fetchWithErrorHandling.withCsrfToken(csrfToken => ({
            url: `/neosyoastseo/page/renderPreviewPage?node=${previewPageNodePath}`,
            method: 'GET',
            credentials: 'include',
            headers: {
                'X-Flow-Csrftoken': csrfToken,
                'Content-Type': 'text/html'
            }
        }))
            .then(response => {
                if (!response) {
                    return;
                }
                this.setState({slug: new URL(response.url).pathname.split('@')[0]});
                return response.text();
            })
            .then(documentContent => {
                const pageParser = new PageParser(documentContent, contentSelector);

                this.setState({
                    pageContent: pageParser.pageContent,
                    page: {
                        locale: pageParser.locale,
                        title: pageParser.title,
                        description: pageParser.description,
                        isAnalyzing: false
                    },
                    results: {}
                }, this.refreshAnalysis);
            });
    };

    refreshAnalysis = () => {
        let {worker} = this.props;
        if (!worker) {
            worker = new AnalysisWorkerWrapper(createWorker(this.state.workerUrl));
            this.props.setWorker(worker);
        }
        // TODO: Initialize the worker only when the configuration actually has changed
        worker.initialize({
            useCornerstone: this.state.isCornerstone,
            locale: this.state.page.locale,
            contentAnalysisActive: true,
            keywordAnalysisActive: true,
            logLevel: 'ERROR',
            translations: this.props.translations,
        }).then(() => {
            let paper = new Paper(
                this.state.pageContent,
                {
                    keyword: this.state.focusKeyword,
                    description: this.state.page.description,
                    title: this.state.page.title,
                    titleWidth: this.getTitleWidth(),
                    url: this.state.slug,
                    locale: this.state.page.locale,
                    permalink: ""
                }
            );
            this.setState({worker: worker});
            return worker.analyze(paper);
        }).then((results) => {
            this.setState({
                isAnalyzing: false,
                seo: {
                    score: results.result.seo[''].score,
                    results: parseResults(results.result.seo[''].results),
                },
                content: {
                    score: results.result.readability.score,
                    results: parseResults(results.result.readability.results),
                }
            });
        }).catch((error) => {
            console.error(error, 'An error occurred while analyzing the page');
        });
    };

    getTitleWidth = () => {
        // TODO: This is just a basic approximation and should be calculated in the future based on the actual text.
        return this.state.page.title.length * 8.5;
    };

    renderResults = (results, filter = []) => {
        let groupedResults = groupResultsByRating(results, filter);

        return (
            <li className={style.yoastInfoView__item}>
                <div className={style.yoastInfoView__title}>
                    {this.props.i18nRegistry.translate('inspector.results', 'Analysis results', {}, 'Shel.Neos.YoastSeo')}
                </div>
                {groupedResults.bad.length > 0 && (
                    <ResultGroup heading={this.props.i18nRegistry.translate('inspector.problems', 'Problems', {}, 'Shel.Neos.YoastSeo')} results={groupedResults.bad}/>
                )}
                {groupedResults.ok.length > 0 && (
                    <ResultGroup heading={this.props.i18nRegistry.translate('inspector.improvements', 'Improvements', {}, 'Shel.Neos.YoastSeo')} results={groupedResults.ok}/>
                )}
                {groupedResults.good.length > 0 && (
                    <ResultGroup heading={this.props.i18nRegistry.translate('inspector.goodResults', 'Good results', {}, 'Shel.Neos.YoastSeo')} results={groupedResults.good}/>
                )}
            </li>
        );
    };

    handleExpandContentClick = () => {
        this.setState({
            content: {
                ...this.state.content,
                expanded: !this.state.content.expanded
            }
        });
    };

    handleExpandSeoClick = () => {
        this.setState({
            seo: {
                ...this.state.seo,
                expanded: !this.state.seo.expanded
            }
        });
    };

    renderTextElement = (heading, text) => {
        return (
            <li className={style.yoastInfoView__item}>
                <strong className={style.yoastInfoView__title}>{heading}</strong>
                <p className={style.yoastInfoView__value}>{text}</p>
            </li>
        );
    };

    renderOverallScore = (label, rating) => {
        const ratingStyle = scoreToRating(rating / 10);
        const iconType = iconRatingMapping[ratingStyle];

        return (
            <span className={style.yoastInfoView__score}>
                <Icon icon={iconType} padded={'right'}
                      className={style['yoastInfoView__rating_' + ratingStyle]}/> {label}
            </span>
        );
    };

    render() {
        const {i18nRegistry} = this.props;
        const contentResultsIconState = this.state.content.expanded ? 'chevron-circle-up' : 'chevron-circle-down';
        const seoResultsIconState = this.state.seo.expanded ? 'chevron-circle-up' : 'chevron-circle-down';

        return (
            <ul className={style.yoastInfoView}>
                <li className={style.yoastInfoView__item}>
                    <SnippetPreviewButton/>
                </li>

                {!this.state.page.isAnalyzing && this.renderTextElement(this.props.i18nRegistry.translate('inspector.renderedTitle', 'Rendered title', {}, 'Shel.Neos.YoastSeo'), this.state.page.title)}
                {!this.state.page.isAnalyzing && this.renderTextElement(this.props.i18nRegistry.translate('inspector.renderedDescription', 'Rendered description', {}, 'Shel.Neos.YoastSeo'), this.state.page.description)}


                {!this.state.isAnalyzing && (
                    <li className={style.yoastInfoView__item}>
                        <div className={style.yoastInfoView__heading}>
                            {this.renderOverallScore(i18nRegistry.translate('inspector.seoScore', 'Focus Keyphrase', {}, 'Shel.Neos.YoastSeo'), this.state.seo.score)}
                            <IconButton icon={seoResultsIconState} className={style.rightSideBar__toggleBtn}
                                        onClick={this.handleExpandSeoClick}/>
                        </div>
                    </li>
                )}
                {!this.state.isAnalyzing && this.state.seo.expanded && this.renderResults(this.state.seo.results)}

                {!this.state.isAnalyzing && (
                    <li className={style.yoastInfoView__item}>
                        <div className={style.yoastInfoView__heading}>
                            {this.renderOverallScore(i18nRegistry.translate('inspector.contentScore', 'Readability analysis', {}, 'Shel.Neos.YoastSeo'), this.state.content.score)}
                            <IconButton icon={contentResultsIconState} className={style.rightSideBar__toggleBtn}
                                        onClick={this.handleExpandContentClick}/>
                        </div>
                    </li>
                )}
                {!this.state.isAnalyzing && this.state.content.expanded && this.renderResults(this.state.content.results)}


                {(this.state.isAnalyzing) && (
                    <li style={{textAlign: 'center'}}>
                        <Icon spin={true} icon={'spinner'}/>
                        &nbsp;{i18nRegistry.translate('inspector.loading', 'Loading…', {}, 'Shel.Neos.YoastSeo')}
                    </li>
                )}
            </ul>
        );
    }
}
