const AwsDataObjectImpl = require('../libs/AwsDataObjectImpl');
const fs = require('fs');
require("dotenv").config();
const https = require('https');
const path = require('path');
const { ObjectNotFoundException } = require('../libs/exceptions/AwsDataObjectImplException');

const AWSBucket = new AwsDataObjectImpl(process.env.BUCKET_NAME, process.env.REGION, process.env.ACCESS_KEY_ID, process.env.SECRET_ACCESS_KEY);

afterEach(async () => {
  // delete object test.jpg 
  await AWSBucket.remove("test.jpg");
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

  const localDist = path.join(__dirname, '/download/test.jpg');
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

  await expect(AWSBucket.downloadObject(objectUri)).rejects.toThrow(ObjectNotFoundException);
});


test('Publish_ObjectExists_PublicUrlCreated', async () => {
  const localFile = path.join(__dirname, '/images/valid.jpg');
  const objectUri = "test.jpg";
  const destinationFolder = path.join(__dirname, '/download');

  if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder, { recursive: true });
  }

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

  await expect(AWSBucket.publish(objectKey.Key)).rejects.toThrow(ObjectNotFoundException);

});

test('Remove_ObjectPresentNoFolder_ObjectRemoved', async () => {
  const localFile = "./images/valid.jpg";
  const objectUri = "test.jpg";
  const objectKey = await AWSBucket.uploadObject(localFile, objectUri);

  expect(await AWSBucket.doesObjectExist(objectKey.Key)).toBe(true);

  await AWSBucket.remove(objectUri);

  expect(await AWSBucket.doesObjectExist(objectKey.Key)).toBe(false);
});


test('Remove_ObjectAndFolderPresent_ObjectRemoved', async () => {
  const localFile = path.join(__dirname, '/images/valid.jpg');
  const objectUri = "test.jpg";
  const objectUriWithSubFolder = "folder1/test.jpg";

  // Upload both files
  const objectKey = await AWSBucket.uploadObject(localFile, objectUri);
  const objectKeyWithSubFolder = await AWSBucket.uploadObject(localFile, objectUriWithSubFolder);

  // Verify both files exist
  expect(await AWSBucket.doesObjectExist(objectUri)).toBe(true);
  expect(await AWSBucket.doesObjectExist(objectUriWithSubFolder)).toBe(true);

  // Delete both files
  await AWSBucket.remove(objectUri);
  await AWSBucket.remove(objectUriWithSubFolder);

  // Verify both files are deleted
  expect(await AWSBucket.doesObjectExist(objectUri)).toBe(false);
  expect(await AWSBucket.doesObjectExist(objectUriWithSubFolder)).toBe(false);
});
