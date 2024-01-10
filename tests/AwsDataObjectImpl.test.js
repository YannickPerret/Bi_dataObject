const AwsDataObjectImpl = require('../libs/AwsDataObjectImpl');
const fs = require('fs');
require("dotenv").config();
const https = require('https');
const path = require('path');

const AWSBucket = new AwsDataObjectImpl(process.env.BUCKET_NAME, process.env.REGION, process.env.ACCESS_KEY_ID, process.env.SECRET_ACCESS_KEY);

beforeEach(async () => {
  // delete object test.jpg 
  await AWSBucket.deleteObject("test.jpg");
});


test('doesBucketExist', async () => {
  const bucketUri = process.env.BUCKET_NAME;
  expect(await AWSBucket.doesBucketExist(bucketUri)).toBe(true);
});

test('DoesExist_ExistingObject_ObjectExists', async () => {
  const localFile = "./images/valid.jpg";
  const objectUri = "test.jpg";
  const objectKey = await AWSBucket.uploadObject(localFile, objectUri);

  expect(await AWSBucket.doesObjectExist(objectKey.Key)).toBe(true);
});

test('DoesExist_MissingObject_ObjectNotExists', async () => {
  const objectUri = "test.jpg";
  expect(await AWSBucket.doesObjectExist(objectUri)).toBe(false);
})

test('Upload_BucketAndLocalFileAreAvailable_NewObjectCreatedOnBucket', async () => {
  const localFile = "./images/valid.jpg";

  const objectUri = "test.jpg";
  const bucketUri = process.env.BUCKET_NAME;

  expect(await AWSBucket.doesBucketExist(bucketUri)).toBe(true);
  expect(await AWSBucket.doesObjectExist(objectUri)).toBe(false);

  await AWSBucket.uploadObject(localFile, objectUri);

  expect(await AWSBucket.doesObjectExist(objectUri)).toBe(true);
});

test('Download_ObjectAndLocalPathAvailable_ObjectDownloaded', async () => {
  const localFile = "./images/valid.jpg";
  const objectUri = "test.jpg";

  const localDist = path.join(__dirname, '/download/test.jpg"');
  const objectKey = await AWSBucket.uploadObject(localFile, objectUri);

  expect(await AWSBucket.doesObjectExist(objectKey.Key)).toBe(true);
  expect(fs.existsSync(localFile)).toBe(false);

  await AWSBucket.downloadObject(objectUri, localDist);

  expect(fs.existsSync(localDist)).toBe(true);
});


test('Download_ObjectMissing_ThrowException', async () => {
  const localFile = path.join(__dirname, '/image/testss.jpg');
  const objectUri = "test.jpg";

  expect(await fs.existsSync(localFile)).toBe(false);

  expect(await AWSBucket.doesObjectExist(objectUri)).toBe(false);

  await expect(AWSBucket.downloadObject(objectUri)).rejects.toThrow("The specified key does not exist.");
});


test('Publish_ObjectExists_PublicUrlCreated', async () => {
  const localFile = path.join(__dirname, '/images/valid.jpg');
  const objectUri = "test.jpg";
  const destinationFolder = path.join(__dirname, '/download');
  const destinationFile = path.join(destinationFolder, 'test.jpg');

  const objectKey = await AWSBucket.uploadObject(localFile, objectUri);

  expect(await AWSBucket.doesObjectExist(objectKey.Key)).toBe(true);

  const presignedUrl = await AWSBucket.publish(objectUri);

  // Download file via https
  const file = fs.createWriteStream(destinationFile);
  const request = https.get(presignedUrl, function (response) {
    response.pipe(file);
    file.on('finish', function () {
      file.close(() => {
        expect(fs.existsSync(destinationFile)).toBe(true);
      });
    });
  }).on('error', function (err) {
    fs.unlinkSync(destinationFile);
    throw err;
  });
});


test('Publish_ObjectMissing_ThrowException', async () => {
  const objectUri = "notvalidd.jpg";
  const objectKey = await AWSBucket.doesObjectExist(objectUri)
  expect(objectKey).toBe(false);

  await expect(AWSBucket.publish(objectKey.Key)).rejects.toThrow("The specified key does not exist.");

});

test('Remove_ObjectPresentNoFolder_ObjectRemoved', async () => {
  const localFile = "./images/valid.jpg";
  const objectUri = "test.jpg";
  const objectKey = await AWSBucket.uploadObject(localFile, objectUri);

  expect(await AWSBucket.doesObjectExist(objectKey.Key)).toBe(true);

  await AWSBucket.deleteObject(objectUri);

  expect(await AWSBucket.doesObjectExist(objectKey.Key)).toBe(false);
});