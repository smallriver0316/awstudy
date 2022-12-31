# EC2 access via bastion server

This project is to demonstrate accesing EC2 instance via another EC2 as a bastion server.

## Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

### Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## How to build

This project is build by CDK.

```bash
mkdir ec2-access-via-bastion
cd ec2-access-via-bastion/
cdk init --language typescript
```

After that, implement lib/ec2-access-via-bastion-stack.ts and bin/ec2-access-via-bastion.ts

## How to deploy

```bash
# setting environment variables is necessary at every time
export AWS_PROFILE=<Your target profile>
export CDK_DEPLOY_ACCOUNT=<Your account id>
export CDK_DEPLOY_REGION=<Your target region>

# cdk bootstrap is necessary only at first
cdk synth
cdk bootstrap

# deploy stack
cdk deploy
# deploy with stage name(default is dev)
cdk deploy -c stage=<stage name>
# deploy with restriction of access origin
cdk deploy -c myIp=<Your IP address>
# deploy with both parameters
cdk deploy -c stage=<stage name> -c myIp=<Your IP address>
```

## How to delete

```bash
cdk destroy

Are you sure you want to delete: Ec2AccessViaBastionStack-dev (y/n)? y
Ec2AccessViaBastionStack-dev: destroying... [1/1]

 ✅  Ec2AccessViaBastionStack-dev: destroyed
```

## How to access

### Access to bastion server

SSH private key and public key will be stored in SecretsManager.

```bash
# get private key of bastion server from SecretsManager with AWS CLI.
aws secretsmanager get-secret-value \
--secret-id ec2-ssh-key/bastion-keypair/private \
--query SecretString \
--output text > bastion-key.pem

# add permission
chmod 400 bastion-key.pem

# ssh to basion server
# ssh -i private-key-file ec2-user@<Public IPv4 DNS>
# example in the case that Publick IPv4 DNS of bastion host is ec2-13-231-62-245.ap-northeast-1.compute.amazonaws.com
ssh -i bastion-key.pem ec2-user@ec2-13-231-62-245.ap-northeast-1.compute.amazonaws.com

The authenticity of host 'ec2-13-231-62-245.ap-northeast-1.compute.amazonaws.com (13.231.62.245)' can't be established.
ECDSA key fingerprint is SHA256:fZ0q9mbk9C1bmaUCHolCZq/onYvS1pvWG8W51ejXm14.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'ec2-13-231-62-245.ap-northeast-1.compute.amazonaws.com,13.231.62.245' (ECDSA) to the list of known hosts.

       __|  __|_  )
       _|  (     /   Amazon Linux 2 AMI
      ___|\___|___|

https://aws.amazon.com/amazon-linux-2/
```

### Access to private server via bastion

```bash
# get private key of private server from SecretsManager with AWS CLI
aws secretsmanager get-secret-value \
--secret-id ec2-ssh-key/private-keypair/private \
--query SecretString \
--output text > private-key.pem

# add permission
chmod 400 private-key.pem

# ssh -i private-key.pem -o ProxyCommand='ssh -i bastion-key.pem ec2-user@<Public IPv4 DNS of bastion server> -W %h:%p' ec2-user@<Private IPv4 DNS of private server>
ssh -i private-key.pem \
-o ProxyCommand='ssh -i bastion-key.pem ec2-user@ec2-13-231-62-245.ap-northeast-1.compute.amazonaws.com -W %h:%p' \
ec2-user@ip-10-0-1-100.ap-northeast-1.compute.internal

The authenticity of host 'ip-10-0-1-100.ap-northeast-1.compute.internal (<no hostip for proxy command>)' can't be established.
ECDSA key fingerprint is SHA256:w2p0rZd4udiezgXntpbzl/g2j8/ElEdhZJ3vtouFo5E.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'ip-10-0-1-100.ap-northeast-1.compute.internal' (ECDSA) to the list of known hosts.

       __|  __|_  )
       _|  (     /   Amazon Linux 2 AMI
      ___|\___|___|

https://aws.amazon.com/amazon-linux-2/
```
