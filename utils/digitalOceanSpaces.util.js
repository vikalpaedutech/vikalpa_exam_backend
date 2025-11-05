// // utils/doSpaces.utils.js

// import dotenv from 'dotenv';
// dotenv.config();

// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// // DigitalOcean S3 client setup
// const s3 = new S3Client({
//   endpoint: process.env.DO_SPACES_ENDPOINT, // e.g., 'https://blr1.digitaloceanspaces.com'
//   region: process.env.DO_SPACES_REGION,
//   credentials: {
//     accessKeyId: process.env.DO_SPACES_KEY,
//     secretAccessKey: process.env.DO_SPACES_SECRET,
//   },
// });

// /**
//  * Upload a file buffer to DigitalOcean Spaces
//  * @param {Buffer} fileBuffer - The file buffer
//  * @param {string} fileName - Desired name in the bucket
//  * @param {string} mimeType - MIME type of the file
//  * @returns {Promise<string>} - Public file URL
//  */
// export const uploadToDOStorage = async (fileBuffer, fileName, mimeType) => {
//   const bucketName = process.env.DO_SPACES_BUCKET || 'vikalpaexamination'; // fallback to hardcoded

//   const command = new PutObjectCommand({
//     Bucket: bucketName,
//     Key: `expenses/${fileName}`,
//     Body: fileBuffer,
//     ACL: 'public-read',
//     ContentType: mimeType,
//   });

//   await s3.send(command);

//   // Public URL (DigitalOcean Spaces allows public read with ACL)
//   const fileUrl = `${process.env.DO_SPACES_CDN || `https://${bucketName}.${process.env.DO_SPACES_ENDPOINT.replace('https://', '')}`}/examinationRegistrationImages/${fileName}`;

//   return fileUrl;
// };










// utils/doSpaces.utils.js
import dotenv from 'dotenv';
dotenv.config();

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// DigitalOcean S3 client setup
const s3 = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT, // e.g., 'https://blr1.digitaloceanspaces.com'
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});

/**
 * Upload a file buffer to DigitalOcean Spaces
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} fileName - Desired name in the bucket (just filename, no folder)
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} - Public file URL
 */
export const uploadToDOStorage = async (fileBuffer, fileName, mimeType) => {
  const bucketName = process.env.DO_SPACES_BUCKET || 'vikalpaexamination';
  // choose ONE folder name for both upload key and public URL
  const folder = 'examinationRegistrationImages';

  // Key used for storing the object in the Space
  const key = `${folder}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ACL: 'public-read',
    ContentType: mimeType,
  });

  await s3.send(command);

  // Build public URL:
  // - If you provided DO_SPACES_CDN (custom CDN endpoint), use that.
  // - Otherwise use: https://{bucket}.{endpointHost}/{key}
  const endpointHost = (process.env.DO_SPACES_ENDPOINT || '').replace(/^https?:\/\//, '').replace(/\/$/, '');

  const fileUrl = process.env.DO_SPACES_CDN && process.env.DO_SPACES_CDN.length
    ? `${process.env.DO_SPACES_CDN.replace(/\/$/, '')}/${key}`
    : `https://${bucketName}.${endpointHost}/${key}`;

  return fileUrl;
};
