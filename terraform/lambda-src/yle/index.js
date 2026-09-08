'use strict';

/**
 * Makes Yle's cross-origin login cookies valid for the CloudFront domain.
 * This function is intentionally separate from the HN edge function because
 * the two services have different session and redirect requirements.
 */
exports.handler = (event, context, callback) => {
    const response = event.Records[0].cf.response;
    const headers = response.headers;

    if (headers['set-cookie']) {
        headers['set-cookie'].forEach(cookieHeader => {
            let cookie = cookieHeader.value;

            cookie = cookie.replace(/Domain=[^;]+;?/, '');
            cookie = cookie.replace(/Secure;?/, '');

            cookieHeader.value = cookie.trim();
        });
    }

    callback(null, response);
};