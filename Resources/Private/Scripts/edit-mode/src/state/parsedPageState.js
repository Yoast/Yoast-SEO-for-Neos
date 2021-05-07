import { atom } from 'recoil';

const parsedPageState = atom({
    key: 'parsedPageState',
    default: {
        title: '',
        description: '',
        content: '',
        locale: '',
        twitterCard: {
            card: null,
            title: null,
            site: null,
            description: null,
            creator: null,
            url: null,
            image: null,
        },
        openGraph: {
            type: null,
            title: null,
            site_name: null,
            locale: null,
            description: null,
            url: null,
            image: null,
            'image:width': null,
            'image:height': null,
            'image:alt': null,
        },
    },
});

export default parsedPageState;
