(function() {
    var host = (window.location.hostname || '').toLowerCase().replace(/^www\./, '');
    if (host !== 'crypto.syntr1x.uno') {
        return;
    }

    // TikTok Pixel
    !function(w, d, t) {
        w.TiktokAnalyticsObject = t;
        var ttq = w[t] = w[t] || [];
        ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
        ttq.setAndDefer = function(target, method) {
            target[method] = function() {
                target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
            };
        };
        for (var i = 0; i < ttq.methods.length; i++) {
            ttq.setAndDefer(ttq, ttq.methods[i]);
        }
        ttq.instance = function(id) {
            var instance = ttq._i[id] || [];
            for (var j = 0; j < ttq.methods.length; j++) {
                ttq.setAndDefer(instance, ttq.methods[j]);
            }
            return instance;
        };
        ttq.load = function(id, options) {
            var src = "https://analytics.tiktok.com/i18n/pixel/events.js";
            ttq._i = ttq._i || {};
            ttq._i[id] = [];
            ttq._i[id]._u = src;
            ttq._t = ttq._t || {};
            ttq._t[id] = +new Date();
            ttq._o = ttq._o || {};
            ttq._o[id] = options || {};
            var script = d.createElement("script");
            script.type = "text/javascript";
            script.async = true;
            script.src = src + "?sdkid=" + id + "&lib=" + t;
            var firstScript = d.getElementsByTagName("script")[0];
            firstScript.parentNode.insertBefore(script, firstScript);
        };

        ttq.load("D6G7EVJC77UEP1KMS76G");
        ttq.page();
    }(window, document, "ttq");

})();
