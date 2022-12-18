# EC2 access via bastion server

This project is to demonstrate accesing EC2 via another EC2 as a bastion server.

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

# cdk synth and bootstrap is necessary only at first
cdk synth
cdk bootstrap

# deploy stack
cdk deploy
```

## How to delete

```bash
cdk destroy
```
