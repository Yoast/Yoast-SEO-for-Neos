import { useCallback, useRef } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import debounce from 'lodash.debounce';

import PageParser from '@yoast-seo-for-neos/shared/src/helper/PageParser';
import { useConfiguration } from '../provider/ConfigurationProvider';
import parsedPageState from '../state/parsedPageState';
import faviconSrcState from '../state/faviconSrcState';
import titleTemplateState from '../state/titleTemplateState';
import firstPageLoadCompleteState from '../state/firstPageLoadCompleteState';
import pageIsLoadingState from '../state/pageIsLoadingState';
import errorState from '../state/errorState';

const usePageContent = () => {
    const { configuration } = useConfiguration();
    const [isLoading, setIsLoading] = useRecoilState(pageIsLoadingState);
    const [firstPageLoadComplete, setFirstPageLoadComplete] = useRecoilState(firstPageLoadCompleteState);
    const [faviconSrc, setFaviconSrc] = useRecoilState(faviconSrcState);
    const setPageState = useSetRecoilState(parsedPageState);
    const setTitleTemplate = useSetRecoilState(titleTemplateState);
    const setError = useSetRecoilState(errorState);

    /**
     * Checks the page content for a favicon meta tag and will try to retrieve it.
     * If it fails it will try to load the favicon from the default src.
     * If it fails it will instruct the yoast component to use it's default.
     *
     * @returns {Promise<void>}
     */
    const updateFavicon = useCallback(async (faviconMetaTagSrc) => {
        if (faviconMetaTagSrc) {
            let response = await fetch(faviconMetaTagSrc);

            if (response.ok) return setFaviconSrc(faviconMetaTagSrc);
        }

        let response = await fetch(faviconSrc);
        if (response.ok) setFaviconSrc(faviconSrc);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Fetch new content from page preview and trigger analysis at the end.
     */
    const loadPageContent = useCallback(() => {
        if (isLoading) return;

        setIsLoading(true);

        fetch(configuration.previewUrl)
            .then((response) => {
                if (!response || !response.ok) {
                    throw new Error(
                        `Failed fetching preview for Yoast SEO analysis: ${response.status} ${response.statusText}`
                    );
                }
                return response.text();
            })
            .then((documentContent) => {
                const pageParser = new PageParser(documentContent, configuration.contentSelector);

                if (!firstPageLoadComplete) {
                    updateFavicon(pageParser.faviconSrc);
                    setFirstPageLoadComplete(true);

                    const pageTitle = configuration.titleOverride || configuration.title;
                    if (pageParser.title.indexOf(pageTitle) >= 0) {
                        setTitleTemplate(pageParser.title.replace(pageTitle, '{title}'));
                    }
                }
                setPageState((prev) => ({
                    ...prev,
                    title: pageParser.title,
                    description: pageParser.description,
                    locale: pageParser.locale,
                    content: pageParser.pageContent,
                    twitterCard: pageParser.twitterCard,
                    openGraph: pageParser.openGraph,
                }));
            })
            .catch((error) => {
                setError(error.message);
                console.error(error, 'An error occurred while loading the preview');
            })
            .finally(() => {
                setIsLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, firstPageLoadComplete]);

    const debouncedLoadPageContent = useRef(debounce(() => loadPageContent(), 3000)).current;

    return { loadPageContent: debouncedLoadPageContent };
};

export default usePageContent;
