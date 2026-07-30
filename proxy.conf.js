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
  }
];

module.exports = PROXY_CONFIG;