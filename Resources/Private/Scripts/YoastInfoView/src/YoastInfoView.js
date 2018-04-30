import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {$get} from 'plow-js';
import {Icon} from '@neos-project/react-ui-components';
import {neos} from '@neos-project/neos-ui-decorators';
import {selectors} from '@neos-project/neos-ui-redux-store';
import {ContentAssessor, SEOAssessor, Paper, helpers} from 'yoastseo';
import CornerStoneContentAssessor from 'yoastseo/js/cornerstone/contentAssessor';
import CornerstoneSEOAssessor from 'yoastseo/js/cornerstone/seoAssessor';
import {fetchWithErrorHandling} from '@neos-project/neos-ui-backend-connector';
import {Jed} from "jed";
import style from './style.css';

@connect(state => ({
    focusedNodeContextPath: selectors.CR.Nodes.focusedNodePathSelector(state),
    getNodeByContextPath: selectors.CR.Nodes.nodeByContextPath(state)
}))
@neos(globalRegistry => ({
    i18nRegistry: globalRegistry.get('i18n'),
    serverFeedbackHandlers: globalRegistry.get('serverFeedbackHandlers')
}))
export default class YoastInfoView extends PureComponent {
    static propTypes = {
        focusedNodeContextPath: PropTypes.string,
        getNodeByContextPath: PropTypes.func.isRequired
    }

