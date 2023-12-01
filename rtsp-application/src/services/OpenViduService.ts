import {
	Connection,
	ConnectionProperties,
	ConnectionType,
	OpenVidu,
	OpenViduRole,
	Recording,
	RecordingLayout,
	RecordingMode,
	Session,
	SessionProperties,
} from 'openvidu-node-client';
import {
	OPENVIDU_SECRET,
	OPENVIDU_URL,
	RTSP_CAMERAS_URLS,
	RTSP_CAMERA_USERNAME,
	RTSP_CAMERA_PASSWORD,
	RECORDING_DURATION_SECONDS,
	DATA_GENERATION_STATUS
} from '../config';
import { DBService } from './DBService';



export class OpenViduService {
	protected static instance: OpenViduService;
	private openvidu: OpenVidu;
	private session: Session;
	private cameraConnections: Connection[] = [];
	private ipCameras: { name: string; uri: string }[] = [];
	private recording: Recording | null = null;
	private recordingTimeout: NodeJS.Timeout | null = null;
	private dbService: DBService = DBService.getInstance();

	private constructor() {
		console.log('Creating OpenViduService instance...');
		this.openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);
		if (process.env.NODE_ENV === 'production') this.openvidu.enableProdMode();
		this.ipCameras = RTSP_CAMERAS_URLS.split(',').map((uri, index) => {
			const url = new URL(uri);
			url.username = RTSP_CAMERA_USERNAME;
			url.password = RTSP_CAMERA_PASSWORD;

			return {
				name: `Camera ${url.toString().includes('stream1') ? 'Hight Quality' : 'Low Quality'}`,
				uri: url.toString(),
			};
		});
	}

	static getInstance() {
		if (!OpenViduService.instance) {
			OpenViduService.instance = new OpenViduService();
		}
		return OpenViduService.instance;
	}

	public async createSession(sessionId: string): Promise<Session> {
		console.log('Creating session: ', sessionId);
		let sessionProperties: SessionProperties = {
			customSessionId: sessionId,
			recordingMode: RecordingMode.MANUAL,
			defaultRecordingProperties: {
				outputMode: Recording.OutputMode.COMPOSED,
				hasAudio: true,
				hasVideo: true,
				resolution: '640x480',
				frameRate: 25,
				recordingLayout: RecordingLayout.BEST_FIT,
			},
		};
		this.session = await this.openvidu.createSession(sessionProperties);
		// await this.session.fetch();
		return this.session;
	}

	async closeSession(): Promise<void> {
		if (this.session) {
			await this.session.close();
			this.session = null;
		}
	}

	public async createConnection(session: Session, nickname: string, role: OpenViduRole): Promise<Connection> {
		console.log(`Requesting token for session ${session.sessionId}`);
		let connectionProperties: ConnectionProperties = { role };
		if (!!nickname) {
			connectionProperties.data = JSON.stringify({
				openviduCustomConnectionId: nickname,
			});
		}
		console.log('Connection Properties:', connectionProperties);
		const connection = await session.createConnection(connectionProperties);

		return connection;
	}

	public async publishCameras(): Promise<void> {
		const connPromises: Promise<Connection>[] = [];

		this.ipCameras.forEach(async (camera) => {
			const connectionProperties: ConnectionProperties = {
				type: ConnectionType.IPCAM,
				rtspUri: camera.uri,
				adaptativeBitrate: true,
				onlyPlayWithSubscribers: false,
				networkCache: 1000,
				data: JSON.stringify({
					name: camera.name,
				}),
			};

			connPromises.push(this.session.createConnection(connectionProperties));
		});

		try {
			console.log('Publishing cameras...');
			this.cameraConnections = await Promise.all(connPromises);
			console.log('IP cameras puslibhed: ', this.ipCameras);
		} catch (error) {
			console.error(error);
		}
	}

	public async forceDisconnectCameras(): Promise<void> {
		const promises = [];
		if (this.session) {
			this.cameraConnections.forEach((connection) => {
				promises.push(this.session.forceDisconnect(connection));
			});
			this.cameraConnections = [];

			await Promise.all(promises);
		}
	}

	async startChunkRecording(): Promise<void> {
		if (this.session.activeConnections.length === 0) return;

		try {
			const duration = Number(RECORDING_DURATION_SECONDS);
			console.log(`Starting a ${duration}s recording...`);
			this.recording = await this.openvidu.startRecording(this.session.sessionId);
			if (DATA_GENERATION_STATUS === 'ENABLED') {
				const videoUrl = this.getCurrentRecordingUrl();
				// Start generating data once the recording is started
				this.dbService.startDataGenerationWithInterval(this.recording.createdAt, videoUrl);

				// Insert first video data
				await this.dbService.insertVideoData(this.recording.createdAt, 0, videoUrl);

				// Insert first metric data
				await this.dbService.insertMetricData(this.recording.createdAt);
			}

			this.recordingTimeout = setTimeout(async () => {
				console.log(`${duration}s have elapsed!`);
				await this.stopRecording();
				this.recording = null;
			}, duration * 1000);
		} catch (error) {
			console.error('Error starting recording:', error);
		}
	}

	async stopRecording(): Promise<void> {
		console.log(`Stopping recording...`);
		const recordingId = this.recording?.id;
		this.recording = null;
		clearTimeout(this.recordingTimeout);
		this.recordingTimeout = null;
		if (recordingId) await this.openvidu.stopRecording(recordingId);
	}


	// public deleteRecording(recordingId: string): Promise<Error> {
	// 	return this.openvidu.deleteRecording(recordingId);
	// }
	// public getRecording(recordingId: string): Promise<Recording> {
	// 	return this.openvidu.getRecording(recordingId);
	// }

	isRecording(): boolean {
		return !!this.recording;
	}

	getCurrentRecordingUrl(): string {
		if (this.recording) {
			return `${OPENVIDU_URL}openvidu/recordings/${this.recording.id}/${this.recording.id}.mp4`;
		}
		return '';
	}

	// public async listAllRecordings(): Promise<Recording[]> {
	// 	console.log('last recording', await this.openvidu.getRecording(this.recording?.id || ''));
	// 	console.log('all recordings', await this.openvidu.listRecordings());
	// 	return await this.openvidu.listRecordings();
	// }
}
