import React, {PureComponent} from 'react';
import ContentAnalysis
    from "../../node_modules/yoast-components/composites/Plugin/ContentAnalysis/components/ContentAnalysis";
import PropTypes from "prop-types";
import Modal from 'react-modal';
import {parseResults, groupResultsByRating} from "../helper/resultParser";

export default class ContentAnalysisWrapper extends PureComponent {
    static propTypes = {
        refreshAnalysisCallback: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            allResults: {},
            results: {
                problemsResults: [],
                improvementsResults: [],
                goodResults: [],
                considerationsResults: [],
                errorsResults: [],
            },
            currentMarkerId: '',
            currentMarker: [],
            modalIsOpen: false,
        };
    }

    componentDidMount() {
        this.props.refreshAnalysisCallback()
            .then((results) => {
                console.log(results, 'All results');
                let seoResults = parseResults(results.result.seo[''].results);
                let readabilityResults = parseResults(results.result.readability.results);
                let groupedResults = groupResultsByRating({...seoResults, ...readabilityResults});

                this.setState({
                    allResults: {...seoResults, ...readabilityResults},
                    results: {
                        ...this.state.results,
                        problemsResults: groupedResults.bad,
                        improvementsResults: groupedResults.ok,
                        goodResults: groupedResults.good,
                        considerationsResults: groupedResults.feedback
                    }
                });
            }).catch((error) => {
                console.error(error);

                this.setState({
                    results: {
                        ...this.state.results,
                        errorResults: [
                            {
                                text: 'An error occured while analyzing the page!',
                                id: '1',
                                rating: 'feedback',
                                hasMarks: false,
                            }
                        ]
                    }
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
        const modalStyles = {
            content: {
                bottom: 'auto',
            }
        };

        return (
            <div className="yoast-seo__content-analysis-wrapper">
                {this.state.currentMarkerId && (
                    <Modal isOpen={this.state.modalIsOpen} onRequestClose={this.closeModal} ariaHideApp={false} style={modalStyles}>
                        <h2 dangerouslySetInnerHTML={{__html: this.state.allResults[this.state.currentMarkerId]['text']}}/>
                        <ul>
                            {this.state.currentMarker.map(mark => (
                                <li className="yoast-seo__mark"
                                    dangerouslySetInnerHTML={{__html: mark._properties.marked}}/>
                            ))}
                        </ul>
                        <button className="button--close" onClick={this.closeModal}>
                            <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="times"
                                 className="svg-inline--fa fa-times fa-w-10 fa-lg" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M207.6 256l107.72-107.72c6.23-6.23 6.23-16.34 0-22.58l-25.03-25.03c-6.23-6.23-16.34-6.23-22.58 0L160 208.4 52.28 100.68c-6.23-6.23-16.34-6.23-22.58 0L4.68 125.7c-6.23 6.23-6.23 16.34 0 22.58L112.4 256 4.68 363.72c-6.23 6.23-6.23 16.34 0 22.58l25.03 25.03c6.23 6.23 16.34 6.23 22.58 0L160 303.6l107.72 107.72c6.23 6.23 16.34 6.23 22.58 0l25.03-25.03c6.23-6.23 6.23-16.34 0-22.58L207.6 256z"></path></svg>
                        </button>
                    </Modal>
                )}
                <ContentAnalysis
                    {...this.state.results}
                    onMarkButtonClick={(id, marker) => {
                        this.setState({
                            currentMarkerId: id,
                            currentMarker: marker,
                        });
                        this.openModal();
                    }}
                    marksButtonStatus={"enabled"}
                />
            </div>
        );
    }
}
