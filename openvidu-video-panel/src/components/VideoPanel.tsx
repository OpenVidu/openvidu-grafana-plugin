import {
  ArrayVector,
  DataFrame,
  DataHoverClearEvent,
  DataHoverEvent,
  LegacyGraphHoverEvent,
  LegacyGraphHoverEventPayload,
  PanelProps,
  Vector,
} from '@grafana/data';
import { RefreshEvent } from '@grafana/runtime';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Subscription } from 'rxjs';
import { VideoOptions } from 'types';
import axios from 'axios';
import './VideoPanel.css';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FlagIcon from '@mui/icons-material/Flag';
import Forward10TwoToneIcon from '@mui/icons-material/Forward10TwoTone';
import Replay10Icon from '@mui/icons-material/Replay10';
import Tooltip from '@mui/material/Tooltip';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';

interface Props extends PanelProps<VideoOptions> {}
interface AnnotationData {
  // dashboardUID: '2xkhR8Y4k',
  isRegion: boolean;
  time: number;
  timeEnd: number;
  tags: string[];
  dashboardId: number;
  panelId: number;
  text: string;
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
  const videoUrl = 'public/plugins/openvidu-video-panel/videos/sample.mp4';

  const [timestampEvent, setTimestampEvent] = useState(-1);
  const [dataValueEvent, setDataValueEvent] = useState(-1);

  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);

  const [isMyVideoPlaying, setIsMyVideoPlaying] = useState(false);
  const videoRef: React.MutableRefObject<HTMLVideoElement> = useRef(null as any);

  onChangeTimeRange = (timeRange: any) => {
    console.log('onChangeTimeRange', timeRange);
  };

  useEffect(() => {
    console.log('VideoPanel DATA: ', data);
    console.log('VideoPanel OPTIONS: ', options);
  }, [data, options]);

  const setVideoTime = useCallback(
    (time: number | undefined = 0) => {
      videoRef.current.currentTime = time;
    },
    [videoRef]
  );

  const setCurrentVideoTimeFromTimestampEvent = useCallback(
    (timestamp: any) => {
      const myPanelDataTime = data.series[0].fields[0].values.toArray();
      const myPanelDataValue = data.series[0].fields[1].values.toArray(); // seconds

      const index = myPanelDataTime.indexOf(timestamp);
      if (index > -1) {
        const seconds = myPanelDataValue[myPanelDataValue.length - index];
        setVideoTime(seconds);
      }
    },
    [data.series, setVideoTime]
  );

  const handleDataHoverEvent = useCallback(
    (series: DataFrame | undefined, rowIndex = 0) => {
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
        const timestamp = timeArray.get(rowIndex);
        const value = valueArray.get(rowIndex);

        if (timestamp) {
          setTimestampEvent(timestamp);
          setDataValueEvent(value);
          setCurrentVideoTimeFromTimestampEvent(timestamp);
        }
      }
    },
    [setCurrentVideoTimeFromTimestampEvent]
  );
  const handleLegacyDataHoverEvent = useCallback((data: LegacyGraphHoverEventPayload) => {
    setTimestampEvent(data?.point?.time ?? -1);
    setDataValueEvent(data?.pos?.y ?? -1);
  }, []);

  useEffect(() => {
    const subs = new Subscription();
    // const subscriber = eventBus.getStream(RefreshEvent).subscribe(event => {
    //   console.log(`Received event: ${event.type}`);
    // });

    // subs.add(eventBus.getStream(DataHoverClearEvent).subscribe({ next: () => console.log('DataHoverClearEvent') }));

    // subs.add(eventBus.getStream(ZoomOutEvent).subscribe({ next: () => console.log('ZoomOutEvent') }));

    subs.add(
      eventBus.getStream(DataHoverEvent).subscribe({
        next: (e) => {
          // console.log('DataHoverEvent: ', e.payload);
          const { data, rowIndex } = e.payload;
          handleDataHoverEvent(data, rowIndex);
        },
      })
    );

    subs.add(
      eventBus.getStream(LegacyGraphHoverEvent).subscribe((e) => {
        // console.log('LegacyGraphHoverEvent: ', e);
        handleLegacyDataHoverEvent(e.payload);
      })
    );

    return () => {
      subs.unsubscribe();
    };
  }, [eventBus, handleDataHoverEvent, handleLegacyDataHoverEvent]);

  const forwardTenSeconds = useCallback(() => {
    setVideoTime(videoRef.current.currentTime + 10);
  }, [videoRef, setVideoTime]);

  const rewindTenSeconds = useCallback(() => {
    setVideoTime(videoRef.current.currentTime - 10);
  }, [videoRef, setVideoTime]);

  const skipToNextAnnotation = useCallback(() => {
    const myPanelDataTime = data.series[0].fields[0].values.toArray(); // timestamp
    const myPanelDataValue = data.series[0].fields[1].values.toArray(); // seconds

    const elementIndex = myPanelDataValue.findIndex((value) => value === Math.trunc(videoRef.current.currentTime));
    const currentVideoTime = myPanelDataTime[myPanelDataTime.length - elementIndex];

    const nextAnnotation = annotations.find((annotation) => annotation.time > currentVideoTime);
    if (nextAnnotation) {
      setCurrentVideoTimeFromTimestampEvent(nextAnnotation.time);
    }
  }, [annotations, setCurrentVideoTimeFromTimestampEvent, videoRef, data.series]);

  const skipToPreviousAnnotation = useCallback(() => {
    const myPanelDataTime = data.series[0].fields[0].values.toArray(); // timestamp
    const myPanelDataValue = data.series[0].fields[1].values.toArray(); // seconds

    const elementIndex = myPanelDataValue.findIndex((value) => value === Math.trunc(videoRef.current.currentTime));
    const currentVideoTime = myPanelDataTime[myPanelDataTime.length - elementIndex];

    const filteredAnnotations = annotations.filter((annotation) => annotation.time < currentVideoTime);
    const previousAnnotation: AnnotationData | undefined = filteredAnnotations.pop();

    if (previousAnnotation) {
      setCurrentVideoTimeFromTimestampEvent(previousAnnotation.time);
      return;
    }
  }, [annotations, data.series, setCurrentVideoTimeFromTimestampEvent, videoRef]);

  const handlePlay = useCallback(() => {
    videoRef.current?.play();
    setIsMyVideoPlaying(true);
  }, [videoRef]);

  const handlePause = useCallback(() => {
    videoRef.current?.pause();
    setIsMyVideoPlaying(false);
  }, [videoRef]);

  const renderValue = useCallback((value: any) => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return value;
  }, []);

  const formatTimestamp = useCallback((timestamp: number) => {
    // Format timestamp HH:mm:ss using Date
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour12: false,
    });
  }, []);

  const refreshDashboard = useCallback(() => {
    eventBus.publish(new RefreshEvent());
  }, [eventBus]);

  const findAnnotation = useCallback(async (): Promise<AnnotationData[]> => {
    const url = '/api/annotations';
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await axios.get(url, { headers });
      console.log('response', response);
      return response.data;
    } catch (error) {
      console.log('error', error);
      return [];
    }
  }, []);

  const createAnnotation = useCallback(async (): Promise<void> => {
    const url = '/api/annotations';
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    const data: AnnotationData = {
      // dashboardUID: '2xkhR8Y4k',
      isRegion: false,
      time: timestampEvent,
      timeEnd: 0,
      tags: ['openvidu'],
      dashboardId: 1,
      panelId: 10,
      text: 'Test Annotation',
    };

    try {
      const response = await axios.post(url, data, { headers });
      console.log('response', response);
      setAnnotations([...annotations, response.data]);
      refreshDashboard();
    } catch (error) {
      console.log('error', error);
    }
  }, [timestampEvent, annotations, refreshDashboard]);

  useEffect(() => {
    findAnnotation().then((annotations) => {
      setAnnotations(annotations);
    });

    return () => {
      setAnnotations([]);
    };
  }, [findAnnotation]);

  return (
    <div className="video-panel">
      {!timestampEvent || !dataValueEvent ? (
        <div>NO DATA event</div>
      ) : (

        <div>
          {/* <div>Timestamp: {formatTimestamp(timestampEvent)}</div>
          <div>Value: {renderValue(dataValueEvent)}</div> */}
          <video
            ref={videoRef}
            src={videoUrl}
            width={width}
            height={height / 1.5}
            controls
            disablePictureInPicture
            controlsList="nodownload noplaybackrate"
            onPlaying={() => setIsMyVideoPlaying(true)}
            onPause={() => setIsMyVideoPlaying(false)}
          />
          <div className="controls">
            <Tooltip title="Rewind 10 seconds">
              <IconButton onClick={rewindTenSeconds} size="large">
                <Replay10Icon fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title={isMyVideoPlaying ? 'Pause video' : 'Play Video'}>
              <IconButton className="icon-btn" onClick={isMyVideoPlaying ? handlePause : handlePlay} size="large">
                {isMyVideoPlaying ? <PauseIcon fontSize="inherit" /> : <PlayArrowIcon fontSize="inherit" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Forward 10 seconds">
              <IconButton onClick={forwardTenSeconds} size="large">
                <Forward10TwoToneIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Skip to previous mark">
              <IconButton onClick={skipToPreviousAnnotation} size="large">
                <SkipPreviousIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Skip to next mark">
              <IconButton onClick={skipToNextAnnotation} size="large">
                <SkipNextIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Add mark">
              <IconButton color="secondary" onClick={createAnnotation} size="large">
                <FlagIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};
