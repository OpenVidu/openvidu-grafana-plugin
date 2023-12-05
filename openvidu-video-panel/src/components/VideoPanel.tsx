import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrayVector, DataFrame, DataHoverEvent, PanelProps, Vector } from '@grafana/data';
import { RefreshEvent } from '@grafana/runtime';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import LabelIcon from '@mui/icons-material/Label';
import LabelOffOutlinedIcon from '@mui/icons-material/LabelOffOutlined';
import Forward10TwoToneIcon from '@mui/icons-material/Forward10TwoTone';
import Replay10Icon from '@mui/icons-material/Replay10';
import Tooltip from '@mui/material/Tooltip';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import { Menu, MenuItem } from '@mui/material';
import { Subscription } from 'rxjs';

import {
  createAnnotation,
  AnnotationData,
  updateAnnotation,
  deleteAnnotations,
  getAnnotations,
} from 'services/RestService';
import { VideoOptions } from 'types';
import { VideoDataTableFields } from 'types/db';
import './VideoPanel.css';
import { AnnotationTag } from 'types/annotation';

interface Props extends PanelProps<VideoOptions> {}

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
  const [speedMenuContent, setSpeedMenuContent] = React.useState<null | HTMLElement>(null);
  // Property which stores the annotations mark of the time series panel
  const [markAnnotations, setMarkAnnotations] = useState<Array<Partial<AnnotationData>>>([]);
  // Property which stores the progress annotation of the video
  const [progressAnnotation, setProgressAnnotation] = useState<Partial<AnnotationData>>({});
  // Property which stores the interval of the video progress annotation when the video is playing
  const [annotationProgressIntervalId, setAnnotationProgressIntervalId] = useState<NodeJS.Timeout | undefined>(
    undefined
  );

  // Reference to the video element
  const videoRef: React.MutableRefObject<HTMLVideoElement> = useRef(null as any);

  // Property which stores the video state
  const [videoState, setVideoState] = useState<{
    url: string;
    forcedTime?: number;
    speedPlayback: number;
    play?: boolean;
  }>({
    url: '',
    forcedTime: 0,
    speedPlayback: 1,
    play: false,
  });

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
   * Plays the video with the current settings.
   */
  const playVideo = async () => {
    setVideoState({
      url: videoState.url,
      forcedTime: videoState.forcedTime,
      speedPlayback: videoState.speedPlayback,
      play: true,
    });
  };

  /**
   * Pauses the video playback.
   */
  const pauseVideo = useCallback(() => {
    setVideoState({
      url: videoState.url,
      // forcedTime: videoRef.current.currentTime,
      speedPlayback: videoRef.current.playbackRate,
      play: false,
    });
  }, [videoRef, videoState.url, setVideoState]);

  /**
   * Retrieves data by timestamp from the video data table.
   * @param fieldName - The name of the field to retrieve.
   * @param timestamp - The timestamp to search for in the data table.
   * @returns The requested data element corresponding to the given timestamp.
   */
  const getDataByTimestamp = useCallback(
    (fieldName: string, timestamp = 0) => {
      console.debug(`Invoked getDataByTimestamp with fieldName: '${fieldName}' and timestamp: ${timestamp}`);

      const videoDataTableFields = data.series?.[0].fields || [];
      const requestedField = videoDataTableFields.find((field) => field.name === fieldName);
      const requestedValues = requestedField?.values.toArray() || [];

      // Return first element of the requested data
      if (timestamp === 0) {
        console.debug('Timestamp is 0. Returning first element:', requestedValues[0]);
        return requestedValues[0];
      }

      if (timestamp === Infinity) {
        console.debug('Timestamp is Infinity. Returning last element:', requestedValues[requestedValues.length - 1]);
        return requestedValues[requestedValues.length - 1];
      }

      const graphTimestampField = videoDataTableFields.find(
        (field) => field.name === VideoDataTableFields.GRAPH_TIMESTAMP
      );

      const timestampValues = graphTimestampField?.values.toArray() || [];
      console.debug(`Requested Field '${fieldName}' values: `, requestedValues);
      console.debug('Graph Timestamp values: ', timestampValues);
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

  /**
   * Retrieves the timestamp from the video data table by specific video time in seconds.
   */
  const getTimestampByVideoTimeSecond = useCallback(
    (videoTime: number, videoUrl: string) => {
      const fields = data.series?.[0].fields || [];
      // const videoTimeSecondsField = fields.find((field) => field.name === VideoDataTableFields.VIDEO_TIME_SECONDS);
      const graphTimestampField = fields.find((field) => field.name === VideoDataTableFields.GRAPH_TIMESTAMP);
      const videoUrlField = fields.find((field) => field.name === VideoDataTableFields.VIDEO_URL);

      const videoUrlIndex = videoUrlField?.values.toArray().indexOf(videoUrl);
      if (videoUrlIndex !== undefined && videoUrlIndex >= 0) {
        const firstVideoTimestamp = graphTimestampField?.values.toArray()[videoUrlIndex];
        return firstVideoTimestamp + videoTime * 1000;
      } else {
        console.error(`Video URL ${videoUrl} not found in the data table`);
        return;
      }
    },
    [data.series]
  );

  /**
   * Updates the video progress annotation. It also updates the timestampEvent.
   * @param time - The time in milliseconds.
   */
  const updateProgressAnnotation = useCallback(
    async (time: number, videoUrl: string) => {
      if (progressAnnotation.time === time && progressAnnotation.data?.videoUrl === videoUrl) {
        return;
      }
      progressAnnotation.time = time;
      progressAnnotation.timeEnd = time;
      progressAnnotation.data = { videoUrl };
      setProgressAnnotation(progressAnnotation);
      try {
        await updateAnnotation(progressAnnotation, time);
      } catch (error) {
        console.error('Error updating annotation: ', error);
        console.log('progressAnnotation: ', progressAnnotation);
      } finally {
        refreshDashboard();
      }
    },
    [progressAnnotation, refreshDashboard]
  );

  /**
   * Updates the current time of the video.
   * If the video URL is undefined, it sets the video URL to the current video URL.
   * Calculates the new time based on the given timestamp and the first timestamp of the video.
   * Sets the video state with the updated URL, forced time, playback speed, and play status.
   * @param timestamp - The timestamp in milliseconds.
   * @param videoUrl - The URL of the video.
   */
  const updateVideoCurrentTime = useCallback(
    (timestamp: number, videoUrl: string) => {
      if (!videoUrl) {
        console.warn('Video URL is undefined updating video current time');
        console.warn('Setting video url to current video url ...', videoState.url);
        videoUrl = videoState.url;
      }

      const firstTimeStamp = getTimestampByVideoTimeSecond(0, videoUrl);
      const newTime = Math.abs(timestamp - firstTimeStamp) / 1000;
      // if (videoState.url !== nextAnnotation.data?.videoUrl) {
      //   // If the video url is different, we need to calculate the time of the new video
      //   newTime = Math.trunc(videoRef.current.duration - newTime);
      // }
      setVideoState({
        url: videoUrl,
        forcedTime: newTime,
        speedPlayback: videoRef.current.playbackRate,
        play: !videoRef.current?.paused,
      });

      // TODO: It should update the progress annotation here but many errors appear when request for updating the annotaiton.
      // {"type":"cancelled","cancelled":true,"data":null,"status":-1,"statusText":"Request was aborted"
      // TODO: Check the newest version of grafana to see if this error is fixed
      updateProgressAnnotation(timestamp, videoUrl);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [videoRef, videoState.url, updateProgressAnnotation, setVideoState, getTimestampByVideoTimeSecond]
  );

  /**
   * Moves the video playback forward by 10 seconds.
   */
  const forwardTenSeconds = () => {
    const newTime = Math.trunc(videoRef.current.currentTime + 10);
    const fields = data.series?.[0].fields || [];
    const videoUrls = fields.find((field) => field.name === VideoDataTableFields.VIDEO_URL)?.values.toArray() || [];
    const uniqueVideoUrlsArray = [...new Set(videoUrls)];
    const currentVideoUrlIndex = uniqueVideoUrlsArray.indexOf(videoState.url);
    const nextVideoUrl = uniqueVideoUrlsArray[currentVideoUrlIndex + 1];
    const isTimeGreaterThanDuration = newTime > videoRef.current.duration;
    let newVideoUrl;
    let newTimeSeconds;

    if (isTimeGreaterThanDuration) {
      console.debug('Video time is greater than video duration. Going to next video ...');
      newTimeSeconds = nextVideoUrl ? newTime - videoRef.current.duration : videoRef.current.duration;
      newVideoUrl = nextVideoUrl || videoState.url;
    } else {
      console.debug('Video time is less than video duration. Forwarding 10 seconds ...');
      newVideoUrl = videoState.url;
      newTimeSeconds = newTime;
    }

    setVideoState({
      url: newVideoUrl,
      forcedTime: newTimeSeconds,
      speedPlayback: videoRef.current.playbackRate,
      play: !videoRef.current?.paused,
    });
    const newTimestamp = getTimestampByVideoTimeSecond(newTimeSeconds, newVideoUrl);
    stopProgressAnnotationUpdate();
    updateProgressAnnotation(newTimestamp, newVideoUrl);
  };

  /**
   * Rewinds the video by ten seconds.
   */
  const rewindTenSeconds = () => {
    console.debug('Rewinding 10 seconds ...');
    const newTime = Math.trunc(videoRef.current.currentTime - 10);
    const fields = data.series?.[0].fields || [];
    let newVideoUrl;
    let newTimeSeconds;
    if (newTime < 0) {
      console.debug('Video time is less than 0. Going to previous video ...');
      const videoUrls = fields.find((field) => field.name === VideoDataTableFields.VIDEO_URL)?.values.toArray() || [];
      const uniqueVideoUrlsArray = [...new Set(videoUrls)];
      const currentVideoUrlIndex = uniqueVideoUrlsArray.indexOf(videoState.url);
      const previousVideoUrl = uniqueVideoUrlsArray[currentVideoUrlIndex - 1];
      newTimeSeconds = previousVideoUrl ? Math.max(0, videoRef.current.duration + newTime) : 0;
      newVideoUrl = previousVideoUrl || videoState.url;
    } else {
      console.debug('Video time is greater than 0. Rewinding 10 seconds ...');
      newVideoUrl = videoState.url;
      newTimeSeconds = newTime;
    }

    setVideoState({
      url: newVideoUrl,
      forcedTime: newTimeSeconds,
      speedPlayback: videoRef.current.playbackRate,
      play: !videoRef.current?.paused,
    });
    const newTimestamp = getTimestampByVideoTimeSecond(newTimeSeconds, newVideoUrl);
    stopProgressAnnotationUpdate();
    updateProgressAnnotation(newTimestamp, newVideoUrl);
  };

  /**
   * Skips to the next annotation in the video panel.
   * If there is a progress annotation, it finds the next annotation with a timestamp greater than the current video timestamp.
   * If the next annotation is within the video time range and has a valid video URL, it updates the video current time and progress annotation.
   */
  const skipToNextAnnotation = () => {
    if (progressAnnotation) {
      const currentVideoTimestamp: number =
        progressAnnotation.time ||
        getTimestampByVideoTimeSecond(Math.trunc(videoRef.current.currentTime), videoState.url);

      const nextAnnotation = markAnnotations.find(
        (annotation) => annotation.time && annotation.time > currentVideoTimestamp
      );

      if (
        nextAnnotation?.time &&
        nextAnnotation.data?.videoUrl &&
        isTimestampBetweenVideoTimeRange(nextAnnotation.time)
      ) {
        updateVideoCurrentTime(nextAnnotation.time, nextAnnotation.data?.videoUrl);
        updateProgressAnnotation(nextAnnotation.time, nextAnnotation.data?.videoUrl);
      }
    }
  };

  /**
   * Skips to the previous annotation in the video panel.
   */
  const skipToPreviousAnnotation = () => {
    if (progressAnnotation) {
      const currentVideoTimestamp: number =
        progressAnnotation.time ||
        getTimestampByVideoTimeSecond(Math.trunc(videoRef.current.currentTime), videoState.url);

      const filteredAnnotations = markAnnotations.filter(
        (annotation) => annotation.time && annotation.time < currentVideoTimestamp
      );
      const previousAnnotation: Partial<AnnotationData> | undefined =
        filteredAnnotations[filteredAnnotations.length - 1];

      if (previousAnnotation?.time && previousAnnotation.data?.videoUrl) {
        // setCurrentVideoTimeFromTimestampEvent(previousAnnotation.time, previousAnnotation.data?.videoUrl);
        updateVideoCurrentTime(previousAnnotation.time, previousAnnotation.data?.videoUrl);
        updateProgressAnnotation(previousAnnotation.time, previousAnnotation.data?.videoUrl);
      }
    }
  };

  /**
   * Checks if a given timestamp is between the first and last timestamps in the video time range.
   * @param timestamp The timestamp to check.
   * @returns True if the timestamp is between the first and last timestamps, false otherwise.
   */
  const isTimestampBetweenVideoTimeRange = useCallback(
    (timestamp: number) => {
      if (!timestamp) {
        return false;
      }

      const firstTimestamp = getDataByTimestamp(VideoDataTableFields.GRAPH_TIMESTAMP);
      const lastTimestamp = getDataByTimestamp(VideoDataTableFields.GRAPH_TIMESTAMP, Infinity);
      return timestamp >= firstTimestamp && timestamp <= lastTimestamp;
    },
    [getDataByTimestamp]
  );

  /**
   * This method used to update the video progress annotation when the video is playing
   * And to clear the interval when the video is paused
   */
  const startProgressAnnotationUpdate = useCallback((): NodeJS.Timeout => {
    return setInterval(async () => {
      console.debug('Updating video progress annotation ...');
      if (Object.keys(progressAnnotation).length > 0) {
        const currentVideoTimestamp = getTimestampByVideoTimeSecond(
          Math.trunc(videoRef.current.currentTime),
          videoState.url
        );
        updateProgressAnnotation(currentVideoTimestamp, progressAnnotation.data?.videoUrl);
      }
    }, REFRESH_INTERVAL_MS / videoState.speedPlayback);
  }, [
    videoState.speedPlayback,
    videoState.url,
    progressAnnotation,
    getTimestampByVideoTimeSecond,
    updateProgressAnnotation,
  ]);

  const stopProgressAnnotationUpdate = useCallback(() => {
    if (annotationProgressIntervalId) {
      clearInterval(annotationProgressIntervalId);
      setAnnotationProgressIntervalId(undefined);
      console.debug('Annotation progress update stopped.');
    }
  }, [annotationProgressIntervalId]);

  /**
   * Handles the data hover event.
   *
   * @param series - The data frame series.
   * @param rowIndex - The index of the row to handle.
   */
  const onDataHoverEvent = useCallback(
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
          const url = getDataByTimestamp(VideoDataTableFields.VIDEO_URL, timestamp);
          updateVideoCurrentTime(timestamp, url);
        }
      }
    },
    [updateVideoCurrentTime, getDataByTimestamp]
  );

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
    const currentVideoUrlIndex = uniqueVideoUrlsArray.indexOf(videoState.url);

    // Check if there is a next video URL
    if (currentVideoUrlIndex >= 0 && uniqueVideoUrlsArray[currentVideoUrlIndex + 1]) {
      const nextVideoUrl = uniqueVideoUrlsArray[currentVideoUrlIndex + 1];
      console.debug(' New video url found: ', nextVideoUrl);
      // Reset the video's current time to the beginning

      stopProgressAnnotationUpdate();
      setVideoState({
        url: nextVideoUrl,
        forcedTime: 0,
        speedPlayback: videoRef.current.playbackRate,
        play: true,
      });
    } else {
      console.debug("There's no next video URL");
      // If there is no next video URL, pause the video
      stopProgressAnnotationUpdate();
      pauseVideo();
    }
  };

  /**
   * Handles the time update event of the video.
   *
   * If the video is paused, it checks if the timestampEvent is between the first and last video timestamp. If so, it updates the progress annotation.
   *
   *
   * @param event - The time update event object.
   */
  const onVideoTimeUpdate = async (event: any) => {
    // if (videoRef.current.paused) {
    //   console.debug('Video time update', event);
    //   const firstVideoTimestamp = getDataByTimestamp(VideoDataTableFields.GRAPH_TIMESTAMP);
    //   const lastVideoTimestamp = getDataByTimestamp(VideoDataTableFields.GRAPH_TIMESTAMP, Infinity);
    //   if (
    //     timestampEvent >= firstVideoTimestamp &&
    //     timestampEvent <= lastVideoTimestamp &&
    //     progressAnnotation.time !== timestampEvent
    //   ) {
    //     updateProgressAnnotation(timestampEvent);
    //     refreshDashboard();
    //   }
    // }
  };

  const onVideoSpeedChange = (value: number) => {
    setVideoState({
      url: videoState.url,
      forcedTime: videoRef.current.currentTime,
      speedPlayback: value,
      play: !videoRef.current?.paused,
    });
  };

  const addMarkAnnotation = async () => {
    const currentTimestamp = getTimestampByVideoTimeSecond(Math.trunc(videoRef.current.currentTime), videoState.url);

    const data: AnnotationData = {
      // dashboardUID: '2xkhR8Y4k', If dashboardUID is not specified, general annotation is created
      isRegion: false,
      time: progressAnnotation.time || currentTimestamp,
      timeEnd: progressAnnotation.timeEnd || currentTimestamp,
      tags: [AnnotationTag.OPENVIDU],
      dashboardId: 1,
      // panelId: 10,
      text: `Annontation openvidu`,
      data: { videoUrl: videoState.url },
    };

    const annotation = await createAnnotation(data);
    if (annotation) {
      setMarkAnnotations([...markAnnotations, data]);
      refreshDashboard();
    }
  };

  /**
   * Effect to update the video properties when the video state changes.
   */
  useEffect(() => {
    console.debug('Something changed in video');
    if (videoRef) {
      if (videoState.url !== videoRef.current.currentSrc) {
        console.debug('Setting video url to: ', videoState.url);
        videoRef.current.src = videoState.url;
      }

      if (videoState.forcedTime !== undefined) {
        console.debug('Setting video time to: ', videoState.forcedTime);
        videoRef.current.currentTime = videoState.forcedTime;
      }

      if (videoState.speedPlayback !== videoRef.current.playbackRate) {
        console.debug('Setting video speed playback to: ', videoState.speedPlayback);
        videoRef.current.playbackRate = videoState.speedPlayback;
      }

      if (videoState.play) {
        console.debug('Paying video ...');
        videoRef.current?.play();
        if (!annotationProgressIntervalId) {
          const interval = startProgressAnnotationUpdate();
          setAnnotationProgressIntervalId(interval);
        }
      } else {
        if (!videoRef.current?.paused) {
          console.debug('Pausing video ...');
          videoRef.current?.pause();
        }
      }
    }
  }, [
    videoRef,
    videoState,
    annotationProgressIntervalId,
    startProgressAnnotationUpdate,
    setAnnotationProgressIntervalId,
  ]);

  /**
   * Check if the time range is between the first and last video timestamp.
   * If so, it updates the video URL and the video current time based on the time range.
   * If not, it updates the video URL and the video current time based on the first video timestamp.
   */
  useEffect(() => {
    console.log('Video panel DATA received: ', data);
    console.debug('Video panel OPTIONS received: ', options);
    console.debug('Video panel TIME RANGE: ', timeRange);

    const filterFromTimestamp = timeRange?.from?.toDate()?.getTime() ?? 0;

    if (isTimestampBetweenVideoTimeRange(filterFromTimestamp)) {
      console.debug(
        `Video panel TIMESTAMP (from timeRange): ${filterFromTimestamp} | ${new Date(filterFromTimestamp)}`
      );
      console.debug(`Setting VIDEO URL by timestamp: ${filterFromTimestamp} ...`);
      const newVideoUrl = getDataByTimestamp(VideoDataTableFields.VIDEO_URL, filterFromTimestamp);
      updateVideoCurrentTime(filterFromTimestamp, newVideoUrl);
    } else {
      const firstVideoTimestamp = getDataByTimestamp(VideoDataTableFields.GRAPH_TIMESTAMP);
      console.debug('Video panel TIMESTAMP (from timeRange) is not between video timestamps');
      console.debug(`Setting VIDEO URL by first video timestamp: ${firstVideoTimestamp} ...`);
      const newVideoUrl = getDataByTimestamp(VideoDataTableFields.VIDEO_URL, firstVideoTimestamp);
      console.log('New video url: ', videoRef);
      updateVideoCurrentTime(firstVideoTimestamp, newVideoUrl);
    }

    return () => {
      console.debug('VideoPanel unmounted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange.raw.from, timeRange.raw.to]);

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
          onDataHoverEvent(data, rowIndex);
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
  }, [eventBus, onDataHoverEvent]);

  /**
   * Load annotations when component is mounted
   */
  useEffect(() => {
    getAnnotations().then(async (annotations: AnnotationData[]) => {
      console.debug('Annotations found: ', annotations);

      const markAnnotations = annotations.filter((a) => a.tags.includes(AnnotationTag.OPENVIDU));
      const pAnnotation: AnnotationData | {} =
        annotations.filter((a) => a.tags.includes(AnnotationTag.PROGRESS))[0] || {};

      const fromTimestampFilter = timeRange?.from?.toDate()?.getTime();
      const firstVideoTimestamp = getDataByTimestamp(VideoDataTableFields.GRAPH_TIMESTAMP);
      const annotationTime = isTimestampBetweenVideoTimeRange(fromTimestampFilter)
        ? fromTimestampFilter
        : firstVideoTimestamp;

      if (Object.keys(pAnnotation).length > 0) {
        console.debug('Video progress annotation found: ', pAnnotation);
        (pAnnotation as AnnotationData).time = annotationTime;
        (pAnnotation as AnnotationData).timeEnd = annotationTime;
        (pAnnotation as AnnotationData).data = { videoUrl: videoState.url };
        await updateAnnotation(pAnnotation, annotationTime);
        setProgressAnnotation(pAnnotation);
      } else {
        console.debug('Video progress annotation not found. Creating it ...');

        const data: AnnotationData = {
          // dashboardUID: '2xkhR8Y4k', If dashboardUID is not specified, general annotation is created
          isRegion: false,
          time: annotationTime,
          timeEnd: annotationTime,
          tags: [AnnotationTag.PROGRESS],
          dashboardId: 1,
          // panelId: 10,
          text: `Annontation progress`,
          data: { videoUrl: videoState.url },
        };

        await createAnnotation(data);
        setProgressAnnotation(data);
      }
      setMarkAnnotations(markAnnotations);
      refreshDashboard();
    });

    return () => {
      // Restore video progress annotation to the first video timestamp
      const firstVideoTimestamp = getDataByTimestamp(VideoDataTableFields.GRAPH_TIMESTAMP);
      const firstVideoUrl = getDataByTimestamp(VideoDataTableFields.VIDEO_URL, firstVideoTimestamp);
      updateProgressAnnotation(firstVideoTimestamp, firstVideoUrl);
      setMarkAnnotations([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange.raw.from, timeRange.raw.to]);

  return (
    <div className="video-panel">
      <div>
        <video
          ref={videoRef}
          width={width}
          height={height / 1.5}
          controls
          disablePictureInPicture
          controlsList="nodownload noplaybackrate"
          onEnded={() => onVideoEnded()}
          onTimeUpdate={(event) => {
            onVideoTimeUpdate(event);
          }}
        />
        <div className="controls">
          <IconButton
            aria-label="more"
            aria-controls={Boolean(speedMenuContent) ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={Boolean(speedMenuContent) ? 'true' : undefined}
            onClick={(ev) => setSpeedMenuContent(ev.currentTarget)}
          >
            {videoRef?.current?.playbackRate}x
          </IconButton>
          <Menu
            id="long-menu"
            MenuListProps={{
              'aria-labelledby': 'long-button',
            }}
            anchorEl={speedMenuContent}
            open={Boolean(speedMenuContent)}
            onClose={() => setSpeedMenuContent(null)}
          >
            {VIDEO_SPEED_OPTIONS.map((option) => (
              <MenuItem
                key={option}
                selected={option === videoRef?.current?.playbackRate}
                value={option}
                onClick={() => {
                  onVideoSpeedChange(option);
                  setSpeedMenuContent(null);
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
          <Tooltip title={videoState.play ? 'Pause video' : 'Play Video'}>
            <IconButton
              className="icon-btn"
              onClick={
                videoState.play
                  ? () => {
                      pauseVideo();
                      stopProgressAnnotationUpdate();
                    }
                  : () => {
                      playVideo();
                      if (!annotationProgressIntervalId) {
                        const interval = startProgressAnnotationUpdate();
                        setAnnotationProgressIntervalId(interval);
                      }
                    }
              }
              size="large"
            >
              {videoState.play ? <PauseIcon fontSize="inherit" /> : <PlayArrowIcon fontSize="inherit" />}
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
            <IconButton color="secondary" onClick={addMarkAnnotation} size="large">
              <LabelIcon fontSize="inherit" className="annotation-icon add" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete all marks">
            <IconButton
              color="secondary"
              onClick={async () => {
                await deleteAnnotations(markAnnotations);
                refreshDashboard();
              }}
              size="large"
            >
              <LabelOffOutlinedIcon fontSize="inherit" className="annotation-icon delete" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
