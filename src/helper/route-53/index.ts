import {
  ChangeResourceRecordSetsCommand,
  ChangeResourceRecordSetsCommandInput,
  ChangeResourceRecordSetsCommandOutput,
  CreateHostedZoneCommand,
  CreateHostedZoneCommandOutput,
  Route53Client,
} from '@aws-sdk/client-route-53'
import 'dotenv/config'
import { describeCertificate } from '../acm'
import { print } from 'gluegun'

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
  // Add parameters for the `createHostedZone` command
  // Note that this is just an example and you should handle the response and errors properly
  const params = {
    Name: domainName,
    CallerReference: `${Date.now()}`, // A unique string used to ensure the request is idempotent
    HostedZoneConfig: {
      Comment: `Hosted zone for my ${domainName}`,
      PrivateZone: false, // Set to true if you want to route traffic within your VPC only
    },
  }

  try {
    const data = await route53.send(new CreateHostedZoneCommand(params))
    print.info(`Hosted Zone created ${data.HostedZone.Id}`)
    return data
  } catch (err) {
    print.error(`Error Creating Hosted Zone ${err}`)
    throw err
  }
}

export const createRecordSet = async (
  hostedZoneId: string,
  domainName: string,
  s3EndPoint: string
): Promise<ChangeResourceRecordSetsCommandOutput> => {
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
              DNSName: s3EndPoint, // Replace with your S3 website endpoint
              EvaluateTargetHealth: false,
              HostedZoneId: 'Z3AQBSTGFYJSTF', // This is the Hosted Zone ID for S3 websites (it's constant)
            },
          },
        },
      ],
    },
  }

  try {
    const data = await route53.send(new ChangeResourceRecordSetsCommand(params))
    console.log('Record set created', data)
    return data
  } catch (err) {
    console.log('Error', err)
    throw err
  }
}

export const addCnameRecordToRoute53 = async (
  domainName: string,
  certificateArn: string
): Promise<void> => {
  const certificate = await describeCertificate(certificateArn)
  const CnameRecord = certificate.DomainValidationOptions[0].ResourceRecord
  const hostedZone = await createHostedZone(domainName)

  const hostedZoneId = hostedZone.HostedZone.Id // Replace with your hosted zone ID

  const params: ChangeResourceRecordSetsCommandInput = {
    HostedZoneId: hostedZoneId,
    ChangeBatch: {
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: CnameRecord.Name,
            Type: CnameRecord.Type,
            TTL: 300,
            ResourceRecords: [{ Value: CnameRecord.Value }],
          },
        },
      ],
    },
  }
  try {
    await route53.send(new ChangeResourceRecordSetsCommand(params))
    console.log(`CNAME record added to Route 53 for domain: ${domainName}`)
  } catch (error) {
    console.log('Error adding CNAME record to Route 53')
    throw error
  }
}
