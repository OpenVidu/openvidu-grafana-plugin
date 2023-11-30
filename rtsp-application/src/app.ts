import * as dotenv from 'dotenv';
import * as express from 'express';
import { app as openviduController } from './controllers/OpenviduController';
import * as chalk from 'chalk';
import {
	RTSP_CAMERA_PASSWORD,
	RTSP_CAMERA_USERNAME,
	MODE,
	OPENVIDU_SECRET,
	OPENVIDU_URL,
	RECORDING_DURATION_SECONDS,
	RTSP_CAMERAS_URLS,
	SERVER_PORT,
	SESSION_NAME
} from './config';
import { OpenViduService } from './services/OpenViduService';
import { DBService } from './services/DBService';

dotenv.config();
const app = express();

app.use(express.static(__dirname + '/public'));


app.use(express.json());
app.use('/openvidu', openviduController);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
app.listen(SERVER_PORT, async () => {
	const credential = chalk.yellow;
	const text = chalk.cyanBright;

	console.log(' ');
	console.log('---------------------------------------------------------');
	console.log(' ');
	console.log('Server is listening on port', text(SERVER_PORT));
	console.log(' ');
	console.log('---------------------------------------------------------');
	console.log('OPENVIDU URL: ', text(OPENVIDU_URL));
	console.log('OPENVIDU SECRET: ', credential(OPENVIDU_SECRET));
	console.log('RTSP_CAMERAS_URLS', text(RTSP_CAMERAS_URLS));
	console.log('CAMERA_USERNAME', text(RTSP_CAMERA_USERNAME));
	console.log('CAMERA_PASSWORD', text(RTSP_CAMERA_PASSWORD));
	console.log('RECORDING DURATION (seconds)', text(RECORDING_DURATION_SECONDS) + 's');
	console.log('---------------------------------------------------------');
	console.log(' ');

	if(MODE === 'AUTO') {
		console.log(' ');
		console.log('---------------------------------------------------------');
		console.log(' ');
		console.log('Recording and Data creation will start automatically each ', text(RECORDING_DURATION_SECONDS) + 's');
		console.log(' ');
		try {
			await OpenViduService.getInstance().createSession(SESSION_NAME);

		} catch (error) {
			console.log('Error creating session or publishing cameras', error);
		}

	} else {
		// console.log(' ');
		// console.log('---------------------------------------------------------');
		// console.log(' ');
		// console.log('Recording and Data creation will start when you subscribe to the session cameras using the webapp (http://localhost:5000)');
		// console.log(' ');
		// console.log('---------------------------------------------------------');
		// console.log(' ');
	}
});

process.on('SIGINT', async  () => {

	console.log(' ');
	console.log('---------------------------------------------------------');
	console.log(' ');
	console.log('Stopping server...');
	await OpenViduService.getInstance().stopRecording();
	await OpenViduService.getInstance().forceDisconnectCameras();
	await OpenViduService.getInstance().closeSession();
	DBService.getInstance().stopDataGeneration();
	DBService.getInstance().closeConnection();
	console.log('Server stopped');
	console.log(' ');
	console.log('---------------------------------------------------------');
	console.log(' ');
	process.exit();
});
