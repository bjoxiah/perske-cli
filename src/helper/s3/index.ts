import {
  CreateBucketCommand,
  PutBucketWebsiteCommand,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  HeadBucketCommand,
  _Object,
  PutBucketPolicyCommand,
  GetBucketPolicyCommand,
  ListObjectsCommandOutput,
  PutPublicAccessBlockCommand,
  PutBucketWebsiteCommandOutput,
  PutBucketWebsiteCommandInput,
  PutObjectCommandInput,
  DeleteObjectsCommandOutput,
  PutPublicAccessBlockCommandInput,
  CreateBucketCommandOutput,
} from '@aws-sdk/client-s3'
import { filesystem, print } from 'gluegun'
import * as path from 'path'
import 'dotenv/config'
import * as mime from 'mime'
import { CloudFrontOriginAccessIdentity } from '@aws-sdk/client-cloudfront'

// require('dotenv').config()
const client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
})

export const createS3Bucket = async (
  s3BucketName: string
): Promise<CreateBucketCommandOutput> => {
  try {
    return await client.send(new CreateBucketCommand({ Bucket: s3BucketName }))
  } catch (error) {
    print.error(`Could not create S3 Bucket - ${JSON.stringify(error)}`)
    process.exit()
  }
}

// A utility function to configure a bucket for static web hosting
export const configureBucketForHosting = async (
  s3BucketName: string
): Promise<PutBucketWebsiteCommandOutput> => {
  const websiteConfig: PutBucketWebsiteCommandInput = {
    Bucket: s3BucketName,
    WebsiteConfiguration: {
      ErrorDocument: {
        Key: 'index.html', // Assuming you have an error.html file in your dist folder
      },
      IndexDocument: {
        Suffix: 'index.html',
      },
    },
  }

  try {
    const response = await client.send(
      new PutBucketWebsiteCommand(websiteConfig)
    )
    print.info(
      `Configure Bucket For Hosting Response ${JSON.stringify(response)}`
    )
    return response
  } catch (error) {
    print.error(
      `Could not configure bucket for hosting ${JSON.stringify(error)}`
    )
    return
  }
}

// A utility function to upload files to a bucket
const uploadFile = async (
  filePath: string,
  s3BucketName: string,
  rootDir: string
): Promise<PutObjectCommandOutput> => {
  const fileContent = await filesystem.readAsync(filePath)
  const fileName = path.basename(filePath)
  const fileExtension = path.extname(fileName).toLowerCase()
  const relativePath = path.relative(rootDir, filePath)
  const key = relativePath.split(path.sep).join('/')
  const contentType = mime.getType(fileExtension) || 'application/octet-stream'
  print.info(contentType)

  const params: PutObjectCommandInput = {
    Bucket: s3BucketName,
    Key: key, // File name you want to save as in S3
    Body: fileContent,
    ContentType: contentType,
  }

  try {
    const putCommand = new PutObjectCommand(params)
    return await client.send(putCommand)
  } catch (error) {
    print.error(`Could not upload the file ${JSON.stringify(error)}`)
    return
  }
}

// Recursively upload the 'build' directory files
export const uploadDirectory = async (
  directoryPath: string,
  s3BucketName: string,
  rootDir: string
): Promise<void> => {
  const dirContent = await filesystem.listAsync(directoryPath)

  for (const file of dirContent) {
    const fullPath = path.join(directoryPath, file)
    if (filesystem.isDirectory(fullPath)) {
      print.info(`Path to upload: ${fullPath}`)
      await uploadDirectory(fullPath, s3BucketName, rootDir) // Recursive call for sub-directories
    } else {
      print.info(`File to upload: ${fullPath}`)
      const uploadData = await uploadFile(fullPath, s3BucketName, rootDir) // Upload each file
      print.highlight(`Upload response: ${JSON.stringify(uploadData)}`)
    }
  }
}

// List objects in the bucket
export const listObjectsInBucket = async (
  bucketName: string
): Promise<ListObjectsCommandOutput> => {
  try {
    const data = await client.send(
      new ListObjectsV2Command({ Bucket: bucketName })
    )
    return data
  } catch (error) {
    print.error(`Could not list objects in S3 Bucket ${JSON.stringify(error)}`)
    return
  }
}

// Delete objects in the bucket
export const deleteObjectsInBucket = async (
  s3BucketName: string,
  objectsToDelete: _Object[]
): Promise<DeleteObjectsCommandOutput> => {
  try {
    return await client.send(
      new DeleteObjectsCommand({
        Bucket: s3BucketName,
        Delete: {
          Objects: objectsToDelete.map((obj) => ({ Key: obj.Key })),
        },
      })
    )
  } catch (error) {
    print.error(`Could not delete object ${JSON.stringify(error)}`)
    return
  }
}

export const bucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucketName }))
    return true
  } catch (error) {
    return false
  }
}

export const getBucketPolicy = async (bucketName: string): Promise<string> => {
  const bucketPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucketName}/*`,
      },
    ],
  }

  return JSON.stringify(bucketPolicy)
}

export const setBucketPolicy = async (bucketName: string): Promise<void> => {
  try {
    const policyString = await getBucketPolicy(bucketName)
    const params = {
      Bucket: bucketName,
      Policy: policyString,
    }
    const data = await client.send(new PutBucketPolicyCommand(params))
    print.info(`Bucket policy updated successfully: ${JSON.stringify(data)}`)
  } catch (err) {
    print.error(`Bucket Policy Update Error: ${JSON.stringify(err)}`)
  }
}

export const getS3BucketPolicy = async (bucketName: string): Promise<void> => {
  try {
    const data = await client.send(
      new GetBucketPolicyCommand({ Bucket: bucketName })
    )
    print.info(`Current Bucket policy: ${JSON.stringify(data)}`)
  } catch (err) {
    print.error(`Get Current Bucket Policy Error: ${JSON.stringify(err)}`)
  }
}

export const disableBlockPublicAccess = async (
  bucketName: string,
  status: boolean
): Promise<void> => {
  try {
    const params: PutPublicAccessBlockCommandInput = {
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: status,
        IgnorePublicAcls: status,
        BlockPublicPolicy: status,
        RestrictPublicBuckets: status,
      },
    }
    await client.send(new PutPublicAccessBlockCommand(params))
    print.info(
      `Block public access ${status ? 'enabled' : 'disabled'} for ${bucketName}`
    )
  } catch (err) {
    print.error(`Error disabling block public access: ${JSON.stringify(err)}`)
  }
}

export const updateS3BucketPolicyForCloudFront = async (
  bucketName: string,
  oaiId: CloudFrontOriginAccessIdentity
): Promise<void> => {
  try {
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            CanonicalUser: oaiId.S3CanonicalUserId,
          },
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`,
        },
      ],
    }
    await client.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(bucketPolicy),
      })
    )
    print.info(`Cloud front Bucket policy updated for ${bucketName}`)
  } catch (error) {
    print.error(`Error updating bucket policy: ${JSON.stringify(error)}`)
  }
}
