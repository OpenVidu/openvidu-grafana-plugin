"use strict";
exports.__esModule = true;
exports.AuthService = void 0;
var timingSafeEqual = require('crypto').timingSafeEqual;
var config_1 = require("../config");
var AuthService = /** @class */ (function () {
    function AuthService() {
        var _this = this;
        this.adminSessions = new Map();
        this.ADMIN_COOKIE_NAME = 'ovCallAdminToken';
        this.authorizer = function (req, res, next) {
            if (config_1.CALL_PRIVATE_ACCESS === 'ENABLED') {
                var userAuth = req.headers.authorization;
                var auth = 'Basic ' + Buffer.from(config_1.CALL_USER + ":" + config_1.CALL_SECRET).toString('base64');
                var validAuth = _this.safeCompare(userAuth, auth);
                if (validAuth) {
                    next();
                }
                else {
                    console.log('Unauthorized');
                    return res.status(401).send('Unauthorized');
                }
            }
            else {
                next();
            }
        };
    }
    AuthService.getInstance = function () {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    };
    AuthService.prototype.isAdminSessionValid = function (sessionId) {
        if (!sessionId)
            return false;
        var adminCookie = this.adminSessions.get(sessionId);
        return (adminCookie === null || adminCookie === void 0 ? void 0 : adminCookie.expires) > new Date().getTime();
    };
    AuthService.prototype.safeCompare = function (a, b) {
        if (!!a && !!b) {
            var aLength = Buffer.byteLength(a);
            var bLength = Buffer.byteLength(b);
            var aBuffer = Buffer.alloc(aLength, 0, 'utf8');
            aBuffer.write(a);
            var bBuffer = Buffer.alloc(aLength, 0, 'utf8');
            bBuffer.write(b);
            return !!(timingSafeEqual(aBuffer, bBuffer) && aLength === bLength);
        }
        return false;
    };
    return AuthService;
}());
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map