const AWS = require('aws-sdk');
const fs = require('fs');

function encode(data) {
  let buf = Buffer.from(data);
  let base64 = buf.toString("base64");
  return base64;
}

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
    try {
      await this.s3.headObject({ Bucket: this.bucketName, Key: key }).promise();
      return true;
    } catch (err) {
      return false;
    }
  }

  async uploadObject(fileContent, fileName) {
    // Assurez-vous que fileContent est un Buffer ou un flux binaire
    const params = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileContent,
      ContentType: 'image/jpeg'
    };

    try {
      const data = await this.s3.upload(params).promise();
      console.log("File uploaded successfully");
      return data;
    } catch (err) {
      console.error("Error uploading file:", err);
      throw err;
    }
  }

  // download object from bucket to localPath
  async downloadObject(key, localPath) {
    const params = {
      Bucket: this.bucketName,
      Key: key
    };

    try {
      const data = await this.s3.getObject(params).promise();
      console.log(data.Body.toString())
      fs.writeFileSync(localPath, data.Body.toString());
      console.log("File downloaded successfully");
    } catch (err) {
      console.error("Error downloading file:", err);
      throw err;
    }
  }

  async publish(key) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: 60 * 60 * 24 * 7 // 7 days
    };

    try {
      const url = await this.s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (err) {
      console.error("Error publishing file:", err);
      throw err;
    }
  }

  async deleteObject(key) {
    const params = {
      Bucket: this.bucketName,
      Key: key
    };

    try {
      await this.s3.deleteObject(params).promise();
    } catch (err) {
      console.error("Error deleting file:", err);
      throw err;
    }
  }
}

module.exports = AwsDataObjectImpl;
