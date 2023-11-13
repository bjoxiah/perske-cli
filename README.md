
# Perske CLI

Perske CLI streamlines the deployment process for JavaScript applications, including React, Angular, Svelte, and more. It simplifies the deployment of static sites on AWS, handling everything from file uploads to domain configuration.

## Installation

Install Perske CLI globally using npm:

```bash
npm install -g perske-cli
```

## Prerequisites

Before using Perske CLI, ensure the following requirements are met:

### AWS IAM User
Create an AWS IAM user with these permissions for full functionality:
- `AmazonS3FullAccess`
- `CloudFrontFullAccess`
- `AmazonRoute53FullAccess`
- `AWSCertificateManagerFullAccess`

These permissions enable the CLI to perform essential tasks on AWS, such as S3 bucket operations and domain configuration.

### AWS Credentials
Obtain your AWS Access Key ID and Secret Access Key, then set them in an `.env` file at your project root:

```env
AWS_ACCESS_KEY_ID='YourAccessKeyId'
AWS_SECRET_KEY='YourSecretAccessKey'
REGION='YourAWSRegion'
```

Replace `YourAccessKeyId`, `YourSecretAccessKey`, and `YourAWSRegion` with your actual AWS credentials and preferred region.

## Usage

Perske CLI provides two primary commands:

### `start`
Initializes your deployment setup. It gathers necessary information about your application and AWS S3 bucket and performs a build and upload of your application. It can also assist with domain configuration.

```bash
perske start
```

### `deploy`
Ideal for CI/CD pipelines, this command deploys your application using pre-specified parameters, streamlining updates to your AWS S3 bucket.

```bash
perske deploy --bucketName 'your-bucket-name' --buildFolder 'your-build-folder'
```

Replace `your-bucket-name` and `your-build-folder` with your specific details.

## Contributing

Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push to the branch.
5. Submit a pull request.

## License

Perske CLI is [MIT licensed](LICENSE).
