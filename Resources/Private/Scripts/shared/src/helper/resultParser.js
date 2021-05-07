import scoreToRating from "yoastseo/src/interpreters/scoreToRating";

function parseResults(results) {
    return results.reduce((obj, result) => {
        if (result.text) {
            obj[result._identifier] = {
                id: result._identifier,
                rating: scoreToRating(result.score),
                score: result.score,
                text: result.text,
                hasMarks: result._hasMarks,
                marker: result.marks.map((mark) => {
                    mark._properties.marked = addBlankTargets(mark._properties.marked);
                    return mark;
                }),
            };
        }
        return obj;
    }, {});
}

function addBlankTargets(link) {
    return (""+link).replace(/<a\s+href=/gi, '<a target="_blank" href=');
}

function groupResultsByRating(results, filter = []) {
    let groupedResults = {
        'bad': [],
        'ok': [],
        'good': [],
        'feedback': [],
    };

    Object.values(results).forEach(result => {
        if (filter.indexOf(result.identifier) === -1 && result.rating in groupedResults) {
            groupedResults[result.rating].push(result);
        }
    });

    return groupedResults;
}


export {
    parseResults,
    groupResultsByRating,
}
