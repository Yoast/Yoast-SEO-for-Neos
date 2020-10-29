// External generic dependencies
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {__} from '@wordpress/i18n';

// External Yoast dependencies
import Collapsible from '@yoast/components/Collapsible';
import FacebookPreview from '@yoast/social-metadata-previews/facebook/FacebookPreview';
import TwitterPreview from '@yoast/social-metadata-previews/twitter/TwitterPreview';

class SocialPreviews extends PureComponent {
    static propTypes = {
        editorData: PropTypes.object.isRequired,
        page: PropTypes.object.isRequired,
        twitterFallbackImage: PropTypes.string.isRequired,
        openGraphFallbackImage: PropTypes.string.isRequired
    };

    render() {
        const {editorData, page, twitterFallbackImage, openGraphFallbackImage} = this.props;

        return (
            <div className="yoast-seo-social-preview">
                <Collapsible title={__('Facebook preview', 'yoast-components')} initialIsOpen={true}>
                    <FacebookPreview
                        siteUrl={editorData.url}
                        title={page.openGraph.title || 'N/A'}
                        description={page.openGraph.description}
                        imageUrl={page.openGraph.image}
                        alt={page.openGraph['image:alt']}
                        authorName={page.openGraph['article:author']}
                        imageFallbackUrl={openGraphFallbackImage}
                    />
                </Collapsible>
                <Collapsible title={__('Twitter preview', 'yoast-components')} initialIsOpen={true}>
                    <TwitterPreview
                        siteUrl={editorData.url}
                        title={page.twitterCard.title || 'N/A'}
                        description={page.twitterCard.description}
                        imageUrl={page.twitterCard.image}
                        imageFallbackUrl={twitterFallbackImage}
                        isLarge={page.twitterCard.card !== 'summary'}
                    />
                </Collapsible>
            </div>
        );
    }
}

export default SocialPreviews;
