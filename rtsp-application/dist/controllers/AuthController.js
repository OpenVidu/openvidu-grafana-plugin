"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.app = void 0;
var crypto = require("crypto");
var express = require("express");
var config_1 = require("../config");
var AuthService_1 = require("../services/AuthService");
var OpenViduService_1 = require("../services/OpenViduService");
exports.app = express.Router({
    strict: true
});
var cookieAdminMaxAge = 24 * 60 * 60 * 1000; // 24 hours
var openviduService = OpenViduService_1.OpenViduService.getInstance();
var authService = AuthService_1.AuthService.getInstance();
exports.app.post('/login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, callback;
    return __generator(this, function (_b) {
        _a = req.body, username = _a.username, password = _a.password;
        req.headers.authorization = 'Basic ' + Buffer.from(username + ":" + password).toString('base64');
        callback = function () {
            console.log('Login succeeded');
            res.status(200).send('');
        };
        return [2 /*return*/, authService.authorizer(req, res, callback)];
    });
}); });
exports.app.post('/admin/login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var password, adminSessionId, isAdminSessionValid, isAuthValid, id, recordings, error_1, code;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                password = req.body.password;
                adminSessionId = req.cookies[authService.ADMIN_COOKIE_NAME];
                isAdminSessionValid = authService.isAdminSessionValid(adminSessionId);
                isAuthValid = password === config_1.CALL_ADMIN_SECRET || isAdminSessionValid;
                if (!isAuthValid) return [3 /*break*/, 5];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                if (!isAdminSessionValid) {
                    id = crypto.randomBytes(16).toString('hex');
                    res.cookie(authService.ADMIN_COOKIE_NAME, id, {
                        maxAge: cookieAdminMaxAge,
                        secure: config_1.CALL_OPENVIDU_CERTTYPE !== 'selfsigned'
                    });
                    res.cookie(openviduService.PARTICIPANT_TOKEN_NAME, '', { maxAge: 0 });
                    res.cookie(openviduService.MODERATOR_TOKEN_NAME, '', { maxAge: 0 });
                    authService.adminSessions.set(id, { expires: new Date().getTime() + cookieAdminMaxAge });
                }
                return [4 /*yield*/, openviduService.listAllRecordings()];
            case 2:
                recordings = _a.sent();
                console.log(recordings.length + " recordings found");
                res.status(200).send(JSON.stringify({ recordings: recordings }));
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                code = Number(error_1 === null || error_1 === void 0 ? void 0 : error_1.message);
                if (code === 501) {
                    console.log('501. OpenVidu Server recording module is disabled.');
                    res.status(200).send();
                }
                else {
                    console.error(error_1);
                    res.status(500).send('Unexpected error getting recordings');
                }
                return [3 /*break*/, 4];
            case 4: return [3 /*break*/, 6];
            case 5:
                res.status(403).send('Permissions denied');
                _a.label = 6;
            case 6: return [2 /*return*/];
        }
    });
}); });
exports.app.post('/admin/logout', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var adminSessionId;
    return __generator(this, function (_a) {
        adminSessionId = req.cookies[authService.ADMIN_COOKIE_NAME];
        authService.adminSessions["delete"](adminSessionId);
        res.cookie(authService.ADMIN_COOKIE_NAME, '', { maxAge: 0 });
        return [2 /*return*/, res.status(200).send(JSON.stringify({ message: 'Logout succeded' }))];
    });
}); });
//# sourceMappingURL=AuthController.js.map