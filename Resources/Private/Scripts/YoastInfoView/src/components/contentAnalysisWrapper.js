import React, {PureComponent} from 'react';
import Modal from 'react-modal';
import styled from "styled-components";
import PropTypes from "prop-types";

import {parseResults, groupResultsByRating} from "../helper/resultParser";

import ContentAnalysis from "yoast-components/composites/Plugin/ContentAnalysis/components/ContentAnalysis";
import {Collapsible, StyledIconsButton} from "yoast-components/composites/Plugin/Shared/components/Collapsible";
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
                console.log(results, 'All results');
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
                        ...this.seoResults.results,
                        errorResults: [errorResult]
                    },
                    readabilityResults: {
                        ...this.readabilityResults.results,
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
                    <Modal isOpen={this.state.modalIsOpen} onRequestClose={this.closeModal} ariaHideApp={false}
                           style={modalStyles}>
                        <h2 dangerouslySetInnerHTML={{__html: this.state.allResults[this.state.currentMarkerId]['text']}}/>
                        <ul>
                            {this.state.currentMarker.map(mark => (
                                <li className="yoast-seo__mark"
                                    dangerouslySetInnerHTML={{__html: mark._properties.marked}}/>
                            ))}
                        </ul>
                        <button className="button--close" onClick={this.closeModal}>
                            <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="times"
                                 className="svg-inline--fa fa-times fa-w-10 fa-lg" role="img"
                                 xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                <path fill="currentColor"
                                      d="M207.6 256l107.72-107.72c6.23-6.23 6.23-16.34 0-22.58l-25.03-25.03c-6.23-6.23-16.34-6.23-22.58 0L160 208.4 52.28 100.68c-6.23-6.23-16.34-6.23-22.58 0L4.68 125.7c-6.23 6.23-6.23 16.34 0 22.58L112.4 256 4.68 363.72c-6.23 6.23-6.23 16.34 0 22.58l25.03 25.03c6.23 6.23 16.34 6.23 22.58 0L160 303.6l107.72 107.72c6.23 6.23 16.34 6.23 22.58 0l25.03-25.03c6.23-6.23 6.23-16.34 0-22.58L207.6 256z"></path>
                            </svg>
                        </button>
                    </Modal>
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
                    prefixIcon={{icon: readabilityRatingIcon, color: colors['$color_' + readabilityRatingColor], size: "18px"}}
                    prefixIconCollapsed={{icon: readabilityRatingIcon, color: colors['$color_' + readabilityRatingColor], size: "18px"}}
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
