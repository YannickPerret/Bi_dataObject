const AWS = require('aws-sdk');

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

    static doesObjectExist(bucketName, key) {
        const s3 = new AWS.S3();
        return s3.headObject({Bucket: bucketName, Key: key}).promise();
    }

    async createBucket() {
        const params = {Bucket: this.bucketName, ACL: 'public-read'};
        try {
            await this.s3.createBucket(params).promise();
            console.log(`Bucket created successfully. ${this.bucketName}`);
        } catch (err) {
            console.error("Error creating bucket:", err);
            throw err;
        }
    }

    async doesBucketExist(bucketName = this.bucketName) {
        try {
            await this.s3.headBucket({Bucket: bucketName}).promise();
            console.log(`Bucket exists. ${bucketName}`);
            return true;
        } catch (err) {
            console.error("Error checking bucket:", err);
            return false;
        }
    }

    async uploadObject(fileContent, fileName) {
      // Assurez-vous que fileContent est un Buffer ou un flux binaire
      const params = {
          Bucket: this.bucketName,
          Key: fileName,
          Body: fileContent,
          ContentType: 'image/jpeg' // Assurez-vous que cela correspond au type de fichier réel
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

  async downloadObject(key) {
    const params = {
      Bucket: this.bucketName,
      Key: key
    };

    try {
      const data = await this.s3.getObject(params).promise();
      return "data:image/jpeg;base64," + encode(data.Body)
    } catch (err) {
      console.error("Error downloading file:", err);
      throw err;
    }
  }

  async getImage(key, expiration = 90) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: expiration
    };

    try {
      const data = await this.s3.getSignedUrl("getObject", params)
      return data;
    } catch (err) {
      console.error("Error get image :", err);
      throw err;
    }
  }
}

module.exports = AwsDataObjectImpl;
