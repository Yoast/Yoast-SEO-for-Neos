/**
 * Request an url and get a Promise in return.
 *
 * @param {string} url
 * @returns {Promise}
 */
function fetch(url) {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        req.open('GET', url);
        req.onload = () => req.status === 200 ? resolve(req.response) : reject(Error(req.statusText));
        req.onerror = (e) => reject(Error(`Network Error: ${e}`));
        req.send();
    });
}

export default fetch;
