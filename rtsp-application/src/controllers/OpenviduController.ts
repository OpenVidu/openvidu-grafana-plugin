import * as express from 'express';
import { Request, Response } from 'express';
import { OpenViduService } from '../services/OpenViduService';
import { OpenViduRole, Session } from 'openvidu-node-client';
import { DATA_GENERATION_STATUS, MODE, SESSION_NAME } from '../config';
import { DBService } from '../services/DBService';

const openviduService = OpenViduService.getInstance();
const dbService = DBService.getInstance();

export const app = express.Router({
	strict: true
});

app.post('/token', async (req: Request, res: Response) => {

	try {

		// const { recordingDuration, dataInterval } = req.body;

		let sessionCreated: Session = await openviduService.createSession(SESSION_NAME);
		const token = (await openviduService.createConnection(sessionCreated, 'manual_viewer', OpenViduRole.SUBSCRIBER)).token;

		return res.status(200).json({ token });

	} catch (error) {
		console.log(error);
		return res.status(500).send(error);
	}
});

app.delete('/cameras', async (req: Request, res: Response) => {
	try {
		await openviduService.forceDisconnectCameras();
	} catch (error) {
		console.log("Error disconnecting cameras", error);
	}
	res.status(200).send('Cameras disconnected'!);

});

app.post('/webhook', async (req: Request, res: Response) => {

	switch (req.body.event) {
		case 'recordingStatusChanged':

			if (req.body.status === 'ready') {
				// It is already stopped
				// Recording  has been successfully generated.
				console.log('Recording READY webhook received');
				await openviduService.startChunkRecording();
			} else if (req.body.status === 'started') {
				//The session is being recorded
				// Start counting time for the video
				// start generating metric data

				console.log('Recording STARTED webhook received');
			} else if (req.body.status === 'stopped') {
				// The recording has been stopped
				// The recording files are being processed
				console.log('Recording STOPPED webhook received');

				if(req.body.reason === 'lastParticipantLeft'){
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

			break;
		case 'sessionCreated':
			console.log('Session created webhook received');
			setTimeout(async () => {

				await openviduService.publishCameras();
				await openviduService.startChunkRecording();

			}, 1000);


			break;
		case 'sessionDestroyed':
			// console.log('Session destroyed webhook received');
			// console.log('Stopping recording...');
			// await openviduService.stopRecording();
			// if (DATA_GENERATION_STATUS === 'ENABLED') {
			// 	console.log('Stopping data generation...');
			// 	// await dbService.stopDataGeneration();
			// }

	}

	res.status(200).send('Webhook received'!);

});
