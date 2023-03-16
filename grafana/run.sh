

docker run -p 3000:3000 --rm --network=host --name=grafana \
--volume "$PWD/grafana/storage:/var/lib/grafana" \
--volume "$PWD/grafana/custom.ini:/etc/grafana/grafana.ini" \
--volume "$PWD/openvidu-video-panel:/var/lib/grafana/plugins" \
grafana/grafana:9.4.3-ubuntu



