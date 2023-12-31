import {
  CloudFrontClient,
  CloudFrontOriginAccessIdentity,
  CreateCloudFrontOriginAccessIdentityCommand,
  CreateCloudFrontOriginAccessIdentityCommandInput,
  CreateDistributionCommand,
  CreateDistributionCommandInput,
  CreateInvalidationCommand,
  Distribution,
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
  bucketName: string,
  certificateArn: string = null,
  domainName: string = null
): Promise<Distribution> => {
  try {
    const domain = `${bucketName}.s3-website.${process.env.REGION}.amazonaws.com`
    print.info(`possible domain ${domain}`)
    const params: CreateDistributionCommandInput = {
      DistributionConfig: {
        CallerReference: `${bucketName}-${Date.now().toString()}`,
        Comment: `Cloud front distribution for ${bucketName} bucket`,
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'redirect-to-https',
          TargetOriginId: 'Custom-Origin',
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
        Origins: {
          Quantity: 1,
          Items: [
            {
              Id: 'Custom-Origin',
              DomainName: domain,
              CustomOriginConfig: {
                HTTPPort: 80,
                HTTPSPort: 443,
                OriginProtocolPolicy: 'http-only',
                OriginSslProtocols: {
                  Quantity: 3,
                  Items: ['TLSv1', 'TLSv1.1', 'TLSv1.2'],
                },
              },
            },
          ],
        },
        Enabled: true,
      },
    }

    if (certificateArn) {
      params.DistributionConfig.Aliases = {
        Quantity: 1,
        Items: [domainName],
      }
      params.DistributionConfig.ViewerCertificate = {
        ACMCertificateArn: certificateArn,
        SSLSupportMethod: 'sni-only',
        MinimumProtocolVersion: 'TLSv1.2_2019',
      }
    }
    const { Distribution } = await cloudfront.send(
      new CreateDistributionCommand(params)
    )
    print.info(`CloudFront distribution created: ${Distribution.DomainName}`)
    return Distribution
  } catch (error) {
    print.error(
      `Error creating cloud front distribution ${JSON.stringify(error)}`
    )
    return
  }
}

export const createOriginAccessIdentity =
  async (): Promise<CloudFrontOriginAccessIdentity> => {
    const params: CreateCloudFrontOriginAccessIdentityCommandInput = {
      CloudFrontOriginAccessIdentityConfig: {
        CallerReference: `my-oai-${Date.now()}`,
        Comment: 'OAI for accessing S3 bucket via CloudFront',
      },
    }

    try {
      const { CloudFrontOriginAccessIdentity } = await cloudfront.send(
        new CreateCloudFrontOriginAccessIdentityCommand(params)
      )
      print.info(
        `Origin Access Identity created: ${CloudFrontOriginAccessIdentity.Id}`
      )
      return CloudFrontOriginAccessIdentity
    } catch (error) {
      print.error(
        `Error creating Origin Access Identity: ${JSON.stringify(error)}`
      )
      return
    }
  }

export const invalidateCache = async (
  distributionId: string
): Promise<void> => {
  try {
    const params = {
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `${Date.now()}`,
        Paths: {
          Quantity: 1,
          Items: ['/*'], // Invalidate all files
        },
      },
    }

    await cloudfront.send(new CreateInvalidationCommand(params))
    print.info('Cache invalidation initiated.')
  } catch (error) {
    print.error(`Error creating cache invalidation: ${JSON.stringify(error)}`)
  }
}
