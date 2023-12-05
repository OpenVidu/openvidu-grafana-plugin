# RTSP Application

## Requirements

Ensure that the following technologies are installed on your computer:

- NodeJS and npm
- An RTSP camera connected to the same network as your computer
- Docker Compose is running (refer to the [README.md](../README.md) file for instructions)

## Running the Application

1. Install the rtsp-application project dependencies:

```bash
npm install
```

2. Build the rtsp-application project:

```bash
npm run build
```

3. Run the rtsp-application project with default configuration:

```bash
cd dist
node app.js
```

To customize the configuration, set environment variables to override default values. For example, change the server port and recording duration:

```bash
SERVER_PORT=3000 RECORDING_DURATION_SECONDS=10 node app.js
```

Visit [http://localhost:5000](http://localhost:5000) to check if the RTSP camera is successfully published.

## Configuration

The application can be configured in the [config.ts](./src/config.ts) file.

| Property                         | Default Value                 | Description                                     |
| -------------------------------- | ----------------------------- | ----------------------------------------------- |
| SERVER_PORT                      | 5000                          | Port for the server                             |
| OPENVIDU_URL                     | 'http://localhost:4443/'      | OpenVidu server URL                             |
| OPENVIDU_SECRET                  | 'MY_SECRET'                   | OpenVidu secret                                 |
| SESSION_NAME                     | 'RTSP_Session'                | Session name                                    |
| RTSP_CAMERAS_URLS                | 'rtsp://192.168.1.38/stream1' | RTSP Cameras URLs                               |
| RTSP_CAMERA_USERNAME             | 'openvidu'                    | RTSP Camera username                            |
| RTSP_CAMERA_PASSWORD             | 'openvidu'                    | RTSP Camera password                            |
| RECORDING_DURATION_SECONDS       | 15                            | Duration of each recording in seconds           |
| DATA_GENERATION_STATUS           | 'ENABLED'                     | Status of data generation (ENABLED or DISABLED) |
| DATA_GENERATION_INTERVAL_SECONDS | 5                             | Interval between data generation in seconds     |
| DB_HOSTNAME                      | '0.0.0.0'                     | Database hostname                               |
| DB_USERNAME                      | 'root'                        | Database username                               |
| DB_PASSWORD                      | 'password'                    | Database password                               |
| DB_NAME                          | 'grafana_db'                  | Database name                                   |
| DB_VIDEO_TABLE                   | 'video_data'                  | Database table for video data                   |
| DB_METRIC_TABLE                  | 'metric_data'                 | Database table for metric data                  |

### RTSP Cameras Configuration

The application leverages RTSP cameras to publish video content during sessions. The URLs for RTSP cameras can be configured in the [config.ts](./src/config.ts) file.

```ts
export const RTSP_CAMERAS_URLS =
  process.env.RTSP_CAMERAS_URLS || 'rtsp://192.168.1.38/stream1,rtsp://192.168.1.38/stream2';
export const RTSP_CAMERA_USERNAME = process.env.RTSP_CAMERA_USERNAME || 'openvidu';
export const RTSP_CAMERA_PASSWORD = process.env.RTSP_CAMERA_PASSWORD || 'openvidu';
```

The `RTSP_CAMERAS_URLS` parameter enables the configuration of RTSP camera URLs separated by commas. Each camera typically provides two streams: one for high resolution (stream1) and another for low resolution (stream2). Note that the camera's IP address is dynamically assigned by the router, and you must verify it using the TAPO application to correctly set the RTSP cameras URLs.

For security, the `RTSP_CAMERA_USERNAME` and `RTSP_CAMERA_PASSWORD` parameters should be configured using the TAPO official application to set the RTSP credentials securely.

### Recording

The application uses OpenVidu to record the session where the RTSP cameras will be published. The recorded video is stored in the `recordings` folder, inside the `rtsp-application/` directory.

The recording feature allows to record the session and save it to a .mp4 file. **The recording is started when the node process start** and stopped when the node process is stopped.

The `RECORDING_DURATION_SECONDS` parameter allows to set the duration of each recording in seconds.

### Database

The application uses a MySQL database to store the data. The `DB_HOSTNAME`, `DB_USERNAME`, `DB_PASSWORD` and `DB_NAME` parameters must be configured with the database credentials.

The database is created automatically when the application is started
If the `DATA_GENERATION_STATUS` parameter is set to `ENABLED`, the application will generate random data and store it in the database. The `DATA_GENERATION_INTERVAL_SECONDS` parameter allows to set the interval between data generation in seconds.

It will create two tables:

- **video_data**: stores the metadata of the videos (`graph_timestamp` in miliseconds, `video_time_seconds` which represents the second of the video and `video_url` which is the url of the video)

```sql
SELECT
  graph_timestamp AS "time",
  video_time_seconds,
  video_url
FROM video_data
ORDER BY time
```

- **metric_data**: stores the random data for printing time series panel on grafana dashboard (`graph_timestamp` same values to video_metadata table and `value` which is a random number)

```sql
SELECT
  graph_timestamp AS "time",
  value
FROM metric_data
ORDER BY time
```

The `DB_VIDEO_TABLE` and `DB_METRIC_TABLE` parameters allows to set the name of the tables for video data and metric data respectively.
