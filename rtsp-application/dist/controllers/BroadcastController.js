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
var config_1 = require("../config");
var express = require("express");
var OpenViduService_1 = require("../services/OpenViduService");
exports.app = express.Router({
    strict: true
});
var openviduService = OpenViduService_1.OpenViduService.getInstance();
exports.app.post('/start', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var IS_BROADCASTING_ENABLED, sessionId, broadcastUrl, isCE, error_1, code, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                IS_BROADCASTING_ENABLED = config_1.CALL_BROADCAST.toUpperCase() === 'ENABLED';
                if (!IS_BROADCASTING_ENABLED) return [3 /*break*/, 4];
                sessionId = openviduService.getSessionIdFromCookie(req === null || req === void 0 ? void 0 : req.cookies);
                if (!(!!sessionId && openviduService.isModeratorSessionValid(sessionId, req.cookies))) return [3 /*break*/, 2];
                console.log("Starting broadcast in " + sessionId);
                broadcastUrl = req.body.broadcastUrl;
                isCE = openviduService.isCE();
                if (isCE) {
                    return [2 /*return*/, res
                            .status(400)
                            .send(JSON.stringify({ broadcastAvailable: false, message: 'Broadcast is not available on OpenVidu CE.' }))];
                }
                return [4 /*yield*/, openviduService.startBroadcasting(sessionId, broadcastUrl)];
            case 1:
                _a.sent();
                return [2 /*return*/, res.status(200).send({ broadcastAvailable: true, message: 'Broadcasting started' })];
            case 2:
                console.log("Permissions denied for starting broadcast in session " + sessionId);
                res.status(403).send(JSON.stringify({ message: 'Permissions denied to drive broadcast' }));
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                console.log("Start broadcast failed. OpenVidu Call Broadcasting is disabled");
                res.status(403).send(JSON.stringify({ message: 'OpenVidu Call Broadcasting is disabled' }));
                _a.label = 5;
            case 5: return [3 /*break*/, 7];
            case 6:
                error_1 = _a.sent();
                console.log(error_1);
                code = Number(error_1 === null || error_1 === void 0 ? void 0 : error_1.message);
                message = "Unexpected error starting broadcast";
                if (code === 409) {
                    message = 'The session is already being streamed.';
                }
                else if (code === 404) {
                    message = 'Session not found';
                }
                else if (code === 400) {
                    message = 'Url is not valid';
                }
                else if (code === 406) {
                    message = 'Session is not active';
                }
                else if (code === 501) {
                    message = 'OpenVidu Server broadcast module is disabled';
                }
                return [2 /*return*/, res.status(code || 500).send(JSON.stringify({ message: message }))];
            case 7: return [2 /*return*/];
        }
    });
}); });
exports.app["delete"]('/stop', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var IS_BROADCASTING_ENABLED, sessionId, error_2, code, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                IS_BROADCASTING_ENABLED = config_1.CALL_BROADCAST.toUpperCase() === 'ENABLED';
                if (!IS_BROADCASTING_ENABLED) return [3 /*break*/, 4];
                sessionId = openviduService.getSessionIdFromCookie(req === null || req === void 0 ? void 0 : req.cookies);
                if (!(!!sessionId && openviduService.isModeratorSessionValid(sessionId, req.cookies))) return [3 /*break*/, 2];
                console.log("Stopping broadcast in " + sessionId);
                return [4 /*yield*/, openviduService.stopBroadcasting(sessionId)];
            case 1:
                _a.sent();
                res.status(200).send({ message: 'Broadcasting stopped' });
                return [3 /*break*/, 3];
            case 2:
                console.log("Permissions denied for stopping broadcast in session " + sessionId);
                res.status(403).send(JSON.stringify({ message: 'Permissions denied to drive broadcast' }));
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                console.log("Stop broadcast failed. OpenVidu Call Broadcasting is disabled");
                res.status(403).send(JSON.stringify({ message: 'OpenVidu Call Broadcasting is disabled' }));
                _a.label = 5;
            case 5: return [3 /*break*/, 7];
            case 6:
                error_2 = _a.sent();
                console.log(error_2);
                code = Number(error_2 === null || error_2 === void 0 ? void 0 : error_2.message);
                message = "Unexpected error starting broadcast";
                if (code === 409) {
                    message = 'The session is not being streamed.';
                }
                else if (code === 404) {
                    message = 'Session not found';
                }
                else if (code === 501) {
                    message = 'OpenVidu Server broadcast module is disabled';
                }
                return [2 /*return*/, res.status(code || 500).send(JSON.stringify({ message: message }))];
            case 7: return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=BroadcastController.js.map