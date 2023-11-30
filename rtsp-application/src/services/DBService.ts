
import { Connection, ConnectionOptions, Pool } from 'mysql2';
import * as mysql from 'mysql2';


import {
	DB_HOSTNAME,
	DB_USERNAME,
	DB_PASSWORD,
	DB_NAME,
	DB_VIDEO_TABLE,
	DB_METRIC_TABLE,
	DATA_GENERATION_INTERVAL_SECONDS,
} from '../config';
import { OpenViduService } from './OpenViduService';

export class DBService {
	protected static instance: DBService;
	private mysqlConnection: Connection;
	private databaseInterval: NodeJS.Timeout | null = null;

	private videoTableQuery = `CREATE TABLE IF NOT EXISTS ${DB_VIDEO_TABLE} (
		id INT NOT NULL AUTO_INCREMENT ,
		graph_timestamp DATETIME,
		video_time_seconds INT,
		video_url TEXT,
		PRIMARY KEY (id)
	)`;
	private metricTableQuery = `CREATE TABLE IF NOT EXISTS ${DB_METRIC_TABLE} (
		id INT NOT NULL AUTO_INCREMENT,
		graph_timestamp DATETIME,
		value INT,
		PRIMARY KEY (id)
	)`;

	constructor() {
		this.mysqlConnection = mysql.createConnection({
			host: DB_HOSTNAME,
			user: DB_USERNAME,
			password: DB_PASSWORD,
			database: DB_NAME,
			insecureAuth: true,
		});

		this.createTables();
	}

	static getInstance() {
		if (!DBService.instance) {
			DBService.instance = new DBService();
		}
		return DBService.instance;
	}

	public async createTables(): Promise<void> {

		try {
			this.mysqlConnection.connect((err) => {
				if (err) {
					console.error('Error connecting to database: ' + err.stack);
					return;
				}
				console.log('Database connected successfully.');
				this.mysqlConnection.query(this.videoTableQuery, (error, results, fields) => {
					if (error) {
						console.error('Error creating video table:', error);
						return;
					}
					console.log('Video table created successfully.');
				});
				this.mysqlConnection.query(this.metricTableQuery, (error, results, fields) => {
					if (error) {
						console.error('Error creating metric table:', error);
						return;
					}
					console.log('Metric table created successfully.');
				});
			});

			// this.mysqlConnection.end();
		} catch (error) {
			console.error('Error creating tables:', error);
		}
	}

	public startDataGenerationWithInterval(timestampMs: number, videoUrl: string): void {

		if (this.databaseInterval !== null) {
			console.log('Database interval is already active. Stopping it...');
			this.stopDataGeneration();
		}

		const interval = Number(DATA_GENERATION_INTERVAL_SECONDS);
		let secondsToAdd = Number(interval);
		try {
			// this.mysqlConnection.connect();
			this.databaseInterval = setInterval(async () => {
				const updatedTimestamp = timestampMs + secondsToAdd * 1000;
				await this.insertVideoData(updatedTimestamp, secondsToAdd, videoUrl);
				await this.insertMetricData(updatedTimestamp);
				if(OpenViduService.getInstance().isRecording()) {
					secondsToAdd += Number(interval);
				}
			}, interval * 1000);
		} catch (error) {
			console.error('Error creating database data:', error);
		}
		console.log(`Database data generation started with interval of ${interval} seconds.`);

	}

	public stopDataGeneration(): void {
		if (this.databaseInterval !== null) {
			console.log('Stopping data generation...');
			clearInterval(this.databaseInterval);
			this.databaseInterval = null;
			// this.mysqlConnection?.end();
			console.log('Database interval stopped.');
		} else {
			console.warn('Database interval is not active.');
		}
	}

	public closeConnection(): void {
		if (this.mysqlConnection) {
			this.mysqlConnection.end();
		}
	}

	public async insertVideoData(timestampMs: number, videoTimeSec: number, videoUrl: string): Promise<void> {
		return new Promise((resolve, reject) => {
			// this.mysqlConnection.connect();
			// const videoUrl = OpenViduService.getInstance().getCurrentRecordingUrl();
			// if(!videoUrl) {
			// 	videoTimeSec = -1;
			// }
			const data = {
				graph_timestamp: this.getDateTime(timestampMs),
				video_time_seconds: videoTimeSec,
				video_url: videoUrl,
			};
			const query = `INSERT INTO ${DB_VIDEO_TABLE} SET ?`;
			this.mysqlConnection.query(query, data, (error, results, fields) => {
				if (error) {
					console.error('Error inserting data:', error);
					reject(error);
					return;
				}
				console.log('Data inserted successfully in video table.', data);
			});
			// this.mysqlConnection.end();
			resolve();
		});
	}

	public async insertMetricData(timestampMs: number): Promise<void> {
		return new Promise((resolve, reject) => {
			const data = {
				graph_timestamp: this.getDateTime(timestampMs),
				value: Math.floor(Math.random() * 100) + 1,
			};
			const query = `INSERT INTO ${DB_METRIC_TABLE} SET ?`;
			this.mysqlConnection.query(query, data, (error, results, fields) => {
				if (error) {
					console.error('Error inserting data:', error);
					reject(error);
					return;
				}
				console.log('Data inserted successfully in metric table.', data);
			});
			// this.mysqlConnection.end();
			resolve();
		});
	}

	private getDateTime(timestampMs: number): string {
		return new Date(timestampMs).toISOString().slice(0, 19).replace('T', ' ');
	}
}
