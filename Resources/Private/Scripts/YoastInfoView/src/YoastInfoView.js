import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {$transform, $get} from 'plow-js';
import {Icon, Button} from '@neos-project/react-ui-components';
import {neos} from '@neos-project/neos-ui-decorators';
import {selectors} from '@neos-project/neos-ui-redux-store';
import {fetchWithErrorHandling} from '@neos-project/neos-ui-backend-connector';
import {Paper, ContentAssessor} from 'yoastseo';
import SEOAssessor from 'yoastseo/src/seoAssessor';
import {scoreToRating} from 'yoastseo/src/interpreters';
import CornerStoneContentAssessor from 'yoastseo/src/cornerstone/contentAssessor';
import CornerstoneSEOAssessor from 'yoastseo/src/cornerstone/seoAssessor';
import Jed from "jed";
import style from './style.css';
import PageParser from "./helper/pageParser";
import {actions} from './actions';

@connect(state => ({
    focusedNodeContextPath: selectors.CR.Nodes.focusedNodePathSelector(state),
    getNodeByContextPath: selectors.CR.Nodes.nodeByContextPath(state)
}))
@connect($transform({
    contextPath: $get('ui.contentCanvas.contextPath'),
    canvasSrc: $get('ui.contentCanvas.src')
}))
@connect(state => ({
        translations: $get('ui.yoastInfoView.translations', state)
    })
    , {
        setTranslations: actions.setTranslations
    }
)
@neos(globalRegistry => ({
    i18nRegistry: globalRegistry.get('i18n'),
    serverFeedbackHandlers: globalRegistry.get('serverFeedbackHandlers')
}))
export default class YoastInfoView extends PureComponent {
    static propTypes = {
        translations: PropTypes.array,
        canvasSrc: PropTypes.string,
        contextPath: PropTypes.string,
        focusedNodeContextPath: PropTypes.string,
        getNodeByContextPath: PropTypes.func.isRequired,
        setTranslations: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        const {focusedNodeContextPath, getNodeByContextPath} = this.props;
        const node = getNodeByContextPath(focusedNodeContextPath);

        this.state = {
            nodeUri: $get('uri', node),
            focusKeyword: $get('properties.focusKeyword', node),
            isCornerstone: $get('properties.isCornerstone', node),
            expandGoodResults: false,
            page: {
                title: '',
                description: '',
                isAnalyzing: false
            },
            content: {
                score: 0,
                results: [],
                isAnalyzing: false
            },
            seo: {
                score: 0,
                results: [],
                isAnalyzing: false
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
            page: {
                ...this.state.page,
                isAnalyzing: true
            },
            seo: {
                ...this.state.seo,
                isAnalyzing: true
            },
            content: {
                ...this.state.content,
                isAnalyzing: true
            }
        });

        fetchWithErrorHandling.withCsrfToken(csrfToken => ({
            url: `/neosyoastseo/page/renderPreviewPage?node=${this.props.contextPath}`,
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
                const pageParser = new PageParser(documentContent);

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

        this.refreshContentAnalysis(paper);
        this.refreshSeoAnalysis(paper);
    };

    getTitleWidth = () => {
        // TODO: This is just a basic approximation and should be calculated in the future based on the actual text.
        return this.state.page.title.length * 8.5;
    };

    parseResults = (results) => {
        return results.reduce((obj, result) => {
            obj[result._identifier] = {
                identifier: result._identifier,
                rating: scoreToRating(result.score),
                score: result.score,
                text: result.text
            };
            return obj;
        }, {});
    };

    refreshSeoAnalysis = (paper) => {
        let seoAssessor;
        if (this.state.isCornerstone) {
            seoAssessor = new CornerstoneSEOAssessor(this.state.i18n, {locale: this.state.page.locale});
        } else {
            seoAssessor = new SEOAssessor(this.state.i18n, {locale: this.state.page.locale});
        }
        seoAssessor.assess(paper);

        this.setState({
            seo: {
                results: this.parseResults(seoAssessor.getValidResults()),
                isAnalyzing: false
            }
        });
    };

    refreshContentAnalysis = (paper) => {
        let contentAssessor;
        if (this.state.isCornerstone) {
            contentAssessor = new CornerStoneContentAssessor(this.state.i18n, {locale: this.state.page.locale});
        } else {
            contentAssessor = new ContentAssessor(this.state.i18n, {locale: this.state.page.locale});
        }
        contentAssessor.assess(paper);

        this.setState({
            content: {
                results: this.parseResults(contentAssessor.getValidResults()),
                isAnalyzing: false
            }
        });
    };

    renderResults = (filter) => {
        let groupedResults = {
            'bad': [],
            'ok': [],
            'good': []
        };

        let allResults = Object.assign({}, this.state.content.results, this.state.seo.results);

        Object.values(allResults).forEach(result => {
            if (filter.indexOf(result.identifier) === -1) {
                if (result.rating in groupedResults) {
                    groupedResults[result.rating].push(result);
                } else {
                    console.log(result.text);
                }
            }
        });

        return (
            <li className={style.yoastInfoView__item}>
                <div className={style.yoastInfoView__title}>
                    {this.props.i18nRegistry.translate('inspector.results', 'Results', {}, 'Shel.Neos.YoastSeo')}
                </div>
                {groupedResults.bad.map(result => this.renderRating(result))}
                {groupedResults.ok.map(result => this.renderRating(result))}
                {this.state.expandGoodResults && groupedResults.good.map(result => this.renderRating(result))}
            </li>
        );
    };

    handleExpandClick = () => {
        this.setState({expandGoodResults: true});
    };

    renderRating = (result) => {
        return result && (
            <p className={style.yoastInfoView__content}
               title={this.props.i18nRegistry.translate('inspector.resultType.' + result.identifier, result.identifier, {}, 'Shel.Neos.YoastSeo')}>
                <svg height="13" width="6" className={style['yoastInfoView__rating_' + result.rating]}>
                    <circle cx="3" cy="9" r="3"/>
                </svg>
                <span dangerouslySetInnerHTML={{__html: result.text}}/>
            </p>
        );
    };

    renderTitleRating = () => {
        return (
            <li className={style.yoastInfoView__item}>
                <div className={style.yoastInfoView__title}>
                    {this.props.i18nRegistry.translate('inspector.title', 'Title', {}, 'Shel.Neos.YoastSeo')}
                </div>
                <div className={style.yoastInfoView__value}>{this.state.page.title}</div>
                {this.renderRating(this.state.seo.results.titleWidth)}
                {this.renderRating(this.state.seo.results.titleKeyword)}
            </li>
        );
    };

    renderDescriptionRating = () => {
        return (
            <li className={style.yoastInfoView__item}>
                <div className={style.yoastInfoView__title}>
                    {this.props.i18nRegistry.translate('inspector.description', 'Description', {}, 'Shel.Neos.YoastSeo')}
                </div>
                <div className={style.yoastInfoView__value}>{this.state.page.description}</div>
                {this.renderRating(this.state.seo.results.metaDescriptionKeyword)}
                {this.renderRating(this.state.seo.results.metaDescriptionLength)}
            </li>
        );
    };

    render() {
        let filterFromAllResults = ['titleWidth', 'titleKeyword', 'metaDescriptionKeyword', 'metaDescriptionLength'];

        return (
            <ul className={style.yoastInfoView}>
                {!this.state.seo.isAnalyzing && this.renderTitleRating()}
                {!this.state.seo.isAnalyzing && this.renderDescriptionRating()}
                {!this.state.content.isAnalyzing && !this.state.seo.isAnalyzing && this.renderResults(filterFromAllResults)}

                {(this.state.page.isAnalyzing || this.state.content.isAnalyzing || this.state.seo.isAnalyzing) && (
                    <li className={style.yoastInfoView__item} style={{textAlign: 'center'}}>
                        <Icon spin={true} icon={'spinner'}/>
                        &nbsp;{this.props.i18nRegistry.translate('inspector.loading', 'Loading…', {}, 'Shel.Neos.YoastSeo')}
                    </li>
                )}

                {!this.state.page.isAnalyzing && !this.state.expandGoodResults && (
                    <li className={style.yoastInfoView__item} style={{textAlign: 'center'}}>
                        <Button style="clean" hoverStyle="clean" onClick={this.handleExpandClick}>
                            <span>
                                <Icon icon={'plus'}/>
                                &nbsp;{this.props.i18nRegistry.translate('inspector.showAllResults', 'Show all results', {}, 'Shel.Neos.YoastSeo')}
                            </span>
                        </Button>
                    </li>
                )}
            </ul>
        );
    }
}
