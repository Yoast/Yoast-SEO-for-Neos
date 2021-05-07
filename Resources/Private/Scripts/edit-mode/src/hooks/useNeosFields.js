import { useCallback, useRef } from 'react';
import debounce from 'lodash.debounce';
import { useSetRecoilState } from 'recoil';

import { useConfiguration } from '../provider/ConfigurationProvider';
import usePageContent from './usePageContent';
import editorState from '../state/editorState';

const useNeosFields = () => {
    const { editorFieldMapping } = useConfiguration();
    const { loadPageContent } = usePageContent();
    const setEditorData = useSetRecoilState(editorState);

    /**
     * Update hidden Neos editable fields to forward changes to the backend
     */
    const updateNeosFields = useCallback(
        (key, data) => {
            if (key === 'title') {
                key = 'titleOverride';
            }
            const field = editorFieldMapping[key].querySelector('.neos-inline-editable');

            // Try to update the hidden fields data via the CKEDITOR api
            // The api might not be initialized yet
            if (window.CKEDITOR && window.CKEDITOR.instances && Object.keys(window.CKEDITOR.instances).length > 0) {
                // eslint-disable-next-line no-unused-vars
                for (let [key, editor] of Object.entries(window.CKEDITOR.instances)) {
                    if (editor.element.$ === field) editor.setData(data);
                }
            } else {
                // Update the hidden field without the api. This works fine with CKEditor 5
                if (field.hasChildNodes() && field.childNodes.length === 1 && field.childNodes[0].nodeType === 1) {
                    field.childNodes[0].innerHTML = data;
                } else {
                    field.innerHTML = data;
                }
            }

            // Request new page content and analysis after changes were applied
            loadPageContent();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const debouncedUpdateNeosFields = useRef(debounce((key, value) => updateNeosFields(key, value), 500)).current;

    const updateEditorData = useCallback(
        (key, value) => {
            setEditorData((prev) => ({ ...prev, [key]: value }));
            // Update hidden Neos fields from the changed values of the editor fields.
            debouncedUpdateNeosFields(key, value);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    return { updateEditorData };
};

export default useNeosFields;
