// Storage abstraction layer for Netlify
// Supports: Netlify Blobs, AWS S3, or filesystem

export async function uploadFile(path, buffer, options = {}) {
  const storageType = process.env.STORAGE_TYPE || 'netlify-blobs';
  
  if (storageType === 'netlify-blobs') {
    return uploadToNetlifyBlobs(path, buffer, options);
  } else if (storageType === 's3') {
    return uploadToS3(path, buffer, options);
  } else {
    throw new Error('Unsupported storage type: ' + storageType);
  }
}

async function uploadToNetlifyBlobs(path, buffer, options = {}) {
  try {
    // Using Netlify Blobs API via fetch
    const response = await fetch('/.netlify/blobs/upload', {
      method: 'POST',
      headers: {
        'Content-Type': options.contentType || 'application/octet-stream',
      },
      body: JSON.stringify({
        path: path,
        data: buffer.toString('base64'),
        metadata: options.metadata || {}
      })
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      url: result.url || `/.netlify/blobs/${path}`,
      path: path,
      size: buffer.length
    };
  } catch (error) {
    // Fallback: If Netlify Blobs not available, use a simple approach
    // In production, configure S3 or similar
    console.warn('Netlify Blobs not available, ensure STORAGE_TYPE=s3 with S3 credentials', error);
    throw error;
  }
}

async function uploadToS3(path, buffer, options = {}) {
  // AWS S3 upload implementation
  // Requires: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, AWS_REGION
  const AWS = require('aws-sdk');
  
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  });
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: path,
    Body: buffer,
    ContentType: options.contentType || 'application/octet-stream',
    ACL: 'public-read'
  };
  
  const result = await s3.upload(params).promise();
  
  return {
    url: result.Location,
    path: path,
    size: buffer.length
  };
}

export async function getFile(path) {
  const storageType = process.env.STORAGE_TYPE || 'netlify-blobs';
  
  if (storageType === 'netlify-blobs') {
    return getFromNetlifyBlobs(path);
  } else if (storageType === 's3') {
    return getFromS3(path);
  }
}

async function getFromNetlifyBlobs(path) {
  const response = await fetch(`/.netlify/blobs/${path}`);
  if (!response.ok) throw new Error('File not found');
  return response.arrayBuffer();
}

async function getFromS3(path) {
  const AWS = require('aws-sdk');
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  });
  
  const result = await s3.getObject({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: path
  }).promise();
  
  return result.Body;
}
