// External generic dependencies
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

// External Yoast dependencies
import ContentAnalysis from '@yoast/analysis-report/ContentAnalysis';
import Modal from '@yoast/components/Modal';
import Collapsible from '@yoast/components/Collapsible';
import colors from '@yoast/style-guide/colors';
import {__} from '@wordpress/i18n';

const modalStyles = {
    content: {
        bottom: 'auto'
    }
};

class SeoAnalysis extends PureComponent {
    static propTypes = {
        modalContainer: PropTypes.object.isRequired,
        allResults: PropTypes.object.isRequired,
        seoResults: PropTypes.object.isRequired,
        seoRatingIcon: PropTypes.string,
        seoRatingColor: PropTypes.string
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
        const {allResults, modalContainer, seoResults, seoRatingColor, seoRatingIcon} = this.props;

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

                <Collapsible
                    title={__('SEO analysis', 'yoast-components')}
                    prefixIcon={{
                        icon: seoRatingIcon,
                        color: colors['$color_' + seoRatingColor],
                        size: '18px'
                    }}
                    prefixIconCollapsed={{
                        icon: seoRatingIcon,
                        color: colors['$color_' + seoRatingColor],
                        size: '18px'
                    }}
                    headingProps={{level: 2, fontSize: '18px'}}
                >
                    <strong className="yoast-seo-analysis__header">
                        {__('Analysis results', 'yoast-components')}
                    </strong>
                    <ContentAnalysis
                        {...seoResults}
                        onMarkButtonClick={(id, marker) => {
                            this.setState({
                                currentMarkerId: id,
                                currentMarker: marker
                            });
                            this.openModal();
                        }}
                        marksButtonStatus={'enabled'}
                    />
                </Collapsible>
            </div>
        );
    }
}

export default SeoAnalysis;
