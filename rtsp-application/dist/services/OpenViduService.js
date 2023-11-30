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
exports.OpenViduService = void 0;
var openvidu_node_client_1 = require("openvidu-node-client");
var config_1 = require("../config");
var DBService_1 = require("./DBService");
var dbService = DBService_1.DBService.getInstance();
var OpenViduService = /** @class */ (function () {
    function OpenViduService() {
        this.cameraConnections = [];
        this.ipCameras = [];
        this.recording = null;
        this.recordingTimeout = null;
        this.openvidu = new openvidu_node_client_1.OpenVidu(config_1.OPENVIDU_URL, config_1.OPENVIDU_SECRET);
        if (process.env.NODE_ENV === 'production')
            this.openvidu.enableProdMode();
        this.ipCameras = config_1.RTSP_CAMERAS_URLS.split(',').map(function (uri, index) {
            var url = new URL(uri);
            url.username = config_1.RTSP_CAMERA_USERNAME;
            url.password = config_1.RTSP_CAMERA_PASSWORD;
            return {
                name: "Camera " + (url.toString().includes('stream1') ? 'Hight Quality' : 'Low Quality'),
                uri: url.toString()
            };
        });
    }
    OpenViduService.getInstance = function () {
        if (!OpenViduService.instance) {
            OpenViduService.instance = new OpenViduService();
        }
        return OpenViduService.instance;
    };
    OpenViduService.prototype.createSession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionProperties, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('Creating session: ', sessionId);
                        sessionProperties = {
                            customSessionId: sessionId,
                            recordingMode: openvidu_node_client_1.RecordingMode.MANUAL,
                            defaultRecordingProperties: {
                                outputMode: openvidu_node_client_1.Recording.OutputMode.COMPOSED,
                                hasAudio: true,
                                hasVideo: true,
                                resolution: '640x480',
                                frameRate: 25,
                                recordingLayout: openvidu_node_client_1.RecordingLayout.BEST_FIT
                            }
                        };
                        _a = this;
                        return [4 /*yield*/, this.openvidu.createSession(sessionProperties)];
                    case 1:
                        _a.session = _b.sent();
                        // await this.session.fetch();
                        return [2 /*return*/, this.session];
                }
            });
        });
    };
    OpenViduService.prototype.closeSession = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.session) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.session.close()];
                    case 1:
                        _a.sent();
                        this.session = null;
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    OpenViduService.prototype.createConnection = function (session, nickname, role) {
        return __awaiter(this, void 0, void 0, function () {
            var connectionProperties, connection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Requesting token for session " + session.sessionId);
                        connectionProperties = { role: role };
                        if (!!nickname) {
                            connectionProperties.data = JSON.stringify({
                                openviduCustomConnectionId: nickname
                            });
                        }
                        console.log('Connection Properties:', connectionProperties);
                        return [4 /*yield*/, session.createConnection(connectionProperties)];
                    case 1:
                        connection = _a.sent();
                        return [2 /*return*/, connection];
                }
            });
        });
    };
    OpenViduService.prototype.publishCameras = function () {
        return __awaiter(this, void 0, void 0, function () {
            var connPromises, _a, error_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        connPromises = [];
                        this.ipCameras.forEach(function (camera) { return __awaiter(_this, void 0, void 0, function () {
                            var connectionProperties;
                            return __generator(this, function (_a) {
                                connectionProperties = {
                                    type: openvidu_node_client_1.ConnectionType.IPCAM,
                                    rtspUri: camera.uri,
                                    adaptativeBitrate: true,
                                    onlyPlayWithSubscribers: false,
                                    networkCache: 1000,
                                    data: JSON.stringify({
                                        name: camera.name
                                    })
                                };
                                connPromises.push(this.session.createConnection(connectionProperties));
                                return [2 /*return*/];
                            });
                        }); });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        console.log('Publishing cameras...');
                        _a = this;
                        return [4 /*yield*/, Promise.all(connPromises)];
                    case 2:
                        _a.cameraConnections = _b.sent();
                        console.log('IP cameras puslibhed: ', this.ipCameras);
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _b.sent();
                        console.error(error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    OpenViduService.prototype.forceDisconnectCameras = function () {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = [];
                        if (!this.session) return [3 /*break*/, 2];
                        this.cameraConnections.forEach(function (connection) {
                            promises.push(_this.session.forceDisconnect(connection));
                        });
                        this.cameraConnections = [];
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    OpenViduService.prototype.startChunkRecording = function () {
        return __awaiter(this, void 0, void 0, function () {
            var duration_1, _a, videoUrl, error_2;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.session.activeConnections.length === 0)
                            return [2 /*return*/];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        duration_1 = Number(config_1.RECORDING_DURATION_SECONDS);
                        console.log("Starting a " + duration_1 + "s recording...");
                        _a = this;
                        return [4 /*yield*/, this.openvidu.startRecording(this.session.sessionId)];
                    case 2:
                        _a.recording = _b.sent();
                        if (!(config_1.DATA_GENERATION_STATUS === 'ENABLED')) return [3 /*break*/, 5];
                        videoUrl = this.getCurrentRecordingUrl();
                        // Start generating data once the recording is started
                        dbService.startDataGenerationWithInterval(this.recording.createdAt, videoUrl);
                        // Insert first video data
                        return [4 /*yield*/, dbService.insertVideoData(this.recording.createdAt, 0, videoUrl)];
                    case 3:
                        // Insert first video data
                        _b.sent();
                        // Insert first metric data
                        return [4 /*yield*/, dbService.insertMetricData(this.recording.createdAt)];
                    case 4:
                        // Insert first metric data
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        this.recordingTimeout = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        console.log(duration_1 + "s have elapsed!");
                                        return [4 /*yield*/, this.stopRecording()];
                                    case 1:
                                        _a.sent();
                                        this.recording = null;
                                        return [2 /*return*/];
                                }
                            });
                        }); }, duration_1 * 1000);
                        return [3 /*break*/, 7];
                    case 6:
                        error_2 = _b.sent();
                        console.error('Error starting recording:', error_2);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    OpenViduService.prototype.stopRecording = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var recordingId;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("Stopping recording...");
                        recordingId = (_a = this.recording) === null || _a === void 0 ? void 0 : _a.id;
                        this.recording = null;
                        clearTimeout(this.recordingTimeout);
                        this.recordingTimeout = null;
                        if (!recordingId) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.openvidu.stopRecording(recordingId)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    // public deleteRecording(recordingId: string): Promise<Error> {
    // 	return this.openvidu.deleteRecording(recordingId);
    // }
    // public getRecording(recordingId: string): Promise<Recording> {
    // 	return this.openvidu.getRecording(recordingId);
    // }
    OpenViduService.prototype.isRecording = function () {
        return !!this.recording;
    };
    OpenViduService.prototype.getCurrentRecordingUrl = function () {
        if (this.recording) {
            return config_1.OPENVIDU_URL + "openvidu/recordings/" + this.recording.id + "/" + this.recording.id + ".mp4";
        }
        return '';
    };
    return OpenViduService;
}());
exports.OpenViduService = OpenViduService;
//# sourceMappingURL=OpenViduService.js.map