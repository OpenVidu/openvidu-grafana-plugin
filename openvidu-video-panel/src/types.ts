type SeriesSize = 'sm' | 'md' | 'lg';

export interface VideoOptions {
  url: string;
  text: string;
  showSeriesCount: boolean;
  seriesCountSize: SeriesSize;
}
