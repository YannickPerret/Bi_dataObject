/**
 * Interface for AWS Data Object operations.
 * @interface IAwsDataObject
 */

/**
 * Initializes the AWS S3 service.
 * @function
 * @name IAwsDataObject#init
 * @returns {Promise<void>}
 */

/**
 * Creates a new bucket.
 * @function
 * @name IAwsDataObject#createBucket
 * @returns {Promise<void>}
 */

/**
 * Checks if a bucket exists.
 * @function
 * @name IAwsDataObject#doesBucketExist
 * @param {string} bucketName - The name of the bucket.
 * @returns {Promise<boolean>}
 */

/**
 * Checks if an object exists in the bucket.
 * @function
 * @name IAwsDataObject#doesObjectExist
 * @param {string} key - The key of the object.
 * @returns {Promise<boolean>}
 */

/**
 * Uploads an object to the bucket.
 * @function
 * @name IAwsDataObject#uploadObject
 * @param {Buffer|string} fileContent - The content of the file to upload.
 * @param {string} fileName - The name of the file to upload.
 * @returns {Promise<Object>}
 */

/**
 * Downloads an object from the bucket.
 * @function
 * @name IAwsDataObject#downloadObject
 * @param {string} key - The key of the object to download.
 * @param {string} localPath - The local path where the file will be saved.
 * @returns {Promise<void>}
 */

/**
 * Publishes an object by generating a signed URL.
 * @function
 * @name IAwsDataObject#publish
 * @param {string} remoteFullPath - The full path of the object to publish.
 * @param {number} [expirationTime=90] - The expiration time of the signed URL in seconds.
 * @returns {Promise<string>} The signed URL.
 */

/**
 * Removes an object or objects recursively from the bucket.
 * @function
 * @name IAwsDataObject#remove
 * @param {string} remoteFullPath - The full path of the object(s) to remove.
 * @returns {Promise<void>}
 */
