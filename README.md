# openvidu-grafana-plugin

> WARN: This custom plugin has been only tested with an **unique video player**. It is not tested with multiple video players and it may not work properly.

> WARN: This custom plugin **only works with Time Series Panel**

## Description

This project is a sample of how to integrate OpenVidu with Grafana.

It has the following components inside of a Docker container:

> All the configuration is in the [docker-compose.yml](docker/docker-compose.yml) file

- [openvidu-server](./openvidu-server/): OpenVidu server which will be used to publish the RTSP Camera.
- [MySQL](./mysql/): Database used to store the data of the video panel and datasource for data panels.
- [Grafana](./grafana/): Grafana dashboard connected to a MySQL database and with the openvidu-video-panel plugin installed.


It also has the app component outside of the Docker container:

- [RTSP Application](./rtsp-application/): NodeJS application which automatically publish the RTSP Camera into a session and record it to a .mp4 file. It also generates random data for the data panels.


## Requirements

The following technologies must be installed in your computer

- Docker Compose
- NodeJS and npm
- yarn: `npm install --global yarn`

## Run this sample

For running the openvidu-server, MySQL and Grafana, you can follow the next steps:

Under the root path:

```bash
docker compose -f docker/docker-compose.yml up
```

Once every service is ready, you can access to the grafana dashboad on [localhost:3000](http://localhost:3000/d/2xkhR8Y4k/openvidu_dashboard?orgId=1)


For running the RTSP Application, you can check the [README.md](./rtsp-application/README.md) file.


## Features

- **Video panel**: allows to play and pause a video.
- **Video connected to the TimeSeries panel**: When hovering over the time series panel, the video will be updated to the time of the hovered point.
- **Rewind button**: allows to rewind the video to 10 seconds ago.
- **Forward button**: allows to forward the video to 10 seconds later.
- **Video panel with annotations**: allows to add a marker to the time series panel in the current time of the video.

- **Skip to next annotation**: allows to skip to the next annotation in the time series panel.
- **Skip to previous annotation**: allows to skip to the previous annotation in the time series panel.
- **Annotation progress**: when video is playing the annotation progress will be updated and it is represented by a red line in the time series panel.

## Screenshots

![Home](docs/1.png 'Home')

![Annotations](docs/2.png 'Annotations')

## Video sample

<h3>OpenVidu Grafana Plugin Video</h3>

<a href="https://github.com/OpenVidu/openvidu-grafana-plugin/raw/master/docs/openvidu-grafana.mp4">Download</a>

<video controls>
  <source src="docs/openvidu-grafana.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>


<h3>RTSP Application Video</h3>

<a href="https://github.com/OpenVidu/openvidu-grafana-plugin/raw/master/docs/rtsp-application-tutorial.mp4">Download</a>

<video controls>
  <source src="docs/rtsp-application-tutorial.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Plugin integration

For integrating the openvidu video panel to your own grafana dashboard, you can follow the next steps:

As we are using Docker, we have add a [volume to the docker-compose file](https://github.com/OpenVidu/openvidu-grafana-plugin/blob/b477320162bbf47f99603190d620f57b10a1ad03/docker/docker-compose.yml#L38)

If you don't use docker, you can follow the next steps:

Copy the [openvidu-video-panel](openvidu-video-panel) folder to your grafana plugins folder. By default, it is located in `/var/lib/grafana/plugins` in Linux and `C:\Program Files\GrafanaLabs\grafana\data\plugins` in Windows.
