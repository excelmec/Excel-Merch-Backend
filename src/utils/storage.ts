import { Storage } from '@google-cloud/storage';
import { BUCKET_NAME } from './env';

export const storage = new Storage();
export const storageBucket = storage.bucket(BUCKET_NAME);

export { BUCKET_NAME };
