/**
 * Proxy config is used for by-passing CORS problems while
 * developing locally.
 */
console.log('--- PROXY CONFIG HAS BEEN READ ---'); 

const PROXY_CONFIG = [
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
            // Remove Domain- ja Secure-attributes so that browser won't
            // reject "ylelogin" (and other) cookies.
            let modifiedCookie = cookie.replace(/Domain=[^;]+;?/, '');
            modifiedCookie = modifiedCookie.replace(/Secure;?/, '');
            return modifiedCookie.trim();
          });
          
          proxyRes.headers['set-cookie'] = modifiedCookies;
        }
      });
    },
  },
  {
    context: ["/v1/layout-fragment/"],
    target: "https://layout-front.api.yle.fi",
    secure: true,
    changeOrigin: true,
    logLevel: "debug"
  }  
];

module.exports = PROXY_CONFIG;