import React, { useCallback, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useRecoilValue } from 'recoil';

// Yoast dependencies
import ContentAnalysis from '@yoast/analysis-report/ContentAnalysis';
import Modal from '@yoast/components/Modal';
import Collapsible from '@yoast/components/Collapsible';
import colors from '@yoast/style-guide/colors.json';

// Internal dependencies
import { useConfiguration } from '../provider/ConfigurationProvider';
import analysisState from '../state/analysisState';

const modalStyles = {
    content: {
        bottom: 'auto',
    },
};

const SeoAnalysis = () => {
    const { allResults, seoResults } = useRecoilValue(analysisState);
    const { modalContainer } = useConfiguration();
    const [currentMarkerId, setCurrentMarkerId] = useState('');
    const [currentMarker, setCurrentMarker] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const onMarkButtonClick = useCallback(
        (id, marker) => {
            setCurrentMarkerId(id);
            setCurrentMarker(marker);
            setModalIsOpen(true);
        },
        [setCurrentMarkerId, setCurrentMarker, setModalIsOpen]
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

            <Collapsible
                title={__('SEO analysis', 'yoast-components')}
                initialIsOpen={true}
                prefixIcon={{
                    icon: seoResults.icon,
                    color: colors['$color_' + seoResults.color],
                    size: '18px',
                }}
                prefixIconCollapsed={{
                    icon: seoResults.icon,
                    color: colors['$color_' + seoResults.color],
                    size: '18px',
                }}
                headingProps={{ level: 2, fontSize: '18px' }}
            >
                <strong className="yoast-seo-analysis__header">{__('Analysis results', 'yoast-components')}</strong>
                <ContentAnalysis {...seoResults} onMarkButtonClick={onMarkButtonClick} marksButtonStatus={'enabled'} />
            </Collapsible>
        </div>
    );
};

export default React.memo(SeoAnalysis);
