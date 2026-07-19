import { S3Client } from '@aws-sdk/client-s3';
import { 
	BACKBLAZE_B2_KEY_ID, 
	BACKBLAZE_B2_APPLICATION_KEY, 
	BACKBLAZE_B2_ENDPOINT, 
	BUCKET_NAME 
} from './env';

export const s3Client = new S3Client({
	endpoint: `https://${BACKBLAZE_B2_ENDPOINT}`,
	region: 'us-east-1', // Required by S3 SDK, can be anything for B2 usually, or specific if needed
	credentials: {
		accessKeyId: BACKBLAZE_B2_KEY_ID,
		secretAccessKey: BACKBLAZE_B2_APPLICATION_KEY,
	},
});

export { BUCKET_NAME };
