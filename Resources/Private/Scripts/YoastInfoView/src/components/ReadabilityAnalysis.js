// External generic dependencies
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {__} from '@wordpress/i18n';

// External Yoast dependencies
import ContentAnalysis from '@yoast/analysis-report/ContentAnalysis';
import Modal from '@yoast/components/Modal';

const modalStyles = {
    content: {
        bottom: 'auto'
    }
};

class ReadabilityAnalysis extends PureComponent {
    static propTypes = {
        modalContainer: PropTypes.object.isRequired,
        allResults: PropTypes.object.isRequired,
        readabilityResults: PropTypes.object.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            currentMarkerId: '',
            currentMarker: [],
            modalIsOpen: false
        };
    }

    openModal = () => {
        this.setState({modalIsOpen: true});
    };

    closeModal = () => {
        this.setState({modalIsOpen: false});
    };

    render() {
        const {currentMarker, currentMarkerId, modalIsOpen} = this.state;
        const {allResults, modalContainer, readabilityResults} = this.props;

        return (
            <div className="yoast-seo-analysis">
                {currentMarkerId && (
                    <Modal isOpen={modalIsOpen} onClose={this.closeModal}
                        modalAriaLabel={allResults[currentMarkerId].text}
                        appElement={modalContainer} style={modalStyles}
                        closeIconButton="Close" heading={__('Analysis results', 'yoast-components')}>
                        <strong
                            dangerouslySetInnerHTML={{__html: allResults[currentMarkerId].text}}/>
                        <ul>
                            {currentMarker.map(mark => (
                                <li key={mark._properties.original} className="yoast-seo__mark"
                                    dangerouslySetInnerHTML={{__html: mark._properties.marked}}/>
                            ))}
                        </ul>
                    </Modal>
                )}

                <strong className="yoast-seo-analysis__header">
                    {__('Analysis results', 'yoast-components')}
                </strong>

                <ContentAnalysis
                    {...readabilityResults}
                    onMarkButtonClick={(id, marker) => {
                        this.setState({
                            currentMarkerId: id,
                            currentMarker: marker
                        });
                        this.openModal();
                    }}
                    marksButtonStatus={'enabled'}
                />
            </div>
        );
    }
}

export default ReadabilityAnalysis;
