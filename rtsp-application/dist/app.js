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
var dotenv = require("dotenv");
var express = require("express");
var OpenviduController_1 = require("./controllers/OpenviduController");
var chalk = require("chalk");
var config_1 = require("./config");
var OpenViduService_1 = require("./services/OpenViduService");
var DBService_1 = require("./services/DBService");
dotenv.config();
var app = express();
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use('/openvidu', OpenviduController_1.app);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
app.listen(config_1.SERVER_PORT, function () { return __awaiter(void 0, void 0, void 0, function () {
    var credential, text, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                credential = chalk.yellow;
                text = chalk.cyanBright;
                console.log(' ');
                console.log('---------------------------------------------------------');
                console.log(' ');
                console.log('Server is listening on port', text(config_1.SERVER_PORT));
                console.log(' ');
                console.log('---------------------------------------------------------');
                console.log('OPENVIDU URL: ', text(config_1.OPENVIDU_URL));
                console.log('OPENVIDU SECRET: ', credential(config_1.OPENVIDU_SECRET));
                console.log('RTSP_CAMERAS_URLS', text(config_1.RTSP_CAMERAS_URLS));
                console.log('CAMERA_USERNAME', text(config_1.RTSP_CAMERA_USERNAME));
                console.log('CAMERA_PASSWORD', text(config_1.RTSP_CAMERA_PASSWORD));
                console.log('RECORDING DURATION (seconds)', text(config_1.RECORDING_DURATION_SECONDS) + 's');
                console.log('---------------------------------------------------------');
                console.log(' ');
                if (!(config_1.MODE === 'AUTO')) return [3 /*break*/, 5];
                console.log(' ');
                console.log('---------------------------------------------------------');
                console.log(' ');
                console.log('Recording and Data creation will start automatically each ', text(config_1.RECORDING_DURATION_SECONDS) + 's');
                console.log(' ');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, OpenViduService_1.OpenViduService.getInstance().createSession(config_1.SESSION_NAME)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.log('Error creating session or publishing cameras', error_1);
                return [3 /*break*/, 4];
            case 4: return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
process.on('SIGINT', function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, 5, 6]);
                console.log(' ');
                console.log('---------------------------------------------------------');
                console.log(' ');
                console.log('Stopping server...');
                return [4 /*yield*/, OpenViduService_1.OpenViduService.getInstance().stopRecording()];
            case 1:
                _a.sent();
                return [4 /*yield*/, OpenViduService_1.OpenViduService.getInstance().forceDisconnectCameras()];
            case 2:
                _a.sent();
                return [4 /*yield*/, OpenViduService_1.OpenViduService.getInstance().closeSession()];
            case 3:
                _a.sent();
                DBService_1.DBService.getInstance().stopDataGeneration();
                DBService_1.DBService.getInstance().closeConnection();
                console.log('Server stopped');
                console.log(' ');
                console.log('---------------------------------------------------------');
                console.log(' ');
                return [3 /*break*/, 6];
            case 4:
                error_2 = _a.sent();
                console.log('Error stopping server', error_2);
                return [3 /*break*/, 6];
            case 5:
                process.exit();
                return [7 /*endfinally*/];
            case 6: return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=app.js.map