import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class Ec2ForCloud9Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stage = this.node.tryGetContext("stage")
      ? this.node.tryGetContext("stage")
      : "dev";
    // const myIp = this.node.tryGetContext("myIp");

    // VPC
    const vpc = new ec2.Vpc(this, `Vpc-${stage}`, {
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

    // IAM Role
    const role = new iam.Role(this, `EC2forCloud9Role-${stage}`, {
      roleName: `deployment-from-ec2-role-${stage}`,
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "AmazonEC2ContainerServiceForEC2Role",
          "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
        ),
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "AWSCloud9SSMInstanceProfile",
          "arn:aws:iam::aws:policy/AWSCloud9SSMInstanceProfile"
        ),
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "AmazonS3FullAccess",
          "arn:aws:iam::aws:policy/AmazonS3FullAccess"
        ),
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "AWSCloudFormationFullAccess",
          "arn:aws:iam::aws:policy/AWSCloudFormationFullAccess"
        ),
      ],
    });

    // instance profile
    new iam.CfnInstanceProfile(
      this,
      `DeploymentFromEC2CfnInstanceProfile-${stage}`,
      {
        instanceProfileName: `ec2-for-cloud9-instance-profile-${stage}`,
        roles: [role.roleName],
      }
    );

    // Security Group
    const sg = new ec2.SecurityGroup(this, `EC2ForCloud9Sg-${stage}`, {
      vpc,
      description: "Allow all outbound",
      allowAllOutbound: true,
    });

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

    // EC2 instance
    new ec2.Instance(this, `EC2ForCloud9Instance-${stage}`, {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.XLARGE
      ),
      machineImage: new ec2.AmazonLinux2023ImageSsmParameter(),
      role,
      securityGroup: sg,
    });
  }
}
