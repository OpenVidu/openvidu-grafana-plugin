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
exports.proxyGETRecording = exports.app = void 0;
var config_1 = require("../config");
var express = require("express");
var http_proxy_middleware_1 = require("http-proxy-middleware");
var AuthService_1 = require("../services/AuthService");
var OpenViduService_1 = require("../services/OpenViduService");
exports.app = express.Router({
    strict: true
});
var openviduService = OpenViduService_1.OpenViduService.getInstance();
var authService = AuthService_1.AuthService.getInstance();
exports.app.get('/', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var IS_RECORDING_ENABLED, sessionId, adminSessionId, isAdminSessionValid, isModeratorSessionValid, isParticipantSessionValid, message_1, recordings, date, recordings, message, error_1, code, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                IS_RECORDING_ENABLED = config_1.CALL_RECORDING.toUpperCase() === 'ENABLED';
                sessionId = openviduService.getSessionIdFromCookie(req.cookies);
                adminSessionId = req.cookies[authService.ADMIN_COOKIE_NAME];
                isAdminSessionValid = authService.isAdminSessionValid(adminSessionId);
                isModeratorSessionValid = openviduService.isModeratorSessionValid(sessionId, req.cookies);
                isParticipantSessionValid = openviduService.isParticipantSessionValid(sessionId, req.cookies);
                if (!IS_RECORDING_ENABLED) {
                    message_1 = 'Recording is disabled';
                    console.error(message_1);
                    return [2 /*return*/, res.status(403).json({ message: 'Recording is disabled' })];
                }
                if (!isAdminSessionValid) return [3 /*break*/, 2];
                return [4 /*yield*/, openviduService.listAllRecordings()];
            case 1:
                recordings = _a.sent();
                return [2 /*return*/, res.status(200).json(recordings)];
            case 2:
                if (!(Boolean(sessionId) && (isModeratorSessionValid || isParticipantSessionValid))) return [3 /*break*/, 4];
                date = openviduService.getDateFromCookie(req.cookies);
                return [4 /*yield*/, openviduService.listRecordingsBySessionIdAndDate(sessionId, date)];
            case 3:
                recordings = _a.sent();
                return [2 /*return*/, res.status(200).json(recordings)];
            case 4:
                message = 'Permissions denied to drive recording';
                console.error(message);
                return [2 /*return*/, res.status(403).json({ message: message })];
            case 5:
                error_1 = _a.sent();
                console.log(error_1);
                code = Number(error_1 === null || error_1 === void 0 ? void 0 : error_1.message);
                message = 'Unexpected error getting all recordings';
                if (code === 404) {
                    message = 'No recording exist for the session';
                }
                return [2 /*return*/, res.status(Number(code) || 500).send(JSON.stringify({ message: message }))];
            case 6: return [2 /*return*/];
        }
    });
}); });
exports.app.post('/start', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, message, startingRecording, error_2, code, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                sessionId = req.body.sessionId;
                if (!sessionId) {
                    return [2 /*return*/, res.status(400).json({ message: 'Missing session id parameter.' })];
                }
                if (config_1.CALL_RECORDING !== 'ENABLED') {
                    message = 'OpenVidu Call Recording is disabled';
                    console.error("Start recording failed. " + message);
                    return [2 /*return*/, res.status(403).json({ message: message })];
                }
                if (!openviduService.isModeratorSessionValid(sessionId, req.cookies)) {
                    console.log("Permissions denied for starting recording in session " + sessionId);
                    return [2 /*return*/, res.status(403).json({ message: 'Permissions denied to drive recording' })];
                }
                console.log("Starting recording in " + sessionId);
                return [4 /*yield*/, openviduService.startRecording(sessionId)];
            case 1:
                startingRecording = _a.sent();
                openviduService.moderatorsCookieMap.get(sessionId).recordingId = startingRecording.id;
                return [2 /*return*/, res.status(200).json(startingRecording)];
            case 2:
                error_2 = _a.sent();
                console.log(error_2);
                code = Number(error_2 === null || error_2 === void 0 ? void 0 : error_2.message);
                message = "Unexpected error starting recording";
                if (code === 409) {
                    message = 'The session is already being recorded.';
                }
                else if (code === 501) {
                    message = 'OpenVidu Server recording module is disabled';
                }
                else if (code === 406) {
                    message = 'The session has no connected participants';
                }
                return [2 /*return*/, res.status(code || 500).send(JSON.stringify({ message: message }))];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.app.post('/stop', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, message, recordingId, date, recordingList, error_3, code, message;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                sessionId = req.body.sessionId;
                if (!sessionId) {
                    return [2 /*return*/, res.status(400).json({ message: 'Missing session id parameter.' })];
                }
                if (config_1.CALL_RECORDING !== 'ENABLED') {
                    message = 'OpenVidu Call Recording is disabled';
                    console.log("Stop recording failed. " + message);
                    return [2 /*return*/, res.status(403).json({ message: message })];
                }
                if (!openviduService.isModeratorSessionValid(sessionId, req.cookies)) {
                    console.log("Permissions denied for stopping recording in session " + sessionId);
                    return [2 /*return*/, res.status(403).json({ message: 'Permissions denied to drive recording' })];
                }
                recordingId = (_a = openviduService.moderatorsCookieMap.get(sessionId)) === null || _a === void 0 ? void 0 : _a.recordingId;
                if (!recordingId) {
                    return [2 /*return*/, res.status(404).json({ message: 'Session was not being recorded' })];
                }
                console.log("Stopping recording in " + sessionId);
                return [4 /*yield*/, openviduService.stopRecording(recordingId)];
            case 1:
                _b.sent();
                date = openviduService.getDateFromCookie(req.cookies);
                return [4 /*yield*/, openviduService.listRecordingsBySessionIdAndDate(sessionId, date)];
            case 2:
                recordingList = _b.sent();
                openviduService.moderatorsCookieMap.get(sessionId).recordingId = '';
                res.status(200).json(recordingList);
                return [3 /*break*/, 4];
            case 3:
                error_3 = _b.sent();
                console.log(error_3);
                code = Number(error_3 === null || error_3 === void 0 ? void 0 : error_3.message);
                message = "Unexpected error stopping recording";
                if (code === 501) {
                    message = 'OpenVidu Server recording module is disabled';
                }
                else if (code === 406) {
                    message = 'Recording has STARTING status. Wait until STARTED status before stopping the recording';
                }
                return [2 /*return*/, res.status(code || 500).send(JSON.stringify({ message: message }))];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.app["delete"]('/delete/:recordingId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var recordingId, sessionId, adminSessionId, isModeratorSessionValid, isAdminSessionValid, recordings, date, error_4, code, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                recordingId = req.params.recordingId;
                if (!recordingId) {
                    return [2 /*return*/, res.status(400).json({ message: 'Missing recording id parameter.' })];
                }
                sessionId = openviduService.getSessionIdFromRecordingId(recordingId);
                adminSessionId = req.cookies[authService.ADMIN_COOKIE_NAME];
                isModeratorSessionValid = openviduService.isModeratorSessionValid(sessionId, req.cookies);
                isAdminSessionValid = authService.isAdminSessionValid(adminSessionId);
                recordings = [];
                if (!(isModeratorSessionValid || isAdminSessionValid)) {
                    return [2 /*return*/, res.status(403).json({ message: 'Permissions denied to drive recording' })];
                }
                console.log("Deleting recording " + recordingId);
                return [4 /*yield*/, openviduService.deleteRecording(recordingId)];
            case 1:
                _a.sent();
                if (!isAdminSessionValid) return [3 /*break*/, 3];
                return [4 /*yield*/, openviduService.listAllRecordings()];
            case 2:
                recordings = _a.sent();
                return [3 /*break*/, 5];
            case 3:
                date = openviduService.getDateFromCookie(req.cookies);
                return [4 /*yield*/, openviduService.listRecordingsBySessionIdAndDate(sessionId, date)];
            case 4:
                recordings = _a.sent();
                _a.label = 5;
            case 5:
                res.status(200).json(recordings);
                return [3 /*break*/, 7];
            case 6:
                error_4 = _a.sent();
                console.log(error_4);
                code = Number(error_4 === null || error_4 === void 0 ? void 0 : error_4.message);
                message = "Unexpected error deleting the recording";
                if (code === 409) {
                    message = 'The recording has STARTED status. Stop it before deletion.';
                }
                else if (code === 501) {
                    message = 'OpenVidu Server recording module is disabled';
                }
                else if (code === 409) {
                    message = 'No recording exists for the session';
                }
                return [2 /*return*/, res.status(code).send(JSON.stringify({ message: message }))];
            case 7: return [2 /*return*/];
        }
    });
}); });
exports.proxyGETRecording = (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: config_1.OPENVIDU_URL + "/openvidu/",
    secure: config_1.CALL_OPENVIDU_CERTTYPE !== 'selfsigned',
    onProxyReq: function (proxyReq, req, res) {
        proxyReq.removeHeader('Cookie');
        var recordingId = req.params.recordingId;
        if (!recordingId) {
            return res.status(400).send('Missing recording id parameter.');
        }
        var adminSessionId = req.cookies[authService.ADMIN_COOKIE_NAME];
        var isAdminSessionValid = authService.isAdminSessionValid(adminSessionId);
        var sessionId = openviduService.getSessionIdFromRecordingId(recordingId);
        var isModeratorSessionValid = openviduService.isModeratorSessionValid(sessionId, req.cookies);
        var isParticipantSessionValid = openviduService.isParticipantSessionValid(sessionId, req.cookies);
        if (!!sessionId && (isModeratorSessionValid || isParticipantSessionValid || isAdminSessionValid)) {
            proxyReq.setHeader('Connection', 'keep-alive');
            proxyReq.setHeader('Authorization', openviduService.getBasicAuth());
        }
        else {
            return res.status(403).send(JSON.stringify({ message: 'Permissions denied to drive recording' }));
        }
    },
    onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['set-cookie'] = null;
    },
    onError: function (error, req, res) {
        console.log(error);
        var code = Number(error === null || error === void 0 ? void 0 : error.message);
        var message = 'Unexpected error downloading the recording';
        if (code === 404) {
            message = 'No recording exist for the session';
        }
        res.status(Number(code) || 500).send(JSON.stringify({ message: message }));
        return res.end();
    }
});
//# sourceMappingURL=RecordingController.js.map