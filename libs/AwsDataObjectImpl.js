const AWS = require('aws-sdk');
const fs = require('fs');
const IAwsDataObject = require('./IAwsDataObject');
const { ObjectNotFoundException } = require('./exceptions/AwsDataObjectImplException');


/**
 * Implement of IAwsDataObject interface using AWS SDK.
 * @class
 * @implements {IAwsDataObject}
 */


class AwsDataObjectImpl {
  constructor(bucketName, region, accessKeyId, secretAccessKey) {
    this.bucketName = bucketName;
    this.s3 = null;
    this.region = region;
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.init();
  }

  async init() {
    try {
      this.s3 = new AWS.S3({
        region: this.region,
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey
      });

      await this.doesBucketExist();
    } catch (err) {
      if (err.code === 'NotFound') {
        await this.createBucket();
      } else {
        throw err;
      }
    }
  }

  async createBucket() {
    const params = { Bucket: this.bucketName, ACL: 'public-read' };
    try {
      await this.s3.createBucket(params).promise();
    } catch (err) {
      throw err;
    }
  }

  async doesBucketExist(bucketName) {
    try {
      await this.s3.headBucket({ Bucket: bucketName }).promise();
      return true;
    } catch (err) {
      return false;
    }
  }

  async doesObjectExist(key) {
    if (typeof key !== 'string') {
      throw new TypeError('key must be a string');
    }
    try {
      await this.s3.headObject({ Bucket: this.bucketName, Key: key }).promise();
      return true;
    } catch (err) {
      return false;
    }
  }

  async uploadObject(fileContent, fileName) {

    const params = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileContent,
      ContentType: 'image/jpeg'
    };

    try {
      const data = await this.s3.upload(params).promise();
      return data;
    } catch (err) {
      throw err;
    }
  }

  async downloadObject(key, localPath) {
    if (typeof key !== 'string') {
      throw new TypeError('key must be a string');
    }
    if (localPath && typeof localPath !== 'string') {
      throw new TypeError('localPath must be a string');
    }
    const params = {
      Bucket: this.bucketName,
      Key: key
    };

    try {
      const data = await this.s3.getObject(params).promise();
      fs.writeFileSync(localPath, data.Body);
    } catch (err) {
      throw new ObjectNotFoundException(err.message);
    }
  }

  async publish(remoteFullPath, expirationTime = 90) {
    if (remoteFullPath && typeof remoteFullPath !== 'string') {
      throw new TypeError('key must be a string');
    }
    const params = {
      Bucket: this.bucketName,
      Key: remoteFullPath,
      Expires: expirationTime
    };

    try {
      const objectExists = await this.doesObjectExist(remoteFullPath);
      if (!objectExists) {
        throw new Error('NoSuchKey: The specified key does not exist.');
      }

      const url = await this.s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (err) {
      throw new ObjectNotFoundException(err.message);
    }
  }

  async remove(remoteFullPath) {
    if (typeof remoteFullPath !== 'string') {
      throw new TypeError('remoteFullPath must be a string');
    }
    const listParams = {
      Bucket: this.bucketName,
      Prefix: remoteFullPath
    };

    try {
      const listedObjects = await this.s3.listObjectsV2(listParams).promise();

      if (listedObjects.Contents.length === 0) return;

      const deleteParams = {
        Bucket: this.bucketName,
        Delete: {
          Objects: listedObjects.Contents.map(({ Key }) => ({ Key }))
        }
      };

      await this.s3.deleteObjects(deleteParams).promise();

      if (listedObjects.IsTruncated) await this.deleteObjectsRecursive(remoteFullPath)

    } catch (err) {
      throw err;
    }
  }
}

module.exports = AwsDataObjectImpl;
