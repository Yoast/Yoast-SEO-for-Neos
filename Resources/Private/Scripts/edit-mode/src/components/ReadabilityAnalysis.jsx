import React, { useCallback, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useRecoilValue } from 'recoil';

// Yoast dependencies
import ContentAnalysis from '@yoast/analysis-report/ContentAnalysis';
import Modal from '@yoast/components/Modal';

// Internal dependencies
import { useConfiguration } from '../provider/ConfigurationProvider';
import analysisState from '../state/analysisState';

const modalStyles = {
    content: {
        bottom: 'auto',
    },
};

const ReadabilityAnalysis = () => {
    const { modalContainer } = useConfiguration();
    const { allResults, readabilityResults } = useRecoilValue(analysisState);
    const [currentMarkerId, setCurrentMarkerId] = useState('');
    const [currentMarker, setCurrentMarker] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const onMarkButtonClick = useCallback(
        (id, marker) => {
            setCurrentMarker(marker);
            setCurrentMarkerId(id);
            setModalIsOpen(true);
        },
        [setModalIsOpen]
    );

    return (
        <div className="yoast-seo-analysis">
            {currentMarkerId && (
                <Modal
                    isOpen={modalIsOpen}
                    onClose={() => setModalIsOpen(false)}
                    modalAriaLabel={allResults[currentMarkerId].text}
                    appElement={modalContainer}
                    style={modalStyles}
                    closeIconButton="Close"
                    heading={__('Analysis results', 'yoast-components')}
                >
                    <strong dangerouslySetInnerHTML={{ __html: allResults[currentMarkerId].text }} />
                    <ul>
                        {currentMarker.map((mark) => (
                            <li
                                key={mark._properties.original}
                                className="yoast-seo__mark"
                                dangerouslySetInnerHTML={{ __html: mark._properties.marked }}
                            />
                        ))}
                    </ul>
                </Modal>
            )}

            <strong className="yoast-seo-analysis__header">{__('Analysis results', 'yoast-components')}</strong>

            <ContentAnalysis
                {...readabilityResults}
                onMarkButtonClick={onMarkButtonClick}
                marksButtonStatus={'enabled'}
            />
        </div>
    );
};

export default React.memo(ReadabilityAnalysis);
