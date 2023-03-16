import { ArrayVector, BusEventWithPayload, DataHoverEvent, LegacyGraphHoverEvent, PanelProps, Vector } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import React, { useEffect, useRef, useState } from 'react';
import { VideoOptions } from 'types';

interface Props extends PanelProps<VideoOptions> {}

class ZoomOutEvent extends BusEventWithPayload<any> {
  static type = 'zoom-out';
}
export const VideoPanel: React.FC<Props> = ({
  options,
  data,
  timeRange,
  timeZone,
  width,
  height,
  onChangeTimeRange,
  eventBus,
}) => {
  // const theme = useTheme2();
  // const datapoints = series.fields[1].values.toArray();
  // const styles = useStyles2(getStyles);

  // const url = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';//options.url;
  // const url = 'public/plugins/openvidu-video-panel/videos/sample_metadata.mp4';

  const [timestampState, setTimestampState] = useState(-1);
  const [valueState, setValueState] = useState(-1);

  const [startDate , setStartDate] = useState(timeRange.from.toDate());
  const [endDate, setEndDate] = useState(timeRange.to.toDate());

  onChangeTimeRange = (timeRange: any) => {
    console.log('onChangeTimeRange', timeRange);
  };

  useEffect(() => {
    getAppEvents()
      .getStream(ZoomOutEvent)
      .subscribe((event) => {
        console.log(`Received event: ${event.type}`);
      });

    getAppEvents()
      .getStream(LegacyGraphHoverEvent)
      .subscribe((event) => {
        console.log(`Received LegacyGraphHoverEvent event: ${event.type}`);
      });

    eventBus.getStream(DataHoverEvent).subscribe((event) => {
      const series = event.payload.data;
      let timeArray: Vector<any> = new ArrayVector();
      let valueArray: Vector<any> = new ArrayVector();

      series?.fields.forEach((field) => {
        if (field.type === 'time') {
          timeArray = field.values;
        } else if (field.type === 'number' && field.name.toLocaleLowerCase() !== 'y') {
          valueArray = field.values;
        }
      });



      if (series) {
        const rowIndex = event.payload.rowIndex ?? 0;
        // const columnIndex = event.payload.columnIndex;

        setTimestampState(timeArray.get(rowIndex));
        setValueState(valueArray.get(rowIndex));
      }
    });
  }, []);

  // function for listening dashboard panel events

  useEffect(() => {
    console.log('VideoPanel DATA: ', data);
    console.log('VideoPanel OPTIONS: ', options);

    console.warn('VideoPanel from: ', startDate);
    console.warn('VideoPanel to: ', endDate);

  }, [data, options, startDate, endDate]);

  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef: React.MutableRefObject<HTMLVideoElement> = useRef(null as any);

  function handlePlay() {
    videoRef.current?.play();
    setIsPlaying(true);
  }

  function handlePause() {
    videoRef.current?.pause();
    setIsPlaying(false);
  }

  function renderValue(value: any) {
    // Check if the value is a number
    if (typeof value === 'number') {
      return value.toFixed(2);
    }

    // Otherwise, return the value as is
    return value;
  }

  return (
    <div className="video-panel" style={{ overflow: 'auto' }}>
      <div className="controls">
        {isPlaying ? <button onClick={handlePause}>Pause</button> : <button onClick={handlePlay}>Play</button>}
      </div>

      {!timestampState || !valueState ? (
        <div>NO DATA event</div>
      ) : (
        <div>
          <div>DATA event</div>
          {/* <h3>Origin: {state.origin.path}</h3> */}
          {/* <pre>{JSON.stringify(timestampState, null, '  ')}</pre> */}

          <div>Timestamp: {timestampState}</div>
          <div>Value: {renderValue(valueState)}</div>
        </div>
      )}
      {/* <video ref={videoRef} src={url} width={width} height={height} /> */}
    </div>
  );
};
