// proxy.conf.js

console.log('--- PROXY CONFIG JS FILE HAS BEEN READ BY NODE.JS ---'); 

const PROXY_CONFIG = [
  // 1. Yle Comments API
  {
    context: ["/yle-api"],
    target: "https://comments.api.yle.fi",
    secure: true,
    changeOrigin: true,
    pathRewrite: {
      "^/yle-api": ""
    },
    logLevel: "debug"
  },
  
  // 2. Yle News
  {
    context: ["/yle-news"],
    target: "https://yle.fi",
    secure: true,
    changeOrigin: true,
    pathRewrite: {
      "^/yle-news": ""
    },
    logLevel: "debug"
  },

  {
    context: ["/yle-history"],
    target: "https://datacloud.api.yle.fi", // TÄMÄ ON TÄRKEÄ
    secure: true,
    changeOrigin: true,
    pathRewrite: {
        "^/yle-history": "" // TÄMÄ ON TÄRKEÄ
    },
    logLevel: "debug"
  },
  
  // 3. Yle Login API (Käytämme nyt configure-funktiota)
  {
    context: ["/yle-login"],
    target: "https://login.api.yle.fi",
    secure: true,
    changeOrigin: true,
    pathRewrite: {
      "^/yle-login": ""
    },
    logLevel: "debug",
    
    // ⭐ UUSI ANGULAR CLI/WEBPACK TOTEUTUS ⭐
    configure: (proxy) => {
      // Tämä funktio suoritetaan, kun Yle API palauttaa vastauksen
      proxy.on("proxyRes", (proxyRes, req, res) => {

        const setCookieHeaders = proxyRes.headers['set-cookie'];
        
        if (setCookieHeaders) {
          const modifiedCookies = setCookieHeaders.map(cookie => {
            // Poista Domain- ja Secure-attribuutit
            let modifiedCookie = cookie.replace(/Domain=[^;]+;?/, '');
            modifiedCookie = modifiedCookie.replace(/Secure;?/, '');
            return modifiedCookie.trim();
          });
          
          proxyRes.headers['set-cookie'] = modifiedCookies;
          //console.log('Modified Cookie Header (SUCCESS):', modifiedCookies);
        }
      });
    },
    // ⭐ TOTEUTUS PÄÄTTYY TÄHÄN ⭐
  }
];

module.exports = PROXY_CONFIG;