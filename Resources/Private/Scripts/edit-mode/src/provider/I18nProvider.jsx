import React, { createContext, useContext, useEffect, useState } from 'react';
import * as PropTypes from 'prop-types';
import { setLocaleData } from '@wordpress/i18n';

import fetch from '@yoast-seo-for-neos/shared/src/helper/fetch';

const I18nContext = createContext(null);
const useI18n = () => useContext(I18nContext);

/**
 * Fetch translations and store them for global usage
 */
const I18nProvider = ({ children, translationsUrl }) => {
    const [loaded, setLoaded] = useState(false);
    const [translations, setTranslations] = useState({
        domain: 'js-text-analysis',
        locale_data: {
            'js-text-analysis': {
                '': {},
            },
        },
    });

    useEffect(() => {
        if (loaded) {
            return;
        }
        fetch(translationsUrl)
            .then((response) => {
                if (!response) {
                    return;
                }
                return response.text ? response.text() : response;
            })
            .then((newTranslations) => {
                newTranslations = JSON.parse(newTranslations);
                if (newTranslations && !newTranslations.error && newTranslations['locale_data']) {
                    setTranslations(newTranslations);
                } else {
                    newTranslations = translations;
                }
                setLocaleData(newTranslations['locale_data']['js-text-analysis'], 'yoast-components');
                setLoaded(true);
            })
            .catch((error) => {
                setLoaded(true);
                console.error(error, 'An error occurred while loading translations');
            });
    }, [setTranslations, setLoaded, translationsUrl]);

    return <I18nContext.Provider value={{ translations }}>{loaded && children}</I18nContext.Provider>;
};

I18nProvider.propTypes = {
    translationsUrl: PropTypes.string.isRequired,
    children: PropTypes.element.isRequired,
};

export { I18nProvider, useI18n };
