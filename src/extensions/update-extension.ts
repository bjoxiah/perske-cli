import { GluegunToolbox } from 'gluegun'
import {
  deleteObjectsInBucket,
  listObjectsInBucket,
  uploadDirectory,
} from '../helper/s3'
module.exports = async (toolbox: GluegunToolbox) => {
  toolbox.update = async (config: any, buildFolder: string) => {
    const { print } = toolbox
    // List objects in S3 Bucket
    const s3ObjectList = await listObjectsInBucket(config.s3BucketName)

    if (s3ObjectList?.Contents && s3ObjectList?.Contents?.length > 0) {
      const dropObjectsInBucket = await deleteObjectsInBucket(
        config.s3BucketName,
        s3ObjectList.Contents
      )
      print.info(`Dropped files: ${JSON.stringify(dropObjectsInBucket)}`)
    }
    // upload files from build folder
    await uploadDirectory(
      `${buildFolder}`,
      config.s3BucketName,
      `${buildFolder}`
    )
  }
}
