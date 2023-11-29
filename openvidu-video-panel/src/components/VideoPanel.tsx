import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrayVector, DataFrame, DataHoverEvent, PanelProps, Vector } from '@grafana/data';
import { RefreshEvent } from '@grafana/runtime';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FlagIcon from '@mui/icons-material/Flag';
import Forward10TwoToneIcon from '@mui/icons-material/Forward10TwoTone';
import Replay10Icon from '@mui/icons-material/Replay10';
import Tooltip from '@mui/material/Tooltip';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import { Menu, MenuItem } from '@mui/material';
import { Subscription } from 'rxjs';

import { createAnnotation, AnnotationData, findAnnotation, updateAnnotation } from 'services/RestService';
import { VideoOptions } from 'types';
import { VideoDataTableFields } from 'types/db';
import './VideoPanel.css';

interface Props extends PanelProps<VideoOptions> {}

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
  const REFRESH_INTERVAL_MS = 1000;
  const VIDEO_SPEED_OPTIONS = [1, 2, 3, 5, 7, 10];
  // Property which makes possible to open/close the menu (speed playback video menu)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  // Property which stores the video url
  const [videoUrl, setVideoUrl] = useState('');
  // Property which stores the timestamp of the hover event
  const [timestampEvent, setTimestampEvent] = useState(-1);
  // Property which stores the annotations of the time series panel
  const [annotations, setAnnotations] = useState<Array<Partial<AnnotationData>>>([]);
  // Property which stores the interval of the video progress annotation when the video is playing
  const [videoProgressIntervalId, setVideoProgressIntervalId] = useState<NodeJS.Timeout | undefined>(undefined);
  // Property which stores if the video is playing or not
  const [videoSpeedPlayback, setVideoSpeedPlayback] = useState<number>(1);

  // Reference to the video element
  const videoRef: React.MutableRefObject<HTMLVideoElement> = useRef(null as any);

  // onChangeTimeRange = (timeRange: any) => {
  //   console.log('onChangeTimeRange', timeRange);
  // };

  /**
   * Refreshes the dashboard by publishing a RefreshEvent through the event bus.
   */
  const refreshDashboard = useCallback(() => {
    eventBus.publish(new RefreshEvent());
  }, [eventBus]);

  /**
   * Pauses the video playback.
   */
  const pauseVideo = useCallback(() => {
    videoRef.current?.pause();
    // setIsMyVideoPlaying(false);
    clearInterval(videoProgressIntervalId);
    setVideoProgressIntervalId(undefined);
  }, [videoProgressIntervalId]);

  /**
   * Retrieves data by timestamp from the video data table.
   * @param fieldName - The name of the field to retrieve.
   * @param timestamp - The timestamp to search for in the data table. Defaults to 0.
   * @returns The requested data element corresponding to the timestamp, or -1 if not found.
   */
  const getDataByTimestamp = useCallback(
    (fieldName: string, timestamp = 0) => {
      console.debug(`Invoked getDataByTimestamp with fieldName: '${fieldName}' and timestamp: ${timestamp}`);

      const videoDataTableFields = data.series?.[0].fields || [];
      const requestedField = videoDataTableFields.find((field) => field.name === fieldName);

      const graphTimestampField = videoDataTableFields.find(
        (field) => field.name === VideoDataTableFields.GRAPH_TIMESTAMP
      );

      const requestedValues = requestedField?.values.toArray() || [];
      const timestampValues = graphTimestampField?.values.toArray() || [];

      console.debug(`Requested Field '${fieldName}' values: `, requestedValues);
      console.debug('Graph Timestamp values: ', timestampValues);

      // Return first element of the requested data
      if (timestamp === 0) {
        console.debug('Timestamp is 0. Returning first element:', requestedValues[0]);
        return requestedValues[0];
      }

      const currentIndex = timestampValues.indexOf(timestamp);

      if (currentIndex > -1) {
        if (requestedValues.length >= currentIndex) {
          console.debug(`Found data with timestamp: ${timestamp} and returning: ${requestedValues[currentIndex]}`);
          return requestedValues[currentIndex];
        } else {
          console.debug(
            `Found data with timestamp: ${timestamp} but returning last element: ${
              requestedValues[requestedValues.length - 1]
            }`
          );
          // If 'currentIndex' is valid but 'targetArray' is smaller, return the last element
          return requestedValues[requestedValues.length - 1];
        }
      } else if (requestedValues.length > 0) {
        // The current timestamp not found, maybe the timestamp filter starts before the video starts
        // If timestamp is not found, return the first element
        console.warn(
          'Timestamp does not match with any video timestamp, maybe the timestamp filter starts before the video starts.'
        );
        console.debug(`Returning first element from "${fieldName}":`, requestedValues[0]);
        return requestedValues[0];
      }

      console.debug('Timestamp not found. Returning -1');
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

  /**
   * Sets the current video time based on a timestamp event.
   * If the timestamp is out of the video time range, the video time is set to 0.
   * If the video URL is different from the current video URL, it changes the video URL and sets the video time.
   * If the video is playing, it pauses the video before changing the video URL.
   *
   * @param timestamp - The timestamp of the event.
   * @param newUrl - The new video URL.
   * @returns A cleanup function to remove the event listener.
   */
  const setCurrentVideoTimeFromTimestampEvent = useCallback(
    (timestamp: number, newUrl: string) => {
      // Set video time to 0 if timestamp is out of the video time range
      const videoTime = Math.max(0, getDataByTimestamp(VideoDataTableFields.VIDEO_TIME_SECONDS, timestamp));
      const isVideoPlaying = !videoRef.current?.paused;
      const loadedMetadataHandler = () => {
        console.debug(`Setting video url to: ${newUrl} ...`);
        console.debug(`Setting video time to: ${videoTime} ...`);
        videoRef.current.currentTime = videoTime;
        videoRef.current.play().catch((error) => console.error('Error playing video:', error));
      };

      if (Boolean(newUrl) && newUrl !== videoUrl) {
        console.debug(`Video URL "${videoUrl}" is different from current video URL "${newUrl}". Changing it ...`);

        if (isVideoPlaying) {
          console.debug('Pausing video ...');
          pauseVideo();
        }

        console.debug(`Setting video url to: ${newUrl} ...`);
        setVideoUrl(newUrl);

        videoRef.current.addEventListener('loadedmetadata', loadedMetadataHandler, { once: true });
      }

      return () => {
        // Cleanup loadedmetadata event listener
        videoRef.current.removeEventListener('loadedmetadata', loadedMetadataHandler);
      };
    },
    [videoUrl, videoRef, pauseVideo, setVideoUrl, getDataByTimestamp]
  );

  /**
   * Handles the data hover event.
   *
   * @param series - The data frame series.
   * @param rowIndex - The index of the row to handle.
   */
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
          const url = getDataByTimestamp(VideoDataTableFields.VIDEO_URL, timestamp);
          setCurrentVideoTimeFromTimestampEvent(timestamp, url);
        }
      }
    },
    [setTimestampEvent, setCurrentVideoTimeFromTimestampEvent, getDataByTimestamp]
  );

  /**
   * Moves the video playback forward by 10 seconds.
   */
  const forwardTenSeconds = () => {
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
            clearInterval(videoProgressIntervalId);
            setVideoProgressIntervalId(undefined);
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
  };

  /**
   * Rewinds the video by ten seconds.
   */
  const rewindTenSeconds = () => {
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
            clearInterval(videoProgressIntervalId);
            setVideoProgressIntervalId(undefined);
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
  };

  /**
   * Skips to the next annotation in the video.
   */
  const skipToNextAnnotation = () => {
    const currentVideoTimestamp =
      videoProgressAnnotation?.time || getTimestampByVideoTimeSecond(Math.trunc(videoRef.current.currentTime));
    const nextAnnotation = annotations.find((annotation) =>
      annotation.time ? annotation.time > currentVideoTimestamp : false
    );
    if (nextAnnotation?.time) {
      setCurrentVideoTimeFromTimestampEvent(nextAnnotation.time, nextAnnotation.data?.videoUrl);
    }
  };

  /**
   * Skips to the previous annotation in the video panel.
   */
  const skipToPreviousAnnotation = () => {
    const currentVideoTimestamp =
      videoProgressAnnotation?.time || getTimestampByVideoTimeSecond(Math.trunc(videoRef.current.currentTime));

    const filteredAnnotations = annotations.filter((annotation) =>
      annotation.time ? annotation.time < currentVideoTimestamp : false
    );
    const previousAnnotation: Partial<AnnotationData> | undefined = filteredAnnotations.pop();

    if (previousAnnotation?.time) {
      setCurrentVideoTimeFromTimestampEvent(previousAnnotation.time, previousAnnotation.data?.videoUrl);
    }
  };

  /**
   * This method used to update the video progress annotation when the video is playing
   * And to clear the interval when the video is paused
   */
  const handleProgressAnnotation = useCallback(() => {
    const isTimerRunning = videoProgressIntervalId !== undefined;

    if (!isTimerRunning) {
      const interval: NodeJS.Timeout = setInterval(async () => {
        const currentVideoTimestamp = getTimestampByVideoTimeSecond(Math.trunc(videoRef.current.currentTime), videoUrl);
        const annotation = await updateAnnotation(videoProgressAnnotation, currentVideoTimestamp);
        videoProgressAnnotation.time = annotation?.time;
        refreshDashboard();
      }, REFRESH_INTERVAL_MS / videoSpeedPlayback);
      setVideoProgressIntervalId(interval);
    }
  }, [videoProgressIntervalId, videoSpeedPlayback, videoUrl, getTimestampByVideoTimeSecond, refreshDashboard]);

  /**
   * Plays the video and handles the progress annotation.
   */
  const playVideo = async () => {
    videoRef.current?.play();
    // setIsMyVideoPlaying(true);

    if (Object.keys(videoProgressAnnotation).length === 0) {
      const currentTimestamp = getTimestampByVideoTimeSecond(Math.trunc(videoRef.current.currentTime), videoUrl);
      const data: AnnotationData = {
        // dashboardUID: '2xkhR8Y4k', If dashboardUID is not specified, general annotation is created
        isRegion: false,
        time: timestampEvent === -1 ? currentTimestamp : timestampEvent,
        timeEnd: timestampEvent === -1 ? currentTimestamp : timestampEvent,
        tags: ['progress'],
        dashboardId: 1,
        // panelId: 10,
        text: `Annontation progress`,
        data: { videoUrl },
      };
      videoProgressAnnotation = await createAnnotation(data);
    }
    handleProgressAnnotation();
  };

  /**
   * Callback function triggered when a video ends.
   */
  const onVideoEnded = () => {
    // Ensure data.series and data.series[0] exist before accessing fields
    const fields = data.series?.[0]?.fields || [];

    // Extract videoUrls from the fields with the name VIDEO_URL
    const videoUrls =
      fields
        .filter((field) => field.name === VideoDataTableFields.VIDEO_URL)
        .map((field) => field.values?.toArray())
        .flat() || [];

    // Use a Set to efficiently get unique video URLs
    const uniqueVideoUrlsArray = [...new Set(videoUrls)];

    // Find the index of the current video URL in the unique array
    const currentVideoUrlIndex = uniqueVideoUrlsArray.indexOf(videoUrl);

    // Check if there is a next video URL
    if (currentVideoUrlIndex >= 0 && uniqueVideoUrlsArray[currentVideoUrlIndex + 1]) {
      const nextVideoUrl = uniqueVideoUrlsArray[currentVideoUrlIndex + 1];
      setVideoUrl(nextVideoUrl);
      // Reset the video's current time to the beginning
      videoRef.current.currentTime = 0;

      const onLoadedMetadata = () => {
        console.debug('Loaded video metadata', nextVideoUrl);
        clearInterval(videoProgressIntervalId);
        setVideoProgressIntervalId(undefined);
        videoRef.current?.play();
        videoRef.current.playbackRate = videoSpeedPlayback;
        videoRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
      };

      videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
    } else {
      console.debug("There's no next video URL");
      // If there is no next video URL, pause the video
      videoRef.current.pause();
      clearInterval(videoProgressIntervalId);
      setVideoProgressIntervalId(undefined);
    }
  };

  const onVideoSpeedChange = (value: number) => {
    videoRef.current.playbackRate = value;
    setVideoSpeedPlayback(value);
  };

  const addAnnotation = async () => {
    const currentTimestamp = getTimestampByVideoTimeSecond(Math.trunc(videoRef.current.currentTime), videoUrl);

    const data: AnnotationData = {
      // dashboardUID: '2xkhR8Y4k', If dashboardUID is not specified, general annotation is created
      isRegion: false,
      time: timestampEvent === -1 ? currentTimestamp : timestampEvent,
      timeEnd: timestampEvent === -1 ? currentTimestamp : timestampEvent,
      tags: ['openvidu'],
      dashboardId: 1,
      // panelId: 10,
      text: `Annontation openvidu`,
      data: { videoUrl },
    };

    const annotation = await createAnnotation(data);
    if (annotation) {
      setAnnotations([...annotations, annotation]);
      refreshDashboard();
    }
  };

  useEffect(() => {
    console.warn('USE EFFECT VIDEO PANEL');
    console.log('Video panel DATA received: ', data);
    console.debug('Video panel OPTIONS received: ', options);
    console.debug('Video panel TIME RANGE: ', timeRange);
    // const videoReference = videoRef.current;

    const fromTimestamp = timeRange?.from?.toDate()?.getTime() ?? 0;
    console.debug(`Video panel TIMESTAMP (from timeRange): ${fromTimestamp} | ${new Date(fromTimestamp)}`);

    if (Boolean(fromTimestamp)) {
      console.debug('Setting TIMESTAMP EVENT to: ', fromTimestamp);
      setTimestampEvent(fromTimestamp);
    }
    console.debug(`Setting VIDEO URL by timestamp: ${fromTimestamp} ...`);
    const newVideoUrl = getDataByTimestamp(VideoDataTableFields.VIDEO_URL, fromTimestamp);
    console.debug('Set VIDEO URL to: ', newVideoUrl);
    setVideoUrl(newVideoUrl);
    const videoTime = Math.max(0, getDataByTimestamp(VideoDataTableFields.VIDEO_TIME_SECONDS, fromTimestamp));
    console.debug(`Setting video time to: ${videoTime} ...`);
    videoRef.current.currentTime = videoTime;

    // setCurrentVideoTimeFromTimestampEvent(fromTimestamp);

    // Play video when the component is mounted
    // videoReference.play();

    return () => {
      // videoReference.pause();
      console.debug('VideoPanel unmounted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, options, timeRange, getDataByTimestamp /*setCurrentVideoTimeFromTimestampEvent*/]);

  /**
   * Subscribe to all necessary dashboard events
   */
  useEffect(() => {
    console.warn('USE EFFECT SUBSCRIBE TO EVENTS');
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

  // Use the useEffect hook to call handleProgressAnnotation when progressInterval changes
  useEffect(() => {
    const isVideoPlaying = !videoRef.current?.paused;
    console.warn('USE EFFECT', isVideoPlaying, videoProgressIntervalId);
    if (isVideoPlaying && !videoProgressIntervalId) {
      //TODO: Check this method!
      handleProgressAnnotation();
    }
  }, [videoProgressIntervalId, handleProgressAnnotation, videoRef]);

  /**
   * Load annotations on component mount
   */
  useEffect(() => {
    findAnnotation().then((annotations: AnnotationData[]) => {
      videoProgressAnnotation = annotations.find((annotation) => annotation.tags.includes('progress')) || {};
      setAnnotations(annotations);
    });

    return () => {
      setAnnotations([]);
    };
  }, [setAnnotations]);

  /**
   * Delete video progress annotation on component unmount
   */
  useEffect(() => {
    return () => {
      clearInterval(videoProgressIntervalId);
    };
  });

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
          // onPlaying={() => setIsMyVideoPlaying(true)}
          // onPause={() => setIsMyVideoPlaying(false)}
          onEnded={() => onVideoEnded()}
        />
        <div className="controls">
          <IconButton
            aria-label="more"
            aria-controls={Boolean(anchorEl) ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
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
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            {VIDEO_SPEED_OPTIONS.map((option) => (
              <MenuItem
                key={option}
                selected={option === videoRef?.current?.playbackRate}
                value={option}
                onClick={() => {
                  onVideoSpeedChange(option);
                  setAnchorEl(null);
                }}
              >
                {option}x
              </MenuItem>
            ))}
          </Menu>
          <Tooltip title="Rewind 10 seconds">
            <IconButton onClick={rewindTenSeconds} size="large">
              <Replay10Icon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title={videoRef?.current?.paused ? 'Play Video' : 'Pause video'}>
            <IconButton className="icon-btn" onClick={videoRef?.current?.paused ? playVideo : pauseVideo} size="large">
              {videoRef?.current?.paused ? <PlayArrowIcon fontSize="inherit" /> : <PauseIcon fontSize="inherit" />}
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
            <IconButton color="secondary" onClick={addAnnotation} size="large">
              <FlagIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
