import {
  CloudFrontClient,
  CreateDistributionCommand,
  CreateDistributionCommandInput,
} from '@aws-sdk/client-cloudfront'
import 'dotenv/config'
import { print } from 'gluegun'

const cloudfront = new CloudFrontClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
})

export const createCloudFrontDistribution = async (
  certificateArn: string,
  domainName: string,
  s3BucketName: string
) => {
  const params: CreateDistributionCommandInput = {
    DistributionConfig: {
      CallerReference: `${Date.now().toString()}`, // Unique value for each distribution
      Comment: domainName,
      DefaultCacheBehavior: {
        ViewerProtocolPolicy: 'redirect-to-https',
        TargetOriginId: 'S3-Origin',
        ForwardedValues: {
          QueryString: false,
          Cookies: { Forward: 'none' },
        },
        TrustedSigners: {
          Enabled: false,
          Quantity: 0,
        },
        MinTTL: 0,
      },
      Aliases: {
        Quantity: 1,
        Items: [domainName],
      },
      Origins: {
        Quantity: 1,
        Items: [
          {
            Id: 'S3-Origin',
            DomainName: `${s3BucketName}.s3.amazonaws.com`,
            S3OriginConfig: {
              OriginAccessIdentity: '',
            },
          },
        ],
      },
      ViewerCertificate: {
        ACMCertificateArn: certificateArn,
        SSLSupportMethod: 'sni-only',
        MinimumProtocolVersion: 'TLSv1.2_2019',
      },
      Enabled: true,
    },
  }
  try {
    const { Distribution } = await cloudfront.send(
      new CreateDistributionCommand(params)
    )
    print.info(`CloudFront distribution created: ${Distribution.DomainName}`)
    return Distribution.DomainName
  } catch (error) {
    print.error(`Error creating cloud front distribution ${error}`)
    throw error
  }
}
