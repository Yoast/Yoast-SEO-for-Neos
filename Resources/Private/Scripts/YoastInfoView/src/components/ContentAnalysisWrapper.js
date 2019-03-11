import React, {PureComponent} from 'react';
import styled from "styled-components";
import PropTypes from "prop-types";
import {parseResults, groupResultsByRating} from "../helper/resultParser";

import ContentAnalysis from "yoast-components/composites/Plugin/ContentAnalysis/components/ContentAnalysis";

import YoastModal from "yoast-components/composites/Plugin/Shared/components/YoastModal";
import {Collapsible} from "yoast-components/composites/Plugin/Shared/components/Collapsible";
import colors from "yoast-components/style-guide/colors";
import {scoreToRating} from "yoastseo/src/interpreters";

const errorResult = {
    text: 'An error occured while analyzing the page!',
    id: '1',
    rating: 'feedback',
    hasMarks: false,
};

const modalStyles = {
    content: {
        bottom: 'auto',
    }
};

const StyledContentAnalysisWrapper = styled.div`
    margin: .2rem 1rem;
`;

export default class ContentAnalysisWrapper extends PureComponent {
    static propTypes = {
        refreshAnalysisCallback: PropTypes.func.isRequired,
        modalContainer: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            allResults: {},
            seoResults: {
                score: null,
                problemsResults: [],
                improvementsResults: [],
                goodResults: [],
                considerationsResults: [],
                errorsResults: [],
            },
            readabilityResults: {
                score: null,
                problemsResults: [],
                improvementsResults: [],
                goodResults: [],
                considerationsResults: [],
                errorsResults: [],
            },
            currentMarkerId: '',
            currentMarker: [],
            modalIsOpen: false,
            isAnalyzing: true,
        };
    }

    componentDidMount() {
        this.props.refreshAnalysisCallback()
            .then((results) => {
                let seoResults = parseResults(results.result.seo[''].results);
                let readabilityResults = parseResults(results.result.readability.results);

                let groupedSeoResults = groupResultsByRating(seoResults);
                let groupedReadabilityResults = groupResultsByRating(readabilityResults);

                this.setState({
                    allResults: {...seoResults, ...readabilityResults},
                    seoResults: {
                        score: results.result.seo[''].score,
                        problemsResults: groupedSeoResults.bad,
                        improvementsResults: groupedSeoResults.ok,
                        goodResults: groupedSeoResults.good,
                        considerationsResults: groupedSeoResults.feedback,
                    },
                    readabilityResults: {
                        score: results.result.readability.score,
                        problemsResults: groupedReadabilityResults.bad,
                        improvementsResults: groupedReadabilityResults.ok,
                        goodResults: groupedReadabilityResults.good,
                        considerationsResults: groupedReadabilityResults.feedback,
                    },
                    isAnalyzing: false,
                });
            }).catch((error) => {
                console.error(error);

                this.setState({
                    seoResults: {
                        ...this.state.seoResults,
                        errorResults: [errorResult]
                    },
                    readabilityResults: {
                        ...this.state.readabilityResults,
                        errorResults: [errorResult]
                    },
                    isAnalyzing: false,
                })
            }
        );
    }

    openModal = () => {
        this.setState({modalIsOpen: true});
    };

    closeModal = () => {
        this.setState({modalIsOpen: false});
    };

    render() {
        const seoRating = this.state.seoResults.score ? scoreToRating(this.state.seoResults.score / 10) : 'none';
        const seoRatingIcon = this.state.isAnalyzing ? 'loading-spinner' : 'seo-score-' + seoRating;
        const seoRatingColor = !this.state.isAnalyzing && seoRating !== 'none' ? seoRating : 'grey';

        const readabilityRating = this.state.readabilityResults.score ? scoreToRating(this.state.readabilityResults.score / 10) : 'none';
        const readabilityRatingIcon = this.state.isAnalyzing ? 'loading-spinner' : 'seo-score-' + readabilityRating;
        const readabilityRatingColor = !this.state.isAnalyzing && readabilityRating !== 'none' ? readabilityRating : 'grey';

        return (
            <div className="yoast-seo__content-analysis-wrapper">
                {this.state.currentMarkerId && (
                    <YoastModal isOpen={this.state.modalIsOpen} onClose={this.closeModal}
                                modalAriaLabel={this.state.allResults[this.state.currentMarkerId]['text']}
                                appElement={this.props.modalContainer}  style={modalStyles}
                                closeIconButton="Close" heading="Analysis details">
                        <strong dangerouslySetInnerHTML={{__html: this.state.allResults[this.state.currentMarkerId]['text']}}/>
                        <ul>
                            {this.state.currentMarker.map((mark) => (
                                <li key={mark._properties.original} className="yoast-seo__mark"
                                    dangerouslySetInnerHTML={{__html: mark._properties.marked}}/>
                            ))}
                        </ul>
                    </YoastModal>
                )}

                <Collapsible
                    title="Readability analysis"
                    prefixIcon={{icon: seoRatingIcon, color: colors['$color_' + seoRatingColor], size: "18px"}}
                    prefixIconCollapsed={{icon: seoRatingIcon, color: colors['$color_' + seoRatingColor], size: "18px"}}
                    headingProps={{level: 2, fontSize: "18px"}}
                >
                    <StyledContentAnalysisWrapper>
                        <ContentAnalysis
                            {...this.state.readabilityResults}
                            onMarkButtonClick={(id, marker) => {
                                this.setState({
                                    currentMarkerId: id,
                                    currentMarker: marker,
                                });
                                this.openModal();
                            }}
                            marksButtonStatus={"enabled"}
                        />
                    </StyledContentAnalysisWrapper>
                </Collapsible>

                <Collapsible
                    title="Focus keyphrase"
                    prefixIcon={{
                        icon: readabilityRatingIcon,
                        color: colors['$color_' + readabilityRatingColor],
                        size: "18px"
                    }}
                    prefixIconCollapsed={{
                        icon: readabilityRatingIcon,
                        color: colors['$color_' + readabilityRatingColor],
                        size: "18px"
                    }}
                    headingProps={{level: 2, fontSize: "18px"}}
                >
                    <StyledContentAnalysisWrapper>
                        <ContentAnalysis
                            {...this.state.seoResults}
                            onMarkButtonClick={(id, marker) => {
                                this.setState({
                                    currentMarkerId: id,
                                    currentMarker: marker,
                                });
                                this.openModal();
                            }}
                            marksButtonStatus={"enabled"}
                        />
                    </StyledContentAnalysisWrapper>
                </Collapsible>
            </div>
        );
    }
}
