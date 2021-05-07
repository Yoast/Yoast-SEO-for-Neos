import React, { useCallback, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { __ } from '@wordpress/i18n';

// Yoast dependencies
import KeywordInput from 'yoast-components/composites/Plugin/Shared/components/KeywordInput';
import SnippetEditor from '@yoast/search-metadata-previews/snippet-editor/SnippetEditor';
import { MODE_DESKTOP } from '@yoast/search-metadata-previews/snippet-preview/constants';

// Internal dependencies
import SeoAnalysis from './SeoAnalysis';
import { useConfiguration } from '../provider/ConfigurationProvider';
import useNeosFields from '../hooks/useNeosFields';
import titleTemplateState from '../state/titleTemplateState';
import faviconSrcState from '../state/faviconSrcState';
import editorState from '../state/editorState';

const SeoTab = () => {
    const { configuration } = useConfiguration();
    const titleTemplate = useRecoilValue(titleTemplateState);
    const faviconSrc = useRecoilValue(faviconSrcState);
    const editorData = useRecoilValue(editorState);
    const { updateEditorData } = useNeosFields();
    const [mode, setMode] = useState(MODE_DESKTOP);

    const onUpdateKeyword = useCallback(
        (value = '') => {
            updateEditorData('focusKeyword', value);
        },
        [updateEditorData]
    );

    const onEditorChange = useCallback(
        (key, data) => {
            if (key === 'mode') {
                setMode(data);
            } else {
                updateEditorData(key, data);
            }
        },
        [updateEditorData]
    );

    /**
     * Process field values before giving them to the preview.
     * We modify the title in the preview according to the template we generated in the constructor.
     */
    const mapEditorDataToPreview = useCallback(
        ({ title, description, url }) => {
            return {
                title: titleTemplate.replace('{title}', title),
                url: configuration.isHomepage ? configuration.baseUrl : url,
                description: description,
            };
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [titleTemplate]
    );

    return (
        <React.Fragment>
            <div className="yoast-seo-keyphrase-editor-wrapper">
                <KeywordInput
                    id="focus-keyphrase"
                    keyword={editorData.focusKeyword}
                    onChange={onUpdateKeyword}
                    onRemoveKeyword={onUpdateKeyword}
                    label={__('Focus keyphrase', 'yoast-components')}
                    ariaLabel={__('Focus keyphrase', 'yoast-components')}
                />
            </div>
            <div className="yoast-seo-snippet-editor-wrapper">
                <SnippetEditor
                    isAmp={configuration.isAmp}
                    // Provide the initial state
                    data={{
                        title: editorData.title,
                        description: editorData.description,
                        slug: editorData.slug,
                    }}
                    locale={configuration.uiLocale}
                    breadcrumbs={configuration.breadcrumbs}
                    keyword={editorData.focusKeyword}
                    onChange={onEditorChange}
                    hasPaperStyle={false}
                    mode={mode}
                    baseUrl={configuration.baseUrl}
                    faviconSrc={faviconSrc}
                    mapEditorDataToPreview={mapEditorDataToPreview}
                />
            </div>
            <SeoAnalysis />
        </React.Fragment>
    );
};

export default React.memo(SeoTab);
