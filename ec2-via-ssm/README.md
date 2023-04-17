# EC2 accessible via SSM

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

## How to launch

This project was build by CDK.

```bash
mkdir ec2-access-via-bastion
cd ec2-access-via-bastion/
cdk init --language typescript
```

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
```
