export const SERVER_PORT = process.env.SERVER_PORT || 5000;

// OpenVidu configuration
export const OPENVIDU_URL = process.env.OPENVIDU_URL || 'http://localhost:4443/';
export const OPENVIDU_SECRET = process.env.OPENVIDU_SECRET || 'MY_SECRET';
export const SESSION_NAME = process.env.SESSION_NAME || 'RTSP_Session';

// RTSP Cameras configuration
export const RTSP_CAMERAS_URLS = process.env.RTSP_CAMERAS_URLS || 'rtsp://192.168.1.38/stream1'
export const RTSP_CAMERA_USERNAME = process.env.RTSP_CAMERA_USERNAME || 'openvidu';
export const RTSP_CAMERA_PASSWORD = process.env.RTSP_CAMERA_PASSWORD || 'openvidu';


// Recording configuration

// Each Recording duration in seconds. Default: 30 seconds
export const RECORDING_DURATION_SECONDS = process.env.RECORDING_DURATION_SECONDS || 15;


// Metrics configuration
export const DATA_GENERATION_STATUS = process.env.DATA_GENERATION_STATUS || 'ENABLED';
export const DATA_GENERATION_INTERVAL_SECONDS = process.env.DATA_GENERATION_INTERVAL_SECONDS || 5;

// Database configuration. Only if DATA_GENERATION_STATUS is ENABLED
export const DB_HOSTNAME = process.env.DB_HOSTNAME || '0.0.0.0';
export const DB_PORT = process.env.DB_PORT || 3306;
export const DB_USERNAME = process.env.DB_USERNAME || 'root';
export const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
export const DB_NAME = process.env.DB_NAME || 'grafana_db';
export const DB_VIDEO_TABLE = process.env.DB_VIDEO_TABLE || 'video_data';
export const DB_METRIC_TABLE = process.env.DB_METRIC_TABLE || 'metric_data';

