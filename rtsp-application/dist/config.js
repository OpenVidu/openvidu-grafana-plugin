"use strict";
exports.__esModule = true;
exports.DB_METRIC_TABLE = exports.DB_VIDEO_TABLE = exports.DB_NAME = exports.DB_PASSWORD = exports.DB_USERNAME = exports.DB_HOSTNAME = exports.DATA_GENERATION_INTERVAL_SECONDS = exports.DATA_GENERATION_STATUS = exports.RECORDING_DURATION_SECONDS = exports.MODE = exports.RTSP_CAMERA_PASSWORD = exports.RTSP_CAMERA_USERNAME = exports.RTSP_CAMERAS_URLS = exports.SESSION_NAME = exports.OPENVIDU_SECRET = exports.OPENVIDU_URL = exports.SERVER_PORT = void 0;
exports.SERVER_PORT = process.env.SERVER_PORT || 5000;
// OpenVidu configuration
exports.OPENVIDU_URL = process.env.OPENVIDU_URL || 'http://localhost:4443/';
exports.OPENVIDU_SECRET = process.env.OPENVIDU_SECRET || 'MY_SECRET';
exports.SESSION_NAME = process.env.SESSION_NAME || 'RTSP_Session';
// RTSP Cameras configuration
//
exports.RTSP_CAMERAS_URLS = process.env.RTSP_CAMERAS_URLS || 'rtsp://192.168.1.38/stream1,rtsp://192.168.1.38/stream2';
exports.RTSP_CAMERA_USERNAME = process.env.RTSP_CAMERA_USERNAME || 'openvidu';
exports.RTSP_CAMERA_PASSWORD = process.env.RTSP_CAMERA_PASSWORD || 'openvidu';
// AUTO: The recording will start automatically once the server is up
// MANUAL: The recording will start when you subcribe to the session cameras using the webapp (http://localhost:5000)
exports.MODE = process.env.MODE || 'AUTO';
//? STOP CONDITION?
// Recording configuration
// Each Recording duration in seconds. Default: 30 seconds
exports.RECORDING_DURATION_SECONDS = process.env.RECORDING_DURATION_SECONDS || 15;
// Metrics configuration
exports.DATA_GENERATION_STATUS = process.env.DATA_GENERATION_STATUS || 'ENABLED';
exports.DATA_GENERATION_INTERVAL_SECONDS = process.env.DATA_GENERATION_INTERVAL_SECONDS || 5;
// Database configuration. Only if DATA_GENERATION_STATUS is ENABLED
exports.DB_HOSTNAME = process.env.DB_HOSTNAME || '0.0.0.0';
exports.DB_USERNAME = process.env.DB_USERNAME || 'root';
exports.DB_PASSWORD = process.env.DB_PASSWORD || 'password';
exports.DB_NAME = process.env.DB_NAME || 'grafana_db';
exports.DB_VIDEO_TABLE = process.env.DB_VIDEO_TABLE || 'video_data';
exports.DB_METRIC_TABLE = process.env.DB_METRIC_TABLE || 'metric_data';
//# sourceMappingURL=config.js.map