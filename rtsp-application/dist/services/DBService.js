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
exports.DBService = void 0;
var mysql = require("mysql2");
var config_1 = require("../config");
var OpenViduService_1 = require("./OpenViduService");
var DBService = /** @class */ (function () {
    function DBService() {
        this.databaseInterval = null;
        this.videoTableQuery = "CREATE TABLE IF NOT EXISTS " + config_1.DB_VIDEO_TABLE + " (\n\t\tid INT NOT NULL AUTO_INCREMENT ,\n\t\tgraph_timestamp DATETIME,\n\t\tvideo_time_seconds INT,\n\t\tvideo_url TEXT,\n\t\tPRIMARY KEY (id)\n\t)";
        this.metricTableQuery = "CREATE TABLE IF NOT EXISTS " + config_1.DB_METRIC_TABLE + " (\n\t\tid INT NOT NULL AUTO_INCREMENT,\n\t\tgraph_timestamp DATETIME,\n\t\tvalue INT,\n\t\tPRIMARY KEY (id)\n\t)";
        var connectionOptions = {
            host: config_1.DB_HOSTNAME,
            user: config_1.DB_USERNAME,
            password: config_1.DB_PASSWORD,
            database: config_1.DB_NAME,
            insecureAuth: true
        };
        console.log('Creating DBService instance...', connectionOptions);
        this.mysqlConnection = mysql.createConnection({
            host: config_1.DB_HOSTNAME,
            user: config_1.DB_USERNAME,
            password: config_1.DB_PASSWORD,
            database: config_1.DB_NAME,
            insecureAuth: true
        });
        this.createTables();
    }
    DBService.getInstance = function () {
        if (!DBService.instance) {
            DBService.instance = new DBService();
        }
        return DBService.instance;
    };
    DBService.prototype.createTables = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                try {
                    this.mysqlConnection.connect(function (err) {
                        if (err) {
                            console.error('Error connecting to database: ' + err.stack);
                            return;
                        }
                        console.log('Database connected successfully.');
                        _this.mysqlConnection.query(_this.videoTableQuery, function (error, results, fields) {
                            if (error) {
                                console.error('Error creating video table:', error);
                                return;
                            }
                            console.log('Video table created successfully.');
                        });
                        _this.mysqlConnection.query(_this.metricTableQuery, function (error, results, fields) {
                            if (error) {
                                console.error('Error creating metric table:', error);
                                return;
                            }
                            console.log('Metric table created successfully.');
                        });
                    });
                    // this.mysqlConnection.end();
                }
                catch (error) {
                    console.error('Error creating tables:', error);
                }
                return [2 /*return*/];
            });
        });
    };
    DBService.prototype.startDataGenerationWithInterval = function (timestampMs, videoUrl) {
        var _this = this;
        if (this.databaseInterval !== null) {
            console.log('Database interval is already active. Stopping it...');
            this.stopDataGeneration();
        }
        var interval = Number(config_1.DATA_GENERATION_INTERVAL_SECONDS);
        var secondsToAdd = Number(interval);
        try {
            // this.mysqlConnection.connect();
            this.databaseInterval = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
                var updatedTimestamp;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            updatedTimestamp = timestampMs + secondsToAdd * 1000;
                            return [4 /*yield*/, this.insertVideoData(updatedTimestamp, secondsToAdd, videoUrl)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.insertMetricData(updatedTimestamp)];
                        case 2:
                            _a.sent();
                            if (OpenViduService_1.OpenViduService.getInstance().isRecording()) {
                                secondsToAdd += Number(interval);
                            }
                            return [2 /*return*/];
                    }
                });
            }); }, interval * 1000);
        }
        catch (error) {
            console.error('Error creating database data:', error);
        }
        console.log("Database data generation started with interval of " + interval + " seconds.");
    };
    DBService.prototype.stopDataGeneration = function () {
        if (this.databaseInterval !== null) {
            console.log('Stopping data generation...');
            clearInterval(this.databaseInterval);
            this.databaseInterval = null;
            // this.mysqlConnection?.end();
            console.log('Database interval stopped.');
        }
        else {
            console.warn('Database interval is not active.');
        }
    };
    DBService.prototype.closeConnection = function () {
        if (this.mysqlConnection) {
            this.mysqlConnection.end();
        }
    };
    DBService.prototype.insertVideoData = function (timestampMs, videoTimeSec, videoUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // this.mysqlConnection.connect();
                        // const videoUrl = OpenViduService.getInstance().getCurrentRecordingUrl();
                        // if(!videoUrl) {
                        // 	videoTimeSec = -1;
                        // }
                        var data = {
                            graph_timestamp: _this.getDateTime(timestampMs),
                            video_time_seconds: videoTimeSec,
                            video_url: videoUrl
                        };
                        var query = "INSERT INTO " + config_1.DB_VIDEO_TABLE + " SET ?";
                        _this.mysqlConnection.query(query, data, function (error, results, fields) {
                            if (error) {
                                console.error('Error inserting data:', error);
                                reject(error);
                                return;
                            }
                            console.log('Data inserted successfully in video table.', data);
                        });
                        // this.mysqlConnection.end();
                        resolve();
                    })];
            });
        });
    };
    DBService.prototype.insertMetricData = function (timestampMs) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var data = {
                            graph_timestamp: _this.getDateTime(timestampMs),
                            value: Math.floor(Math.random() * 100) + 1
                        };
                        var query = "INSERT INTO " + config_1.DB_METRIC_TABLE + " SET ?";
                        _this.mysqlConnection.query(query, data, function (error, results, fields) {
                            if (error) {
                                console.error('Error inserting data:', error);
                                reject(error);
                                return;
                            }
                            console.log('Data inserted successfully in metric table.', data);
                        });
                        // this.mysqlConnection.end();
                        resolve();
                    })];
            });
        });
    };
    DBService.prototype.getDateTime = function (timestampMs) {
        return new Date(timestampMs).toISOString().slice(0, 19).replace('T', ' ');
    };
    return DBService;
}());
exports.DBService = DBService;
//# sourceMappingURL=DBService.js.map