import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import { KeyPair } from "cdk-ec2-key-pair";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class Ec2ViaSsmStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stage = this.node.tryGetContext("stage")
      ? this.node.tryGetContext("stage")
      : "dev";
    const myIp = this.node.tryGetContext("myIp");

    // VPC
    const vpc = new ec2.Vpc(this, `SSMAccessVpc-${stage}`, {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "public-subnet",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // IAM role
    const role = new iam.Role(this, `SSMAccessEc2Role-${stage}`, {
      roleName: `ssm-access-ec2-instance-role-${stage}`,
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "AmazonEC2ContainerServiceforEC2Role",
          "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
        ),
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "AmazonEC2RoleforSSM",
          "arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM"
        ),
      ],
    });

    new iam.CfnInstanceProfile(this, `SSMAccessCfnInstanceProfile-${stage}`, {
      instanceProfileName: `ssm-access-ec2-instance-profile-${stage}`,
      roles: [role.roleName],
    });

    // Security Group
    const sg = new ec2.SecurityGroup(this, `SSMAccessSg-${stage}`, {
      vpc,
      description: "Allow ssh access to bastion instance",
      allowAllOutbound: true,
    });

    const ipv4Peer =
      myIp === undefined ? ec2.Peer.anyIpv4() : ec2.Peer.ipv4(myIp);

    sg.addIngressRule(
      ipv4Peer,
      ec2.Port.tcp(22),
      "Allow ssh access only from me"
    );

    // VPC Endpoint
    vpc.addInterfaceEndpoint(`SSMEndpoint-${stage}`, {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      securityGroups: [sg],
    });

    vpc.addInterfaceEndpoint(`SSMMessagesEndpoint-${stage}`, {
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
      securityGroups: [sg],
    });

    vpc.addInterfaceEndpoint(`EC2MessagesEndpoint-${stage}`, {
      service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
      securityGroups: [sg],
    });

    // Key pair
    const keyPair = new KeyPair(this, "SSMAccessKeyPair", {
      name: `keypair-${stage}`,
      description: "ssh key pair for public host",
      storePublicKey: true,
    });

    keyPair.grantReadOnPublicKey;

    // EC2 instance
    new ec2.Instance(this, `SSMAccessEc2Host-${stage}`, {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.XLARGE
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      role,
      securityGroup: sg,
      keyName: keyPair.keyPairName,
    });
  }
}
