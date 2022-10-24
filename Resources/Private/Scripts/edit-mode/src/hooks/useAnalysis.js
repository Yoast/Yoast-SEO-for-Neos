import { useCallback, useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

// Yoast dependencies
import AnalysisWorkerWrapper from 'yoastseo/src/worker/AnalysisWorkerWrapper';
import createWorker from 'yoastseo/src/worker/createWorker';
import scoreToRating from 'yoastseo/src/interpreters/scoreToRating';
import { measureTextWidth } from 'yoastseo/src/helpers';
import Paper from 'yoastseo/src/values/Paper';

// Internal dependencies
import { useI18n } from '../provider/I18nProvider';
import { useConfiguration } from '../provider/ConfigurationProvider';
import { groupResultsByRating, parseResults } from '@yoast-seo-for-neos/shared/src/helper/resultParser';
import isAnalyzingState from '../state/isAnalyzingState';
import parsedPageState from '../state/parsedPageState';
import editorState from '../state/editorState';
import pageIsLoadingState from '../state/pageIsLoadingState';
import analysisState from '../state/analysisState';

const errorResult = {
    text: 'An error occurred while analyzing the page!',
    id: '1',
    rating: 'feedback',
    hasMarks: false,
};

const useAnalysis = () => {
    const { configuration } = useConfiguration();
    const { translations } = useI18n();
    const editorData = useRecoilValue(editorState);
    const isLoading = useRecoilValue(pageIsLoadingState);
    const pageState = useRecoilValue(parsedPageState);
    const [isAnalyzing, setIsAnalyzing] = useRecoilState(isAnalyzingState);
    const setAnalysisResults = useSetRecoilState(analysisState);
    const [worker, setWorker] = useState(null);

    /**
     * Create and initialize worker and return a promise for it to finish.
     * @returns {Promise}
     */
    const initializeWorker = useCallback(
        async (locale) => {
            let currentWorker = worker;
            if (!currentWorker) {
                currentWorker = new AnalysisWorkerWrapper(createWorker(configuration.workerUrl));
                setWorker(currentWorker);
            }
            await currentWorker.initialize({
                useCornerstone: configuration.isCornerstone,
                locale,
                contentAnalysisActive: true,
                keywordAnalysisActive: true,
                logLevel: 'ERROR',
                translations,
            });
            return currentWorker;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [worker, translations]
    );

    /**
     * Send page content to worker and retrieve analysis results when it's done.
     */
    const refreshAnalysis = useCallback(
        (pageState) => {
            initializeWorker(configuration.uiLocale)
                .then((worker) => {
                    const paper = new Paper(pageState.content, {
                        keyword: editorData.focusKeyword || '',
                        description: pageState.description || '',
                        title: pageState.title,
                        titleWidth: measureTextWidth(pageState.title),
                        url: new URL(configuration.pageUrl).pathname,
                        locale: pageState.locale,
                        permalink: '',
                    });
                    return worker.analyze(paper);
                })
                .then((results) => {
                    const seoResults = parseResults(results.result.seo[''].results);
                    const readabilityResults = parseResults(results.result.readability.results);

                    const groupedSeoResults = groupResultsByRating(seoResults);
                    const groupedReadabilityResults = groupResultsByRating(readabilityResults);

                    const seoScore = results.result.seo[''].score;
                    const seoRating = isNaN(seoScore) ? 'none' : scoreToRating(seoScore / 10);
                    const readabilityScore = results.result.readability.score;
                    const readabilityRating = isNaN(readabilityScore) ? 'none' : scoreToRating(readabilityScore / 10);

                    setAnalysisResults((prev) => ({
                        ...prev,
                        allResults: { ...seoResults, ...readabilityResults },
                        seoResults: {
                            rating: seoRating,
                            icon: 'seo-score-' + seoRating,
                            color: seoRating !== 'none' ? seoRating : 'grey',
                            score: seoScore,
                            problemsResults: groupedSeoResults.bad,
                            improvementsResults: groupedSeoResults.ok,
                            goodResults: groupedSeoResults.good,
                            considerationsResults: groupedSeoResults.feedback,
                        },
                        readabilityResults: {
                            rating: readabilityRating,
                            icon: 'seo-score-' + readabilityRating,
                            color: readabilityRating !== 'none' ? readabilityRating : 'grey',
                            score: readabilityScore,
                            problemsResults: groupedReadabilityResults.bad,
                            improvementsResults: groupedReadabilityResults.ok,
                            goodResults: groupedReadabilityResults.good,
                            considerationsResults: groupedReadabilityResults.feedback,
                        },
                    }));
                })
                .catch((error) => {
                    console.error(error, 'An error occurred while analyzing the page');
                    setAnalysisResults((prev) => ({
                        ...prev,
                        seoResults: {
                            ...prev.seoResults,
                            errorResults: [errorResult],
                        },
                        readabilityResults: {
                            ...prev.readabilityResults,
                            errorResults: [errorResult],
                        },
                    }));
                })
                .finally(() => {
                    setIsAnalyzing(false);
                });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [editorData.focusKeyword]
    );

    // Refresh analysis when page state changes
    useEffect(() => {
        if (!isLoading && pageState.content) refreshAnalysis(pageState);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageState, isLoading]);

    return { refreshAnalysis, isAnalyzing };
};

export default useAnalysis;
