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
import { VideoDataTableFields } from 'types/db';
import { Menu, MenuItem} from '@mui/material';

interface Props extends PanelProps<VideoOptions> {}
interface AnnotationData {
  id?: number;
  dashboardUID?: string;
  isRegion: boolean;
  time: number;
  timeEnd: number;
  tags: string[];
  dashboardId: number;
  panelId?: number;
  text: string;
  data?: any;
}

let videoProgressAnnotation: Partial<AnnotationData> = {};
export const VideoPanel: React.FC<Props> = ({
  options,
  data,
  timeRange,
  timeZone,
  width,
  height,
  // onChangeTimeRange,
  eventBus,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const speedMenuOpen = Boolean(anchorEl);

  const [videoUrl, setVideoUrl] = useState('');
  const [timestampEvent, setTimestampEvent] = useState(-1);

  const [annotations, setAnnotations] = useState<Array<Partial<AnnotationData>>>([]);

  const [progressInterval, setProgressInterval] = useState<any>(null as any);

  const [isMyVideoPlaying, setIsMyVideoPlaying] = useState(false);
  const videoRef: React.MutableRefObject<HTMLVideoElement> = useRef(null as any);


  // onChangeTimeRange = (timeRange: any) => {
  //   console.log('onChangeTimeRange', timeRange);
  // };

  const refreshDashboard = useCallback(() => {
    eventBus.publish(new RefreshEvent());
  }, [eventBus]);

  const pauseVideo = useCallback(() => {
    videoRef.current?.pause();
    setIsMyVideoPlaying(false);
    clearInterval(progressInterval);
    setProgressInterval(null as any);
  }, [videoRef, progressInterval]);

  const getDataByTimestamp = useCallback(
    (fieldName: string, timestamp = 0) => {
      console.log(new Date(timestamp));

      const videoDataTableFields = data.series?.[0].fields || [];
      const requestedField = videoDataTableFields.find((field) => field.name === fieldName);
      const graphTimestampField = videoDataTableFields.find(
        (field) => field.name === VideoDataTableFields.GRAPH_TIMESTAMP
      );

      const requestedValues = requestedField?.values.toArray() || [];
      const timestampValues = graphTimestampField?.values.toArray() || [];

      // Return first element of the requested data
      if (timestamp === 0) {
        return requestedValues[0];
      }

      const currentIndex = timestampValues.indexOf(timestamp);

      if (currentIndex > -1) {
        if (requestedValues.length >= currentIndex) {
          return requestedValues[currentIndex];
        } else {
          // If 'currentIndex' is valid but 'targetArray' is smaller, return the last element
          return requestedValues[requestedValues.length - 1];
        }
      } else if (requestedValues.length > 0) {
        // If timestamp is not found, return the first element
        return requestedValues[0];
      }

      return -1;
    },
    [data.series]
  );

  const getTimestampByVideoTimeSecond = useCallback(
    (videoTime: number, videoUrl?: string) => {
      const fields = data.series?.[0].fields || [];
      const videoTimeSecondsField = fields.find((field) => field.name === VideoDataTableFields.VIDEO_TIME_SECONDS);
      const graphTimestampField = fields.find((field) => field.name === VideoDataTableFields.GRAPH_TIMESTAMP);
      const videoUrlField = fields.find((field) => field.name === VideoDataTableFields.VIDEO_URL);

      const videoTimeSecondsArray = videoTimeSecondsField?.values.toArray() || [];
      const timestampArray = graphTimestampField?.values.toArray() || [];
      const videoUrlArray = videoUrlField?.values.toArray() || [];

      const foundTimestamp = timestampArray.find((_, index) => {
        if (videoTimeSecondsArray[index] === videoTime) {
          if (Boolean(videoUrl)) {
            return videoUrlArray[index] === videoUrl;
          }
          return true;
        }
        return false;
      });

      return foundTimestamp;
    },
    [data.series]
  );

  const getVideoTimeSecondByTimestamp = useCallback(
    (timestamp = 0) => getDataByTimestamp(VideoDataTableFields.VIDEO_TIME_SECONDS, timestamp),
    [getDataByTimestamp]
  );

  const getVideoUrlByTimestamp = useCallback(
    (timestamp = 0) => getDataByTimestamp(VideoDataTableFields.VIDEO_URL, timestamp),
    [getDataByTimestamp]
  );

  const createAnnotation = useCallback(
    async (tags: string[]): Promise<Partial<AnnotationData>> => {
      const currentTimestamp = getTimestampByVideoTimeSecond(Math.trunc(videoRef.current.currentTime), videoUrl);

      const url = '/api/annotations';
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      const annotationData: AnnotationData = {
        // dashboardUID: '2xkhR8Y4k', If dashboardUID is not specified, general annotation is created
        isRegion: false,
        time: timestampEvent === -1 ? currentTimestamp : timestampEvent,
        timeEnd: timestampEvent === -1 ? currentTimestamp : timestampEvent,
        tags,
        dashboardId: 1,
        // panelId: 10,
        text: `Annontation ${tags[0]}`,
        data: { videoUrl },
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
    [timestampEvent, videoUrl, getTimestampByVideoTimeSecond]
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

  /**
   * Set video time from timestamp panel hover event
   */
  const setCurrentVideoTimeFromTimestampEvent = useCallback(
    (timestamp: number, url = '') => {
      let seconds = getVideoTimeSecondByTimestamp(timestamp);
      // Set video time to 0 if timestamp is out of the video time range
      seconds = seconds < 0 ? 0 : seconds;

      if (Boolean(url) && url !== videoUrl) {
        console.log('setVideoUrl', url);
        pauseVideo();
        setVideoUrl(url);

        videoRef.current.addEventListener(
          'loadedmetadata',
          () => {
            videoRef.current.currentTime = seconds;
            videoRef.current?.play();
          },
          { once: true }
        );
      } else {
        videoRef.current.currentTime = seconds;
      }
    },
    [getVideoTimeSecondByTimestamp, videoUrl, pauseVideo, setVideoUrl]
  );

  useEffect(() => {
    console.log('VideoPanel DATA: ', data);
    console.log('VideoPanel OPTIONS: ', options);
    console.log('VideoPanel TIME RANGE: ', timeRange);
    // const videoReference = videoRef.current;

    const from = timeRange?.from?.toDate()?.getTime() ?? 0;
    if (from) {
      setTimestampEvent(from);
    }
    setVideoUrl(getVideoUrlByTimestamp(from));
    setCurrentVideoTimeFromTimestampEvent(from);
    // Play video when the component is mounted
    // videoReference.play();

    return () => {
      // videoReference.pause();
      console.log('VideoPanel unmounted');
    };
  }, [data, options, timeRange, getVideoUrlByTimestamp, setCurrentVideoTimeFromTimestampEvent]);

  const handleDataHoverEvent = useCallback(
    async (series: DataFrame | undefined, rowIndex = 0) => {
      let timeArray: Vector<any> = new ArrayVector();
      // let valueArray: Vector<any> = new ArrayVector();

      series?.fields.forEach((field) => {
        if (field.type === 'time') {
          timeArray = field.values;
        } else if (field.type === 'number' && field.name.toLocaleLowerCase() !== 'y') {
          // valueArray = field.values;
        }
      });

      if (series) {
        const timestamp = timeArray.get(rowIndex);
        // const value = valueArray.get(rowIndex);

        if (timestamp) {
          setTimestampEvent(timestamp);
          const url = getVideoUrlByTimestamp(timestamp);
          setCurrentVideoTimeFromTimestampEvent(timestamp, url);
        }
      }
    },
    [setCurrentVideoTimeFromTimestampEvent, getVideoUrlByTimestamp]
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
    const newTime = videoRef.current.currentTime + 10;
    const fields = data.series?.[0].fields || [];
    if (newTime > videoRef.current.duration) {
      // Video time is greater than video duration, we need to go to the next video
      const secondsToAddToNextVideo = newTime - videoRef.current.duration;
      const videoUrls = fields.find((field) => field.name === VideoDataTableFields.VIDEO_URL)?.values.toArray() || [];
      const uniqueVideoUrlsArray = videoUrls.filter((url, index, self) => self.indexOf(url) === index);
      const currentVideoUrlIndex = uniqueVideoUrlsArray.findIndex((url) => url === videoUrl);
      const nextVideoUrl = uniqueVideoUrlsArray[currentVideoUrlIndex + 1];
      if (nextVideoUrl) {
        setVideoUrl(nextVideoUrl);
        videoRef.current.addEventListener(
          'loadedmetadata',
          () => {
            videoRef.current.currentTime = secondsToAddToNextVideo;
            clearInterval(progressInterval);
            setProgressInterval(null as any);
            videoRef.current?.play();
          },
          { once: true }
        );
      } else {
        videoRef.current.currentTime = videoRef.current.duration;
      }
    } else {
      videoRef.current.currentTime = newTime;
    }
  }, [videoRef, data, videoUrl, progressInterval, setVideoUrl]);

  const rewindTenSeconds = useCallback(() => {
    const newTime = videoRef.current.currentTime - 10;
    const fields = data.series?.[0].fields || [];
    if (newTime < 0) {
      // Video time is less than 0, we need to go to the previous video
      const videoUrls = fields.find((field) => field.name === VideoDataTableFields.VIDEO_URL)?.values.toArray() || [];
      const uniqueVideoUrlsArray = videoUrls.filter((url, index, self) => self.indexOf(url) === index);
      const currentVideoUrlIndex = uniqueVideoUrlsArray.findIndex((url) => url === videoUrl);
      const previousVideoUrl = uniqueVideoUrlsArray[currentVideoUrlIndex - 1];
      if (previousVideoUrl) {
        setVideoUrl(previousVideoUrl);
        videoRef.current.addEventListener(
          'loadedmetadata',
          () => {
            videoRef.current.currentTime = videoRef.current.duration + newTime;
            clearInterval(progressInterval);
            setProgressInterval(null as any);
            videoRef.current?.play();
          },
          { once: true }
        );
      } else {
        videoRef.current.currentTime = 0;
      }
    } else {
      videoRef.current.currentTime = videoRef.current.currentTime - 10;
    }
  }, [videoRef, data, videoUrl, progressInterval, setVideoUrl]);

  const skipToNextAnnotation = useCallback(() => {
    const currentVideoTimestamp =
      videoProgressAnnotation?.time || getTimestampByVideoTimeSecond(Math.trunc(videoRef.current.currentTime));
    const nextAnnotation = annotations.find((annotation) =>
      annotation.time ? annotation.time > currentVideoTimestamp : false
    );
    if (nextAnnotation?.time) {
      setCurrentVideoTimeFromTimestampEvent(nextAnnotation.time, nextAnnotation.data?.videoUrl);
    }
  }, [getTimestampByVideoTimeSecond, annotations, setCurrentVideoTimeFromTimestampEvent]);

  const skipToPreviousAnnotation = useCallback(() => {
    const currentVideoTimestamp =
      videoProgressAnnotation?.time || getTimestampByVideoTimeSecond(Math.trunc(videoRef.current.currentTime));

    const filteredAnnotations = annotations.filter((annotation) =>
      annotation.time ? annotation.time < currentVideoTimestamp : false
    );
    const previousAnnotation: Partial<AnnotationData> | undefined = filteredAnnotations.pop();

    if (previousAnnotation?.time) {
      setCurrentVideoTimeFromTimestampEvent(previousAnnotation.time, previousAnnotation.data?.videoUrl);
    }
  }, [annotations, getTimestampByVideoTimeSecond, setCurrentVideoTimeFromTimestampEvent]);

  /**
   * This method used to update the video progress annotation when the video is playing
   * And to clear the interval when the video is paused
   */
  const handleProgressAnnotation = useCallback(() => {
    const isTimerRunning = progressInterval !== null;

    if (!isTimerRunning) {
      const interval = setInterval(async () => {
        console.log(videoUrl);
        const currentVideoTimestamp = getTimestampByVideoTimeSecond(Math.trunc(videoRef.current.currentTime), videoUrl);
        const annotation = await updateAnnotation(videoProgressAnnotation, currentVideoTimestamp);
        videoProgressAnnotation.time = annotation?.time;
        refreshDashboard();
      }, 1000);
      setProgressInterval(interval);
    }
  }, [videoRef, progressInterval, updateAnnotation, refreshDashboard, getTimestampByVideoTimeSecond, videoUrl]);

  const playVideo = useCallback(async () => {
    videoRef.current?.play();
    setIsMyVideoPlaying(true);

    if (Object.keys(videoProgressAnnotation).length === 0) {
      videoProgressAnnotation = await createAnnotation(['progress']);
    }
    handleProgressAnnotation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef, createAnnotation, handleProgressAnnotation, videoProgressAnnotation]);

  const onVideoEnded = useCallback(() => {
    const fields = data.series?.[0].fields || [];
    const videoUrls = fields.find((field) => field.name === VideoDataTableFields.VIDEO_URL)?.values.toArray() || [];
    const uniqueVideoUrlsArray = videoUrls.filter((url, index, self) => self.indexOf(url) === index);
    const currentVideoUrlIndex = uniqueVideoUrlsArray.indexOf(videoUrl);

    if (currentVideoUrlIndex >= 0 && uniqueVideoUrlsArray[currentVideoUrlIndex + 1]) {
      // If there is a next video, play it
      const nextVideoUrl = uniqueVideoUrlsArray[currentVideoUrlIndex + 1];
      setVideoUrl(nextVideoUrl);
      videoRef.current.currentTime = 0;
      videoRef.current.addEventListener(
        'loadedmetadata',
        () => {
          console.log('LOADED METADATA', nextVideoUrl);
          clearInterval(progressInterval);
          setProgressInterval(null as any);
          videoRef.current?.play();
        },
        { once: true }
      );
    }
  }, [data.series, progressInterval, videoUrl]);

  const onVideoSpeedChange = useCallback((value: number) => {
    console.log('new speed value ', value);
    videoRef.current.playbackRate = value;
  }, []);


  // Use the useEffect hook to call handleProgressAnnotation when progressInterval changes
  useEffect(() => {
    if (progressInterval === null && isMyVideoPlaying) {
      handleProgressAnnotation();
    }
  }, [progressInterval, handleProgressAnnotation, isMyVideoPlaying]);

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
          onEnded={() => onVideoEnded()}
        />
        <div className="controls">
          <IconButton
            aria-label="more"
            aria-controls={speedMenuOpen ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={speedMenuOpen ? 'true' : undefined}
            onClick={(ev) => setAnchorEl(ev.currentTarget)}
          >
            {videoRef?.current?.playbackRate}x
          </IconButton>
          <Menu
            id="long-menu"
            MenuListProps={{
              'aria-labelledby': 'long-button',
            }}
            anchorEl={anchorEl}
            open={speedMenuOpen}
            onClose={() => setAnchorEl(null)}
          >
            {[1, 2,3,5,7,10].map((option) => (
              <MenuItem key={option} selected={option === videoRef?.current?.playbackRate} value={option} onClick={() => {onVideoSpeedChange(option); setAnchorEl(null)}}>
                {option}x
              </MenuItem>
            ))}
          </Menu>
          <Tooltip title="Rewind 10 seconds">
            <IconButton onClick={rewindTenSeconds} size="large">
              <Replay10Icon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isMyVideoPlaying ? 'Pause video' : 'Play Video'}>
            <IconButton className="icon-btn" onClick={isMyVideoPlaying ? pauseVideo : playVideo} size="large">
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
    </div>
  );
};
