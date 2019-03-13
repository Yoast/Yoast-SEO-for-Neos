import MetaDescriptionLengthAssessment from 'yoastseo/src/assessments/seo/MetaDescriptionLengthAssessment';
import PageTitleWidthAssessment from 'yoastseo/src/assessments/seo/PageTitleWidthAssessment';
import {measureTextWidth} from 'yoastseo/src/helpers';
import wordBoundaries from 'yoastseo/src/config/wordBoundaries';

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
    },
    assessments: {
        seo: {
            MetaDescriptionLengthAssessment: MetaDescriptionLengthAssessment,
            PageTitleWidthAssessment: PageTitleWidthAssessment,
        }
    },
};
