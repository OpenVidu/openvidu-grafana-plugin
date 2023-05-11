import { ArrayVector, DataFrame, DataHoverEvent, PanelProps, Vector } from '@grafana/data';
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
  id?: number;
  dashboardUID?: string;
  isRegion: boolean;
  time: number;
  timeEnd: number;
  tags: string[];
  dashboardId: number;
  panelId: number;
  text: string;
}

let videoProgressAnnotation: Partial<AnnotationData> = {};
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

  const [annotations, setAnnotations] = useState<Array<Partial<AnnotationData>>>([]);

  const [progressInterval, setProgressInterval] = useState<NodeJS.Timer>(null as any);

  const [isMyVideoPlaying, setIsMyVideoPlaying] = useState(false);
  const videoRef: React.MutableRefObject<HTMLVideoElement> = useRef(null as any);

  onChangeTimeRange = (timeRange: any) => {
    console.log('onChangeTimeRange', timeRange);
  };

  const refreshDashboard = useCallback(() => {
    eventBus.publish(new RefreshEvent());
  }, [eventBus]);

  const createAnnotation = useCallback(
    async (tags: string[]): Promise<Partial<AnnotationData>> => {
      const myPanelDataTime = data.series[0].fields[0].values.toArray();
      const currentIndex = Math.trunc(videoRef.current.currentTime);

      const url = '/api/annotations';
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      const annotationData: AnnotationData = {
        dashboardUID: '2xkhR8Y4k',
        isRegion: false,
        time: timestampEvent === -1 ? myPanelDataTime[currentIndex] : timestampEvent,
        timeEnd: timestampEvent === -1 ? myPanelDataTime[currentIndex] : timestampEvent,
        tags,
        dashboardId: 1,
        panelId: 10,
        text: '',
      };
      try {
        const response = await axios.post(url, annotationData, { headers });
        annotationData.id = response.data.id;
        return annotationData;
      } catch (error) {
        console.log('error', error);
        return {};
      }
    },
    [data.series, timestampEvent]
  );

  const updateAnnotation = useCallback(
    async (annotation: Partial<AnnotationData>, time: number): Promise<Partial<AnnotationData> | undefined> => {
      const url = `/api/annotations/${annotation.id}`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      const annotationData: Partial<AnnotationData> = {
        time,
        timeEnd: time,
        text: annotation.text,
        tags: annotation.tags,
      };
      try {
        await axios.put(url, annotationData, { headers });
        return annotationData;
      } catch (error) {
        console.log('error', error);
        return undefined;
      }
    },
    []
  );

  useEffect(() => {
    console.log('VideoPanel DATA: ', data);
    console.log('VideoPanel OPTIONS: ', options);
    console.log('VideoPanel TIME RANGE: ', timeRange);
    const videoReference = videoRef.current;

    return () => {
      videoReference.pause();
      console.log('VideoPanel unmounted');
    };
  }, [data, options, timeRange]);

  const setVideoTime = useCallback(
    (time: number | undefined = 0) => {
      videoRef.current.currentTime = time;
    },
    [videoRef]
  );

  /**
   * Set video time from timestamp panel hover event
   */
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
    async (series: DataFrame | undefined, rowIndex = 0) => {
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
          // if (videoProgressAnnotation.id && videoProgressAnnotation.time !== timestamp) {
          //   const annotation = await updateAnnotation(videoProgressAnnotation, timestamp);
          //   videoProgressAnnotation.time = annotation?.time;
          //   refreshDashboard();
          // }
        }
      }
    },
    [setCurrentVideoTimeFromTimestampEvent]
  );

  /**
   * Subscribe to all necessary dashboard events
   */
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

    // subs.add(
    //   eventBus.getStream(LegacyGraphHoverEvent).subscribe((e) => {
    //     // console.log('LegacyGraphHoverEvent: ', e);
    //     handleLegacyDataHoverEvent(e.payload);
    //   })
    // );

    return () => {
      subs.unsubscribe();
    };
  }, [eventBus, handleDataHoverEvent]);

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

    const nextAnnotation = annotations.find((annotation) => annotation.time ? annotation.time > currentVideoTime : false);
    if (nextAnnotation) {
      setCurrentVideoTimeFromTimestampEvent(nextAnnotation.time);
    }
  }, [annotations, setCurrentVideoTimeFromTimestampEvent, videoRef, data.series]);

  const skipToPreviousAnnotation = useCallback(() => {
    const myPanelDataTime = data.series[0].fields[0].values.toArray(); // timestamp
    const myPanelDataValue = data.series[0].fields[1].values.toArray(); // seconds

    const elementIndex = myPanelDataValue.findIndex((value) => value === Math.trunc(videoRef.current.currentTime));
    const currentVideoTime = myPanelDataTime[myPanelDataTime.length - elementIndex];

    const filteredAnnotations = annotations.filter((annotation) => annotation.time ? annotation.time < currentVideoTime : false);
    const previousAnnotation: Partial<AnnotationData> | undefined = filteredAnnotations.pop();

    if (previousAnnotation) {
      setCurrentVideoTimeFromTimestampEvent(previousAnnotation.time);
      return;
    }
  }, [annotations, data.series, setCurrentVideoTimeFromTimestampEvent, videoRef]);

  /**
   * This effect is used to update the video progress annotation when the video is playing
   * And to clear the interval when the video is paused
   */
  const handleProgressAnnotation = useCallback(
    (annotation: Partial<AnnotationData>) => {
      const isTimerRunning = progressInterval !== null;

      if (!isTimerRunning) {
        const interval = setInterval(async () => {
          const myPanelDataTime = data.series[0].fields[0].values.toArray();
          const currentIndex = Math.trunc(videoRef.current.currentTime);
          const time = myPanelDataTime[currentIndex];
          updateAnnotation(videoProgressAnnotation, time).then((annotation) => {
            videoProgressAnnotation.time = annotation?.time;
            refreshDashboard();
          });
        }, 1000);
        setProgressInterval(interval);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [videoRef, data.series, progressInterval, updateAnnotation, refreshDashboard, videoProgressAnnotation]
  );

  const handlePause = useCallback(() => {
    videoRef.current?.pause();
    setIsMyVideoPlaying(false);
    console.log('PAUSED VIDEO, CLEARING INTERVAL');
    clearInterval(progressInterval);
    setProgressInterval(null as any);
  }, [videoRef, progressInterval]);

  const handlePlay = useCallback(async () => {
    videoRef.current?.play();
    setIsMyVideoPlaying(true);

    if (Object.keys(videoProgressAnnotation).length === 0) {
      videoProgressAnnotation = await createAnnotation(['progress']);
    }
    handleProgressAnnotation(videoProgressAnnotation);
    console.log('ANNOTATIONS', annotations);
  }, [videoRef, createAnnotation, handleProgressAnnotation, annotations]);

  const findAnnotation = useCallback(async (): Promise<AnnotationData[]> => {
    const url = '/api/annotations';
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      console.log('error', error);
      return [];
    }
  }, []);

  /**
   * Load annotations on component mount
   */
  useEffect(() => {
    findAnnotation().then((annotations) => {
      videoProgressAnnotation = annotations.find((annotation) => annotation.tags.includes('progress')) || {};
      setAnnotations(annotations);
    });

    return () => {
      setAnnotations([]);
    };
  }, [findAnnotation, progressInterval]);

  /**
   * Delete video progress annotation on component unmount
   */
  useEffect(() => {
    return () => {
      clearInterval(progressInterval);
    };
  }, [progressInterval]);

  return (
    <div className="video-panel">
      {!timestampEvent || !dataValueEvent ? (
        <div>NO DATA event</div>
      ) : (
        <div>
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
            onEnded={() => {
              clearInterval(progressInterval);
              setIsMyVideoPlaying(false);
            }}
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
              <IconButton
                color="secondary"
                onClick={async () => {
                  const annotation = await createAnnotation(['openvidu']);
                  if (annotation) {
                    setAnnotations([...annotations, annotation]);
                    refreshDashboard();
                  }
                }}
                size="large"
              >
                <FlagIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};
