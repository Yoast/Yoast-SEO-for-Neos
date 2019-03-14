import React, {PureComponent} from "react";
import PropTypes from "prop-types";
import {ThemeProvider} from "styled-components";
import debounce from "lodash.debounce";

import ContentAnalysisWrapper from "./ContentAnalysisWrapper";
import PageParser from "../helper/PageParser";

import Loader from "yoast-components/composites/basic/Loader";
import SnippetEditor from "yoast-components/composites/Plugin/SnippetEditor/components/SnippetEditor";
import {MODES} from "yoast-components/composites/Plugin/SnippetPreview/constants";

import AnalysisWorkerWrapper from 'yoastseo/src/worker/AnalysisWorkerWrapper';
import createWorker from 'yoastseo/src/worker/createWorker';
import Paper from "yoastseo/src/values/Paper";

export default class NeosYoastApp extends PureComponent {
    static propTypes = {
        documentContent: PropTypes.string.isRequired,
        contentSelector: PropTypes.string.isRequired,
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
            titleTemplate: NeosYoastApp.buildTitleTemplate(this.props[activeTitleField], pageParser.title),
            editorData: {
                title: this.props[activeTitleField],
                description: this.props.description || '',
                slug: this.props.uriPathSegment,
                url: this.props.pageUrl,
            },
        };

        this.updateNeosFields = debounce(this.updateNeosFields.bind(this), 300);
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
    };

    /**
     * Process field values before giving them to the preview.
     * We modify the title in the preview according to the template we generated in the constructor.
     *
     * @param mappedData
     * @param context
     */
    mapEditorDataToPreview = (mappedData, context) => {
        return {
            title: this.state.titleTemplate.replace('{title}', mappedData.title),
            url: this.props.isHomepage ? this.props.baseUrl : mappedData.url,
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
            logLevel: "ERROR",
            translations: this.props.translations,
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
            <ThemeProvider theme={{isRtl: false}}>
                <div>
                    <Loader className=""/>
                    <div className="yoast-seo__snippet-editor-wrapper">
                        <SnippetEditor {...editorProps} mode={this.state.mode}/>
                    </div>
                    <ContentAnalysisWrapper modalContainer={this.props.modalContainer}
                                            refreshAnalysisCallback={this.refreshAnalysisCallback}/>
                </div>
            </ThemeProvider>
        )
    }
}
