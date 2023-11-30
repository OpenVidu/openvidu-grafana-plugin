var OV;
var session;

var token;
var numVideos = 0;


async function subscribe() {

	// Initialize OpenVidu and Session objects
	OV = new OpenVidu();
	session = OV.initSession();

	// On every new Stream received...
	session.on('streamCreated', event => {
		var videosContainer = document.getElementById('cameras-container');
		var videoDiv = document.createElement('div');

		var stream = event.stream;
		videoDiv.classList.add('video-container');
		videoDiv.id = stream.streamId;
		videosContainer.appendChild(videoDiv);
		// Append video inside our brand new <div> element
		var subscriber = session.subscribe(stream, videoDiv);

		// When the HTML video has been appended to DOM...
		subscriber.on('videoElementCreated', ev => {
			// ...append camera name on top of video
			var cameraName = document.createElement('div');
			cameraName.innerText = stream.connection.data;
			cameraName.classList.add('camera-name');
			ev.element.parentNode.insertBefore(cameraName, ev.element);
			// ...start loader
			var loader = document.createElement('div');
			loader.classList.add('loader');
			ev.element.parentNode.insertBefore(loader, ev.element.nextSibling);
		});

		// When the HTML video starts playing...
		subscriber.on('streamPlaying', ev => {
			// ...remove loader
			var cameraVideoElement = subscriber.videos[0].video;
			cameraVideoElement.parentNode.removeChild(cameraVideoElement.nextSibling);
			// ... mute video if browser blocked autoplay
			autoplayMutedVideoIfBlocked(cameraVideoElement);
		});

		// When the HTML video has been removed from DOM...
		subscriber.on('videoElementDestroyed', ev => {
			// ...remove the HTML elements related to the destroyed video
			var videoContainer = document.getElementById(stream.streamId);
			videoContainer.parentNode.removeChild(videoContainer);
		});
	});

	// On every asynchronous exception...
	session.on('exception', (exception) => {
		console.warn(exception);
	});


	try {

		token = await getToken();
		await session.connect(token);

		document.getElementById('application-form').style.display = 'none';
		document.getElementById('unsubscribe-btn').disabled = false;
		document.getElementById('subscribe-btn').disabled = true;

	} catch (error) {
		var msg = 'There was an error connecting to the session. Code: ' + error.code + '. Message: ' + error
			.message;
		console.error(msg);
		alert(msg);
	}

}

function unsubscribe() {
	if (!!session) {
		session.disconnect();
		session = null;
		// forceUnpublishCameras();
	}
	document.getElementById('unsubscribe-btn').disabled = true;
	document.getElementById('subscribe-btn').disabled = false;
	document.getElementById('cameras-container').innerHTML = '';
	document.getElementById('application-form').style.display = 'block';
}

function autoplayMutedVideoIfBlocked(video) {
	// Browser can block video playback if it is auto played without user interaction
	// One solution is to mute the video and let the user know
	video.controls = true;
	var promise = video.play();
	if (promise !== undefined) {
		promise.then(() => {
			// Autoplay started
		}).catch(error => {
			// The video must play muted until user hits play button
			video.muted = true;
			video.play();
		});
	}
}






/* APPLICATION REST METHODS */

async function getToken() {

	// var recordingDuration = document.getElementById("recordingDuration").value || 0;
	// var dataIntervalSelect = document.getElementById("dataIntervalSelect");
	// var dataInterval = dataIntervalSelect.value || 0;

	// const body = {
	// 	recordingDuration: recordingDuration > 0 ? recordingDuration : undefined,
	// 	dataInterval: dataInterval > 0 ? dataInterval : undefined
	// };

	const response = await httpRequest(
		'POST',
		'openvidu/token', {}, 'Token Error');

	token = response.token;
	console.warn('Request of TOKEN gone WELL (TOKEN:' + token + ')');
	return token;
}

// async function forceUnpublishCameras() {
// 	try {
// 		const response = await httpRequest(
// 			'DELETE',
// 			'openvidu/cameras', {}, 'Force unpublish WRONG');

// 		console.warn('Force unpublish gone WELL');
// 	} catch (error) {
// 		console.error('Force unpublish WRONG', error);
// 	}
// }


async function httpRequest(method, url, body, errorMsg) {
	try {

		const response = await fetch(url, {
			method: method,
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			throw new Error(errorMsg + ' (' + response.status + ')');
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.warn(error.message);
		console.warn(error);
		// Reject the Promise with the error
		throw error;
	}
}


// function stopRecording() {
// 	var forceRecordingId = document.getElementById('forceRecordingId').value;
// 	httpRequest(
// 		'POST',
// 		'recording-node/api/recording/stop', {
// 		recording: forceRecordingId
// 	},
// 		'Stop recording WRONG',
// 		res => {
// 			console.log(res);
// 		}
// 	);
// }

// function deleteRecording() {
// 	var forceRecordingId = document.getElementById('forceRecordingId').value;
// 	httpRequest(
// 		'DELETE',
// 		'recording-node/api/recording/delete', {
// 		recording: forceRecordingId
// 	},
// 		'Delete recording WRONG',
// 		res => {
// 			console.log("DELETE ok");
// 		}
// 	);
// }

// function getRecording() {
// 	var forceRecordingId = document.getElementById('forceRecordingId').value;
// 	httpRequest(
// 		'GET',
// 		'recording-node/api/recording/get/' + forceRecordingId, {},
// 		'Get recording WRONG',
// 		res => {
// 			console.log(res);
// 		}
// 	);
// }

// function listRecordings() {
// 	httpRequest(
// 		'GET',
// 		'recording-node/api/recording/list', {},
// 		'List recordings WRONG',
// 		res => {
// 			console.log(res);
// 		}
// 	);
// }

/* APPLICATION REST METHODS */


window.onbeforeunload = () => {
	unsubscribe();
}
