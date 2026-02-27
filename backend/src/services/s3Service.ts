import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'ru-1',
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
    },
    forcePathStyle: true, // Required for many S3-compatible providers
});

const BUCKET = process.env.S3_BUCKET;

/**
 * Uploads a file buffer to S3
 * @param buffer File content buffer
 * @param key Unique file name/path in bucket
 * @param contentType MIME type
 */
export async function uploadFile(buffer: Buffer, key: string, contentType: string) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // ACL: 'private' // Default is private
    });

    try {
        await s3Client.send(command);
        return {
            key,
            url: `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`
        };
    } catch (error) {
        console.error('S3 Upload Error:', error);
        throw error;
    }
}

/**
 * Generates a signed URL for a private file
 * @param key File key in bucket
 * @param expiresIn Seconds until expiration (default 1 hour)
 */
export async function getSignedFileUrl(key: string, expiresIn: number = 3600) {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });

    try {
        return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
        console.error('S3 Signed URL Error:', error);
        throw error;
    }
}

/**
 * Deletes a file from S3
 * @param key File key in bucket
 */
export async function deleteFile(key: string) {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error('S3 Delete Error:', error);
        throw error;
    }
}
