import axios from 'axios';

export interface AnnotationData {
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

/**
 * Creates an annotation with the specified tags.
 *
 * @param tags - The tags associated with the annotation.
 * @returns A promise that resolves to a partial annotation data object.
 */
export const createAnnotation = async (data: AnnotationData): Promise<Partial<AnnotationData>> => {
  const url = '/api/annotations';
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  try {
    const response = await axios.post(url, data, { headers });
    data.id = response.data.id;
    return data;
  } catch (error) {
    console.log('error', error);
    return {};
  }
};

export const findAnnotation = async (): Promise<AnnotationData[]> => {
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
};

/**
 * Updates an annotation with the provided data.
 *
 * @param annotation - The partial annotation data to update.
 * @param time - The time value for the annotation.
 * @returns A promise that resolves to the updated partial annotation data, or undefined if an error occurs.
 */
export const updateAnnotation = async (
  annotation: Partial<AnnotationData>,
  time: number
): Promise<Partial<AnnotationData> | undefined> => {
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
};
