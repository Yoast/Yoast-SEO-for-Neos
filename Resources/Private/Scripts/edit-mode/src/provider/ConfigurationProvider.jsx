import React, { createContext, useContext } from 'react';
import * as PropTypes from 'prop-types';

const ConfigurationContext = createContext(null);
const useConfiguration = () => useContext(ConfigurationContext);

const ConfigurationProvider = ({ children, modalContainer, editorFieldMapping, configuration }) => {
    return (
        <ConfigurationContext.Provider value={{ modalContainer, editorFieldMapping, configuration }}>
            {children}
        </ConfigurationContext.Provider>
    );
};

ConfigurationProvider.propTypes = {
    children: PropTypes.element.isRequired,
    modalContainer: PropTypes.object.isRequired,
    editorFieldMapping: PropTypes.shape({
        title: PropTypes.object.isRequired,
        titleOverride: PropTypes.object.isRequired,
        description: PropTypes.object.isRequired,
        slug: PropTypes.object.isRequired,
    }).isRequired,
    configuration: PropTypes.shape({
        baseUrl: PropTypes.string.isRequired,
        breadcrumbs: PropTypes.array.isRequired,
        contentSelector: PropTypes.string.isRequired,
        description: PropTypes.string,
        faviconSrc: PropTypes.string.isRequired,
        focusKeyword: PropTypes.string,
        isAmp: PropTypes.bool.isRequired,
        isCornerstone: PropTypes.bool,
        isHomepage: PropTypes.bool.isRequired,
        openGraphFallbackImage: PropTypes.string,
        pageUrl: PropTypes.string.isRequired,
        previewUrl: PropTypes.string.isRequired,
        siteUrl: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        titleOverride: PropTypes.string,
        translationsUrl: PropTypes.string.isRequired,
        twitterFallbackImage: PropTypes.string,
        uiLocale: PropTypes.string.isRequired,
        uriPathSegment: PropTypes.string.isRequired,
        workerUrl: PropTypes.string.isRequired,
    }),
};

export { ConfigurationProvider, useConfiguration };
