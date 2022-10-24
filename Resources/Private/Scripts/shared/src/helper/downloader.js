'use strict';

const request = require('request');
const fs = require('fs');
const path = require('path');
const po2json = require('po2json');

let current_requests = 0;

const download_translations = (options) => {
    options = merge_defaults(options, {
        domainPath: 'languages',
        url: false,
        slug: false,
        textdomain: false,
        file_format: '%domainPath%/%textdomain%-%wp_locale%.%format%',
        formats: ['po', 'mo'],
        filter: {
            translation_sets: false,
            minimum_percentage: 30,
            maximum_percentage: 100,
            waiting_strings: false,
        },
    });

    if (!options.url || !options.slug) {
        console.error('Not all required options are filled in.');
        return;
    }

    options.url = strip_trailing_slash(options.url);
    options.domainPath = strip_trailing_slash(options.domainPath);

    if (!options.textdomain) {
        options.textdomain = options.slug;
    }

    let api_url = options.url + '/api/projects/' + options.slug;

    clear_translations(options);
    get_project_data(api_url, options);
};

const clear_translations = (options) => {
    fs.readdir(options.domainPath, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join(options.domainPath, file), (err) => {
                if (err) throw err;
            });
        }
    });
};

const merge_defaults = (options, defaults) => {
    Object.keys(options).forEach(
        function (name) {
            defaults[name] = options[name];
        }.bind()
    );

    return defaults;
};

const strip_trailing_slash = (str) => {
    if (str.substr(-1) === '/') {
        return str.substr(0, str.length - 1);
    }

    return str;
};

const get_project_data = (api_url, options) => {
    request(api_url, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            let data = JSON.parse(body);
            let set, index, format;

            for (index in data.translation_sets) {
                set = data.translation_sets[index];

                if (0 === set.current_count) {
                    continue;
                }

                if (options.filter.minimum_percentage > parseInt(set.percent_translated)) {
                    continue;
                }

                if (options.filter.maximum_percentage < parseInt(set.percent_translated)) {
                    continue;
                }

                for (format in options.formats) {
                    download_translations_from_set(set, options.formats[format], options, api_url);
                }
            }
        } else {
            console.error('Error while downloading translations', error);
        }
    });
};

const download_translations_from_set = (set, format, options, api_url) => {
    let url = api_url + '/' + set.locale + '/' + set.slug + '/export-translations?format=' + format;

    if (options.filter.waiting_strings) {
        url += '&filters[status]=all';
    }

    let info = {
        domainPath: options.domainPath,
        textdomain: options.textdomain,
        locale: set.locale,
        wp_locale: set.wp_locale,
        slug: set.slug,
        slugSuffix: set.slug === 'default' ? '' : '-' + set.slug,
        format: format,
    };

    if (!info.wp_locale) {
        info.wp_locale = info.locale;

        if (format.indexOf('%wp_locale%') > -1) {
            console.error('Locale ' + set.locale + " doesn't have a wp_locale set.");
        }
    }

    download_file(url, build_filename(options.file_format, info));
};

const build_filename = (format, data) => {
    return format.replace(/%(\w*)%/g, function (m, key) {
        return data.hasOwnProperty(key) ? data[key] : '';
    });
};

const download_file = (url, file) => {
    current_requests++;

    let request_options = {
        url: url,
        encoding: null,
    };

    request(request_options, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            let parsedBody = po2json.parse(body, {
                format: 'jed',
                domain: 'js-text-analysis',
            });

            let filename = file.replace('.po', '.json').replace('wordpress-seo-', '');

            fs.writeFile(process.cwd() + '/' + filename, JSON.stringify(parsedBody), (err) => {
                console.info(err ? err : 'The file ' + filename + ' was saved!');
            });
        }

        current_requests--;

        if (current_requests === 0) {
            console.info('Processed all translation files');
        }
    });
};

module.exports = { download_translations };
