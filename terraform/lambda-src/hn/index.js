'use strict';

/**
 * Adapts Hacker News authentication responses for the CloudFront application.
 *
 * HN issues a cookie for news.ycombinator.com and redirects after /login.
 * The browser must instead retain the cookie for the CloudFront domain so it
 * can be forwarded to subsequent /hn-api and /x confirmation requests.
 *
 * The Angular client reads x-hn-cookie because JavaScript cannot read a
 * Set-Cookie header. The login redirect is changed to 200 so HttpClient does
 * not follow it before it can read that header.
 */
exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const response = event.Records[0].cf.response;
    const headers = response.headers;
    const cookieValues = [];

    if (headers['set-cookie']) {
        headers['set-cookie'].forEach(cookieHeader => {
            let cookie = cookieHeader.value;

            // Retain only the cookie value while making its scope CloudFront-wide.
            cookieValues.push(cookie.split(';', 1)[0]);
            cookie = cookie.replace(/Domain=[^;]+;?\s*/i, '');
            cookie = cookie.replace(/Secure;?\s*/i, '');
            cookie = cookie.replace(/Path=[^;]+;?\s*/i, 'Path=/; ');
            cookieHeader.value = cookie.trim();
        });
    }

    if (cookieValues.length > 0) {
        headers['x-hn-cookie'] = [{
            key: 'X-HN-Cookie',
            value: cookieValues.join('; ')
        }];
    }

    // The viewer-request function has already rewritten /hn-api/login to /login.
    if (request.uri === '/login' && Number(response.status) >= 300 && Number(response.status) < 400) {
        response.status = '200';
        response.statusDescription = 'OK';
        delete headers.location;
    }

    callback(null, response);
};