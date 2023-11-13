import {
  ChangeResourceRecordSetsCommand,
  ChangeResourceRecordSetsCommandInput,
  CreateHostedZoneCommand,
  CreateHostedZoneCommandOutput,
  GetHostedZoneCommand,
  HostedZone,
  Route53Client,
} from '@aws-sdk/client-route-53'
import 'dotenv/config'
import { print } from 'gluegun'
import { ResourceRecord } from '@aws-sdk/client-acm'

const route53 = new Route53Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
})
export const createHostedZone = async (
  domainName: string
): Promise<CreateHostedZoneCommandOutput> => {
  try {
    // Add parameters for the `createHostedZone` command
    const params = {
      Name: domainName,
      CallerReference: `${Date.now()}`, // A unique string used to ensure the request is idempotent
      HostedZoneConfig: {
        Comment: `Hosted zone for my ${domainName}`,
        PrivateZone: false, // Set to true if you want to route traffic within your VPC only
      },
    }
    const data = await route53.send(new CreateHostedZoneCommand(params))
    print.info(`Hosted Zone created ${data.HostedZone.Id}`)
    return data
  } catch (err) {
    print.error(`Error Creating Hosted Zone ${JSON.stringify(err)}`)
    return
  }
}

export const addCnameRecordToRoute53 = async (
  domainName: string,
  hostedZoneId: string,
  cname: ResourceRecord
): Promise<void> => {
  try {
    const params: ChangeResourceRecordSetsCommandInput = {
      HostedZoneId: hostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: cname.Name,
              Type: cname.Type,
              TTL: 300,
              ResourceRecords: [{ Value: cname.Value }],
            },
          },
        ],
      },
    }
    await route53.send(new ChangeResourceRecordSetsCommand(params))
    print.info(`CNAME record added to Route 53 for domain: ${domainName}`)
  } catch (error) {
    print.error(
      `Error adding CNAME record to Route 53 ${JSON.stringify(error)}`
    )
  }
}

export const getDomainNameServers = async (
  hostedZoneId: string
): Promise<HostedZone> => {
  try {
    const response = await route53.send(
      new GetHostedZoneCommand({ Id: hostedZoneId })
    )
    return response.HostedZone
  } catch (error) {
    print.error(`Error getting name servers ${JSON.stringify(error)}`)
    return
  }
}

export const createAliasRecord = async (
  domainName: string,
  hostedZoneId: string,
  cloudFrontDomainName: string
): Promise<void> => {
  try {
    const params: ChangeResourceRecordSetsCommandInput = {
      HostedZoneId: hostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: domainName,
              Type: 'A',
              AliasTarget: {
                HostedZoneId: 'Z2FDTNDATAQYW2', // This is the hosted zone ID for CloudFront
                DNSName: cloudFrontDomainName,
                EvaluateTargetHealth: false,
              },
            },
          },
        ],
      },
    }
    await route53.send(new ChangeResourceRecordSetsCommand(params))
    print.info(`Alias record created for ${domainName}`)
  } catch (error) {
    print.error(`Error creating alias record:  ${error}`)
  }
}
