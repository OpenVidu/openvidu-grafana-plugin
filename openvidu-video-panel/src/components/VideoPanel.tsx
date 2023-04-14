import {
  ArrayVector,
  BusEventWithPayload,
  DataFrame,
  DataHoverClearEvent,
  DataHoverEvent,
  DataHoverPayload,
  DataSelectEvent,
  LegacyGraphHoverEvent,
  LegacyGraphHoverEventPayload,
  PanelProps,
  Vector,
} from '@grafana/data';
import { RefreshEvent } from '@grafana/runtime';
import React, { useEffect, useRef, useState } from 'react';
import { Subscription, throttleTime } from 'rxjs';
import { VideoOptions } from 'types';

interface Props extends PanelProps<VideoOptions> {}

class MyHoverEvent extends BusEventWithPayload<DataHoverPayload> {
  static type = 'data-hover';
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
  //TODO: Improve all variables names

  const url = 'public/plugins/openvidu-video-panel/videos/sample.mp4';

  const [timestampState, setTimestampState] = useState(-1);
  const [valueState, setValueState] = useState(-1);

  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef: React.MutableRefObject<HTMLVideoElement> = useRef(null as any);

  const [startDate, setStartDate] = useState(timeRange.from.toDate());
  const [endDate, setEndDate] = useState(timeRange.to.toDate());

  onChangeTimeRange = (timeRange: any) => {
    console.log('onChangeTimeRange', timeRange);
  };

  useEffect(() => {
    // const subscriber = eventBus.getStream(RefreshEvent).subscribe(event => {
    //   console.log(`Received event: ${event.type}`);
    // });

    const subs = new Subscription();
    subs.add(
      eventBus.getStream(MyHoverEvent).subscribe({
        next: (e) => {
          console.log('DataHoverEvent: ', e.payload);
          const { data, rowIndex } = e.payload;
          handleDataHoverEvent(data, rowIndex);
        },
      })
    );
    // subs.add(eventBus.getStream(DataHoverClearEvent).subscribe({ next: () => console.log('DataHoverClearEvent') }));

    subs.add(
      eventBus.getStream(LegacyGraphHoverEvent).subscribe((e) => {
        console.log('LegacyGraphHoverEvent: ', e);
        handleLegacyDataHoverEvent(e.payload);
      })
    );

    // subs.add(eventBus.getStream(ZoomOutEvent).subscribe({ next: () => console.log('ZoomOutEvent') }));

    return () => {
      subs.unsubscribe();
      // subscriber.unsubscribe();
      // subscriber2.unsubscribe();
    };
  }, [eventBus]);

  useEffect(() => {
    console.log('VideoPanel DATA: ', data);
    console.log('VideoPanel OPTIONS: ', options);

    console.warn('VideoPanel from: ', startDate);
    console.warn('VideoPanel to: ', endDate);
  }, [data, options, startDate, endDate]);

  function handleDataHoverEvent(series: DataFrame | undefined, rowIndex = 0) {
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
      // const columnIndex = event.payload.columnIndex;

      const timestamp = timeArray.get(rowIndex);
      const value = valueArray.get(rowIndex);

      if (timestamp) {
        setTimestampState(timestamp);
        setValueState(value);

        const myPanelTimestampArray = data.series[0].fields[0].values.toArray();
        const index = myPanelTimestampArray.indexOf(timestamp);

        const myPanelValue = data.series[0].fields[1].values.toArray();
        const secondsTimestamp = myPanelValue[myPanelValue.length - index];

        if (secondsTimestamp && secondsTimestamp > 0) {
          videoRef.current.currentTime = secondsTimestamp;
        }
      }
    }
  }

  function handleLegacyDataHoverEvent(data: LegacyGraphHoverEventPayload) {
    setTimestampState(data?.point?.time ?? -1);
    setValueState(data?.pos?.y ?? -1);
  }

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

  function formatTimestamp(timestamp: number) {
    // Format timestamp HH:mm:ss using Date
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour12: false,
    });
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
          <div>Timestamp: {formatTimestamp(timestampState)}</div>
          <div>Value: {renderValue(valueState)}</div>
          <video ref={videoRef} src={url} width={width / 2} height={height / 2} />
        </div>
      )}
    </div>
  );
};
