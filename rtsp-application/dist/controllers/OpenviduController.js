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
var express = require("express");
var OpenViduService_1 = require("../services/OpenViduService");
var openvidu_node_client_1 = require("openvidu-node-client");
var config_1 = require("../config");
// import { DBService } from '../services/DBService';
var openviduService = OpenViduService_1.OpenViduService.getInstance();
// const dbService = DBService.getInstance();
exports.app = express.Router({
    strict: true
});
exports.app.post('/token', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionCreated, token, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, openviduService.createSession(config_1.SESSION_NAME)];
            case 1:
                sessionCreated = _a.sent();
                return [4 /*yield*/, openviduService.createConnection(sessionCreated, 'manual_viewer', openvidu_node_client_1.OpenViduRole.SUBSCRIBER)];
            case 2:
                token = (_a.sent())
                    .token;
                return [2 /*return*/, res.status(200).json({ token: token })];
            case 3:
                error_1 = _a.sent();
                console.log(error_1);
                return [2 /*return*/, res.status(500).send(error_1)];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.app["delete"]('/cameras', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, openviduService.forceDisconnectCameras()];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.log('Error disconnecting cameras', error_2);
                return [3 /*break*/, 3];
            case 3:
                res.status(200).send('Cameras disconnected');
                return [2 /*return*/];
        }
    });
}); });
exports.app.post('/webhook', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 7, 8, 9]);
                _a = req.body.event;
                switch (_a) {
                    case 'recordingStatusChanged': return [3 /*break*/, 1];
                    case 'sessionCreated': return [3 /*break*/, 5];
                    case 'sessionDestroyed': return [3 /*break*/, 6];
                }
                return [3 /*break*/, 6];
            case 1:
                if (!(req.body.status === 'ready')) return [3 /*break*/, 3];
                // It is already stopped
                // Recording  has been successfully generated.
                console.log('Recording READY webhook received');
                return [4 /*yield*/, openviduService.startChunkRecording()];
            case 2:
                _b.sent();
                return [3 /*break*/, 4];
            case 3:
                if (req.body.status === 'started') {
                    //The session is being recorded
                    // Start counting time for the video
                    // start generating metric data
                    console.log('Recording STARTED webhook received');
                }
                else if (req.body.status === 'stopped') {
                    // The recording has been stopped
                    // The recording files are being processed
                    console.log('Recording STOPPED webhook received');
                    if (req.body.reason === 'lastParticipantLeft') {
                        console.log('Last participant left. Recording already stopped by OpenVidu');
                        // const alreadyStopped = true;
                        // await openviduService.stopRecording(alreadyStopped);
                        // if (DATA_GENERATION_STATUS === 'ENABLED') {
                        // 	dbService.stopDataGeneration();
                        // }
                    }
                    // if (DATA_GENERATION_STATUS === 'ENABLED') {
                    // 	dbService.stopDataGeneration();
                    // }
                }
                _b.label = 4;
            case 4: return [3 /*break*/, 6];
            case 5:
                console.log('Session created webhook received');
                setTimeout(function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, openviduService.publishCameras()];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, openviduService.startChunkRecording()];
                            case 2:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); }, 1000);
                return [3 /*break*/, 6];
            case 6: return [3 /*break*/, 9];
            case 7:
                error_3 = _b.sent();
                console.log('Error in webhook', error_3);
                return [3 /*break*/, 9];
            case 8:
                res.status(200).send('Webhook received');
                return [7 /*endfinally*/];
            case 9: return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=OpenviduController.js.map