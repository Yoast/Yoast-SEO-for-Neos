import React, { useEffect, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { useRecoilValue, useSetRecoilState } from 'recoil';

// Yoast dependencies
import colors from '@yoast/style-guide/colors.json';
import Loader from '@yoast/components/Loader';
import SvgIcon from '@yoast/components/SvgIcon';
import Tabs from '@yoast/components/Tabs';

// Internal dependencies
import ReadabilityAnalysis from './ReadabilityAnalysis';
import SocialPreviews from './SocialPreviews';
import SeoTab from './SeoTab';
import usePageContent from '../hooks/usePageContent';
import errorState from '../state/errorState';
import editorState from '../state/editorState';
import { useConfiguration } from '../provider/ConfigurationProvider';
import useAnalysis from '../hooks/useAnalysis';
import analysisState from '../state/analysisState';

const NeosYoastApp = () => {
    const { configuration } = useConfiguration();
    const { loadPageContent } = usePageContent();
    const { isAnalyzing } = useAnalysis();
    const error = useRecoilValue(errorState);
    const { seoResults, readabilityResults } = useRecoilValue(analysisState);
    const setEditorData = useSetRecoilState(editorState);
    const SeoTabContent = useMemo(() => <SeoTab />, []);
    const ReadabilityTabContent = useMemo(() => <ReadabilityAnalysis />, []);
    const SocialPreviewsTabContent = useMemo(() => <SocialPreviews />, []);

    // Trigger initial page load for analysis
    useEffect(() => {
        setEditorData({
            title: configuration.titleOverride || configuration.title,
            description: configuration.description || '',
            slug: configuration.uriPathSegment,
            url: configuration.pageUrl,
            focusKeyword: configuration.focusKeyword,
        });
        loadPageContent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <React.Fragment>
            <Loader className={isAnalyzing ? '' : 'yoast-loader--stop'} />
            {error && <div className="yoast-seo__error">{error}</div>}
            {
                <Tabs
                    items={[
                        {
                            id: 'seo',
                            label: (
                                <React.Fragment>
                                    <SvgIcon
                                        icon={isAnalyzing ? 'loading-spinner' : seoResults.icon}
                                        color={colors['$color_' + seoResults.color]}
                                        size="14px"
                                    />
                                    <span>{__('SEO', 'yoast-components')}</span>
                                </React.Fragment>
                            ),
                            content: SeoTabContent,
                        },
                        {
                            id: 'readability',
                            label: (
                                <React.Fragment>
                                    <SvgIcon
                                        icon={isAnalyzing ? 'loading-spinner' : readabilityResults.icon}
                                        color={colors['$color_' + readabilityResults.color]}
                                        size="14px"
                                    />
                                    <span>{__('Readability', 'yoast-components')}</span>
                                </React.Fragment>
                            ),
                            content: ReadabilityTabContent,
                        },
                        {
                            id: 'social',
                            label: __('Social', 'yoast-components'),
                            content: SocialPreviewsTabContent,
                        },
                    ]}
                    tabsFontSize="1em"
                    tabsBaseWidth="auto"
                />
            }
        </React.Fragment>
    );
};

export default React.memo(NeosYoastApp);
