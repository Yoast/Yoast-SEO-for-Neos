import React from 'react';
import { __ } from '@wordpress/i18n';
import { useRecoilValue } from 'recoil';

// External Yoast dependencies
import Collapsible from '@yoast/components/Collapsible';
import FacebookPreview from '@yoast/social-metadata-previews/facebook/FacebookPreview';
import TwitterPreview from '@yoast/social-metadata-previews/twitter/TwitterPreview';

// Internal dependencies
import { useConfiguration } from '../provider/ConfigurationProvider';
import editorState from '../state/editorState';
import parsedPageState from '../state/parsedPageState';

const SocialPreviews = () => {
    const { configuration } = useConfiguration();
    const editorData = useRecoilValue(editorState);
    const pageState = useRecoilValue(parsedPageState);

    return (
        <div className="yoast-seo-social-preview">
            <Collapsible title={__('Facebook preview', 'yoast-components')} initialIsOpen={true}>
                <FacebookPreview
                    siteUrl={editorData.url}
                    title={pageState.openGraph.title || 'N/A'}
                    description={pageState.openGraph.description}
                    imageUrl={pageState.openGraph.image}
                    alt={pageState.openGraph['image:alt']}
                    authorName={pageState.openGraph['article:author']}
                    imageFallbackUrl={configuration.openGraphFallbackImage}
                />
            </Collapsible>
            <Collapsible title={__('Twitter preview', 'yoast-components')} initialIsOpen={true}>
                <TwitterPreview
                    siteUrl={editorData.url}
                    title={pageState.twitterCard.title || 'N/A'}
                    description={pageState.twitterCard.description}
                    imageUrl={pageState.twitterCard.image}
                    imageFallbackUrl={configuration.twitterFallbackImage}
                    isLarge={pageState.twitterCard.card !== 'summary'}
                />
            </Collapsible>
        </div>
    );
};

export default SocialPreviews;