    constructor(props) {
        super(props);
        const {focusedNodeContextPath, getNodeByContextPath, i18nRegistry} = this.props;
        const node = getNodeByContextPath(focusedNodeContextPath);

        this.state = {
            nodeUri: $get('uri', node),
            previewUri: $get('previewUri', node),
            focusKeyword: $get('properties.focusKeyword', node),
            isCornerstone: $get('properties.isCornerstone', node),
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
            }
        };
    }

    componentDidMount() {
        this.fetchContent();
        this.props.serverFeedbackHandlers.set('Neos.Neos.Ui:ReloadDocument/DocumentUpdated', (feedbackPayload, {store}) => {
            this.fetchContent();
        }, 'after Neos.Neos.Ui:ReloadDocument/Main');
    }

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
            url: `${this.state.nodeUri}?shelYoastSeoPreviewMode=true`,
            method: 'GET',
            credentials: 'include',
            headers: {
                'X-Flow-Csrftoken': csrfToken,
                'Content-Type': 'text/html'
            }
        }))
            .then(response => response && response.text())
            .then(previewDocument => {
                const parser = new DOMParser();
                const parsedPreviewDocument = parser.parseFromString(previewDocument, "text/html");

                const metaSection = parsedPreviewDocument.querySelector('head');

                // Remove problematic tags for the Yoast plugin from preview document
                let scriptTags = parsedPreviewDocument.querySelectorAll('script,svg');
                scriptTags.forEach((scriptTag) => {
                    scriptTag.remove();
                });

                let pageContent = parsedPreviewDocument.querySelector('body').innerHTML;
                let locale = (parsedPreviewDocument.querySelector('html').getAttribute('lang') || 'en_US').replace('-', '_');

                // Remove problematic data attributes for the Yoast plugin from preview document
                const re = /data-.*?=".*?"/gim;
                pageContent = pageContent.replace(re, '');

                this.setState({
                    pageContent: pageContent,
                    page: {
                        locale: locale,
                        title: metaSection.querySelector('title') ? metaSection.querySelector('title').textContent : '',
                        description: metaSection.querySelector('meta[name="description"]') ? metaSection.querySelector('meta[name="description"]').getAttribute('content') : '',
                        isAnalyzing: false
                    }
                }, this.refreshAnalysis);
            });
    }

    refreshAnalysis = () => {
        // TODO: fetch translations from i18n
        let defaultTranslations = {
            domain: "js-text-analysis",
            // eslint-disable-next-line camelcase
            locale_data: {
                "js-text-analysis": {
                    "": {}
                }
            }
        };
        let i18n = new Jed(defaultTranslations);

        let paper = new Paper(
            this.state.pageContent,
            {
                keyword: this.state.focusKeyword,
                description: this.state.page.description,
                title: this.state.page.title,
                titleWidth: this.state.page.title.length,
                url: this.state.previewUri,
                locale: this.state.page.locale,
                permalink: ""
            }
        );

        this.refreshContentAnalysis(paper, i18n);
        this.refreshSeoAnalysis(paper, i18n);
    }

    refreshSeoAnalysis = (paper, i18n) => {
        let seoAssessor;
        if (this.state.isCornerstone) {
            seoAssessor = new CornerstoneSEOAssessor(i18n, {locale: this.state.page.locale});
        } else {
            seoAssessor = new SEOAssessor(i18n, {locale: this.state.page.locale});
        }
        seoAssessor.assess(paper);

        this.setState({
            seo: {
                score: seoAssessor.calculateOverallScore(),
                results: seoAssessor.getValidResults().map(result => {
                    return {
                        score: result.score,
                        text: result.text,
                        identifier: result._identifier
                    }
                }),
                isAnalyzing: false
            }
        });
    }

    refreshContentAnalysis = (paper, i18n) => {
        let contentAssessor;
        if (this.state.isCornerstone) {
            contentAssessor = new CornerStoneContentAssessor(i18n, {locale: this.state.page.locale});
        } else {
            contentAssessor = new ContentAssessor(i18n, {locale: this.state.page.locale});
        }
        contentAssessor.assess(paper);

        this.setState({
            content: {
                score: contentAssessor.calculateOverallScore(),
                results: contentAssessor.getValidResults().map(result => {
                    return {
                        score: result.score,
                        text: result.text,
                        identifier: result._identifier
                    }
                }),
                isAnalyzing: false
            }
        });
    }

    renderResults = (results) => {
        return results.map(result => {
            let rating = helpers.scoreToRating(result.score);

            return (
                <li className={style.yoastInfoView__item}>
                    <div className={style.yoastInfoView__title}>
                        <span className={style['yoastInfoView__rating_' + rating]}>{result.identifier}</span>
                    </div>
                    <div className={style.yoastInfoView__content}
                         dangerouslySetInnerHTML={{__html: result.text}} />
                </li>
            )
        })
    }

    render() {
        return (
            <ul className={style.yoastInfoView}>
                {!this.state.page.isAnalyzing && (
                    <li className={style.yoastInfoView__item}>
                        <div className={style.yoastInfoView__title}>Title</div>
                        <div className={style.yoastInfoView__content}>{this.state.page.title}</div>
                    </li>
                )}
                {!this.state.page.isAnalyzing && (
                    <li className={style.yoastInfoView__item}>
                        <div className={style.yoastInfoView__title}>Description</div>
                        <div className={style.yoastInfoView__content}>{this.state.page.description}</div>
                    </li>
                )}

                {!this.state.content.isAnalyzing && (
                    <li className={style.yoastInfoView__item}>
                        <div className={style.yoastInfoView__title}>Content score</div>
                        <div className={style.yoastInfoView__content}>{this.state.content.score}</div>
                    </li>
                )}
                {!this.state.seo.isAnalyzing && (
                    <li className={style.yoastInfoView__item}>
                        <div className={style.yoastInfoView__title}>SEO score</div>
                        <div className={style.yoastInfoView__content}>{this.state.seo.score}</div>
                    </li>
                )}

                {!this.state.content.isAnalyzing && this.renderResults(this.state.content.results)}
                {!this.state.seo.isAnalyzing && this.renderResults(this.state.seo.results)}

                {(this.state.page.isAnalyzing || this.state.content.isAnalyzing || this.state.seo.isAnalyzing) && (
                    <li className={style.yoastInfoView__item} style={{textAlign: 'center'}}>
                        <Icon
                            spin={true}
                            icon={'spinner'}
                        />
                        &nbsp;{'Loading...'}
                    </li>
                )}
            </ul>
        );
    }
}
