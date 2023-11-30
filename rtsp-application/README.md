
Start openvidu

docker run -p 4443:4443 --network host --rm \
    -e OPENVIDU_RECORDING=true \
	-e OPENVIDU_RECORDING_AUTOSTOP_TIMEOUT=0 \
	-e OPENVIDU_RECORDING_PUBLIC_ACCESS=true \
    -e OPENVIDU_WEBHOOK=true \
    -e OPENVIDU_WEBHOOK_ENDPOINT=http://localhost:5000/openvidu/webhook \
    -e OPENVIDU_WEBHOOK_EVENTS=["recordingStatusChanged","sessionCreated","sessionDestroyed"] \
    -e OPENVIDU_RECORDING_PATH=$PWD/recordings-ipcameras \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v $PWD/recordings-ipcameras:$PWD/recordings-ipcameras \
openvidu/openvidu-dev:2.29.0


La aplicacion tiene 2 modos

<!-- - **MANUAL**: donde la grabacion y el almacenamiento de datos sinteticos se realizará cuando un usuario entre en la sesion para ser las IP Cameras. (http://localhost:500)

```bash

``` -->

- **AUTO**: donde la grabacion y el almacenamiento de datos sinteticos se realizará de forma automatica. (http://localhost:5000)

```bash

```