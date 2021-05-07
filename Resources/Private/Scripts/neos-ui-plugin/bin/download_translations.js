#!/usr/bin/env node
const { download_translations } = require('@yoast-seo-for-neos/shared/src/helper/downloader');
const program = require('commander');

program
    .version(require('../package').version)
    .option('-u, --url <u>', 'TODO')
    .option('-t, --textdomain <textdomain>', 'TODO')
    .option('-d, --domainPath <languages>', 'TODO')
    .parse(process.argv);

// Enforce required arguments
if (!(program.url && program.textdomain && program.domainPath)) {
    program.help();
}

let options = {
    url: program.url,
    domainPath: program.domainPath,
    file_format: '%domainPath%/%textdomain%-%wp_locale%%slugSuffix%.%format%',
    slug: 'wp-plugins/' + program.textdomain + '/dev/',
    textdomain: program.textdomain,
    formats: ['po'],
    filter: {
        translation_sets: false,
        minimum_percentage: 50,
        waiting_strings: false,
    },
};

download_translations(options);
