import React, {PureComponent} from 'react';
import {IntlProvider} from "react-intl";
import PropTypes from "prop-types";
import {ThemeProvider} from "styled-components";
import debounce from "lodash.debounce";

import ContentAnalysisWrapper from "./ContentAnalysisWrapper";
import PageParser from "../helper/PageParser";

import {Loader, SnippetEditor} from "yoast-components";
import {MODES} from "yoast-components/composites/Plugin/SnippetPreview/constants";

import {AnalysisWorkerWrapper, createWorker} from "yoastseo";
import Paper from "yoastseo/src/values/Paper";

export default class NeosSnippetEditor extends PureComponent {
    static propTypes = {
        documentContent: PropTypes.string.isRequired,
        contentSelector: PropTypes.string.isRequired,
        editorFieldMapping: PropTypes.shape({
            title: PropTypes.string.isRequired,
            titleOverride: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            slug: PropTypes.string.isRequired,
        }).isRequired,
        title: PropTypes.string.isRequired,
        titleOverride: PropTypes.string,
        description: PropTypes.string,
        focusKeyword: PropTypes.string,
        isCornerstone: PropTypes.bool,
        isAmp: PropTypes.bool,
        uiLocale: PropTypes.string.isRequired,
        uriPathSegment: PropTypes.string.isRequired,
        translationsUrl: PropTypes.string.isRequired,
        workerUrl: PropTypes.string.isRequired,
        previewUrl: PropTypes.string.isRequired,
        baseUrl: PropTypes.string.isRequired,
        pageUrl: PropTypes.string.isRequired,
        breadcrumbs: PropTypes.array,
    };

    constructor(props) {
        super(props);

        const pageParser = new PageParser(props.documentContent, props.contentSelector);
        const activeTitleField = this.props.titleOverride ? 'titleOverride' : 'title';

        this.state = {
            worker: null,
            pageParser: pageParser,
            mode: MODES.MODE_DESKTOP,
            activeTitleField: activeTitleField,
            titleTemplate: NeosSnippetEditor.buildTitleTemplate(this.props[activeTitleField], pageParser.title),
            editorData: {
                title: this.props[activeTitleField],
                description: this.props.description || '',
                slug: this.props.uriPathSegment,
                url: this.props.pageUrl,
            },
        };

        this.onSnippetEditorChange = debounce(this.onSnippetEditorChange.bind(this), 300);
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
     * Update hidden Neos fields from the changed values of the editor fields.
     * Or in case of `mode` switch the preview template.
     *
     * @param key
     * @param data
     */
    onSnippetEditorChange = (key, data) => {
        console.debug(data, 'Changing ' + key + ' in editor');

        if (this.props.editorFieldMapping[key]) {
            this.setState({
                editorData: {...this.state.editorData, [key]: data}
            });

            if (key === 'title') {
                key = this.state.activeTitleField;
            }
            this.props.editorFieldMapping[key].querySelector('.neos-inline-editable > *').innerHTML = data;

        } else if (key === 'mode') {
            this.setState({mode: data});
        }
    };

    /**
     * Process field values before giving them to the preview.
     * We modify the title in the preview according to the template we generated in the constructor.
     *
     * @param mappedData
     * @param context
     */
    mapEditorDataToPreview = (mappedData, context) => {
        console.debug(mappedData, 'Mapped data');
        console.debug(this.state.titleTemplate, 'Title template');
        return {
            title: this.state.titleTemplate.replace('{title}', mappedData.title),
            url: mappedData.url,
            description: mappedData.description,
        };
    };

    /**
     * Callback for the analysis to retrieve new data
     */
    refreshAnalysisCallback = () => {
        let worker = this.state.worker;
        if (!worker) {
            worker = new AnalysisWorkerWrapper(createWorker(this.props.workerUrl));
            this.setState({worker: worker});
        }
        return worker.initialize({
            useCornerstone: this.props.isCornerstone,
            locale: this.state.pageParser.locale,
            contentAnalysisActive: true,
            keywordAnalysisActive: true,
            logLevel: "ERROR"
        }).then(() => {
            const paper = new Paper(
                this.state.pageParser.pageContent,
                {
                    keyword: this.props.focusKeyword || '',
                    description: this.state.pageParser.description || '',
                    title: this.state.pageParser.title,
                    titleWidth: 100, // TODO: Retrieve via helper
                    url: new URL(this.props.pageUrl).pathname,
                    locale: this.state.pageParser.locale,
                    permalink: ""
                }
            );
            return worker.analyze(paper);
        });
    };

    render() {
        const editorProps = {
            data: this.state.editorData,
            baseUrl: this.props.baseUrl,
            locale: this.props.uiLocale,
            keyword: this.props.focusKeyword,
            breadcrumbs: this.props.breadcrumbs,
            isAmp: this.props.isAmp,
            hasPaperStyle: false,
            onChange: this.onSnippetEditorChange,
            mapEditorDataToPreview: this.mapEditorDataToPreview,
        };

        return (
            <IntlProvider locale={this.props.locale}>
                <ThemeProvider theme={{isRtl: false}}>
                    <div>
                        <Loader className=""/>
                        <div className="yoast-seo__snippet-editor-wrapper">
                            <SnippetEditor {...editorProps} mode={this.state.mode}/>
                        </div>
                        <ContentAnalysisWrapper refreshAnalysisCallback={this.refreshAnalysisCallback}/>
                    </div>
                </ThemeProvider>
            </IntlProvider>
        )
    }
}
