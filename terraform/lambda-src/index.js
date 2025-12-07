'use strict';

/**
 * Remove "Domain" and "Secure" attributes from set-cookie headers.
 * This is for letting browser not to reject set-cookies from other domain (yle.fi).
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