/**
 * Proxy config is used for by-passing CORS problems while
 * developing locally.
 */
console.log('--- PROXY CONFIG HAS BEEN READ ---'); 

const PROXY_CONFIG = [
// 0. HS Comments, Access Token & Lane Items API
  {
    context: ["/hs-api"],
    target: "https://www.hs.fi",
    secure: true,
    changeOrigin: true,
    logLevel: "debug",
    pathRewrite: { "^/hs-api": "" }, // Poistaa /hs-api-etuliitteen
    headers: {
      "Origin": "https://www.hs.fi",
      "Referer": "https://www.hs.fi/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  },
  
  // 1. Yle Comments API, v2
  {
    context: ["/v2/topics/"],
    target: "https://comments.api.yle.fi",
    secure: true,
    changeOrigin: true,
    logLevel: "debug"
  },
  
  // 2. Yle Comments API, v1
  {
    context: ["/v1/topics/"],
    target: "https://comments.api.yle.fi",
    secure: true,
    changeOrigin: true,
    logLevel: "debug"
  },
  
  // 3. User history
  {
    context: ["/v3/history"],
    target: "https://datacloud.api.yle.fi",
    secure: true,
    changeOrigin: true,
    logLevel: "debug"
  },
  
  // 4. Yle Login API 
  {
    context: ["/v1/user/"],
    target: "https://login.api.yle.fi",
    secure: true,
    changeOrigin: true,
    logLevel: "debug",
    configure: (proxy) => {
      proxy.on("proxyRes", (proxyRes, req, res) => {
        const setCookieHeaders = proxyRes.headers['set-cookie'];
        
        if (setCookieHeaders) {
          const modifiedCookies = setCookieHeaders.map(cookie => {
            let modifiedCookie = cookie.replace(/Domain=[^;]+;?/i, '');
            modifiedCookie = modifiedCookie.replace(/Secure;?/i, '');
            return modifiedCookie.trim();
          });
          
          proxyRes.headers['set-cookie'] = modifiedCookies;
        }
      });
    },
  },

  // 5. Yle layout fragment
  {
    context: ["/v1/layout-fragment/"],
    target: "https://layout-front.api.yle.fi",
    secure: true,
    changeOrigin: true,
    logLevel: "debug"
  },

// 6. Hacker News Auth API & Commenting
  {
    // /x is the target of HN's comment confirmation redirect (fnop=commconfirm).
    context: ["/hn-api", "/x"],
    target: "https://news.ycombinator.com",
    secure: true,
    changeOrigin: true,
    logLevel: "debug",
    pathRewrite: { "^/hn-api": "" },
    headers: {
      "Origin": "https://news.ycombinator.com",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
    },

    configure: (proxy) => {
      proxy.on("proxyReq", (proxyReq, req) => {
        // Browsers cannot set the Cookie header directly, so the app uses x-hn-cookie.
        const hnCookie = req.headers['x-hn-cookie'] || req.headers.cookie;
        if (hnCookie) {
          proxyReq.setHeader('Cookie', hnCookie);
        }
      });

      proxy.on("proxyRes", (proxyRes, req, res) => {
        const setCookieHeaders = proxyRes.headers['set-cookie'];
        let cookieStr = '';
        if (setCookieHeaders) {
          const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
          cookieStr = cookies.map(cookie => cookie.split(';', 1)[0]).join('; ');

          // Make the HN session cookie available on localhost for the /x confirmation request.
          proxyRes.headers['set-cookie'] = cookies.map(cookie =>
            cookie
              .replace(/Domain=[^;]+;?\s*/i, '')
              .replace(/Secure;?\s*/i, '')
              .replace(/Path=[^;]+;?\s*/i, 'Path=/; ')
          );
        } else if (req.headers['x-hn-cookie'] || req.headers.cookie) {
          cookieStr = req.headers['x-hn-cookie'] || req.headers.cookie;
        }

        // Angular HttpClient follows 3xx responses automatically. Stop the login redirect so the
        // app can read the original HN session cookie from the response headers.
        if (req.url?.includes('/login') && proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400) {
          proxyRes.statusCode = 200;
          delete proxyRes.headers.location;
        }

        if (cookieStr) {
          proxyRes.headers['x-hn-cookie'] = cookieStr;
          proxyRes.headers['access-control-expose-headers'] = 'x-hn-cookie, set-cookie';
        }
      });
    }
  }
];

module.exports = PROXY_CONFIG;