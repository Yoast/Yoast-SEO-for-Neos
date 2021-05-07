import MetaDescriptionLengthAssessment from 'yoastseo/src/assessments/seo/MetaDescriptionLengthAssessment';
import PageTitleWidthAssessment from 'yoastseo/src/assessments/seo/PageTitleWidthAssessment';
import { measureTextWidth } from 'yoastseo/src/helpers';
import wordBoundaries from 'yoastseo/src/config/wordBoundaries';
import replaceDiacritics from 'yoastseo/src/stringProcessing/replaceDiacritics';
import stripSpaces from 'yoastseo/src/stringProcessing/stripSpaces';

/**
 * Store yoast seo libraries in global scope to make the available to NeosYoastApp.
 * These libraries are excluded in webpack as the treeshaking is not working for these and
 * would lead to a huge bundle.
 */
window.yoastseo = {
    seo: {
        MetaDescriptionLengthAssessment: MetaDescriptionLengthAssessment,
        PageTitleWidthAssessment: PageTitleWidthAssessment,
    },
    helpers: {
        measureTextWidth: measureTextWidth,
    },
    string: {
        wordBoundaries: wordBoundaries,
        stripSpaces: stripSpaces,
        replaceDiacritics: replaceDiacritics,
    },
    assessments: {
        seo: {
            MetaDescriptionLengthAssessment: MetaDescriptionLengthAssessment,
            PageTitleWidthAssessment: PageTitleWidthAssessment,
        },
    },
};
