import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
// import { KeyPair } from "cdk-ec2-key-pair";
import { Construct } from "constructs";

export class Ec2AccessViaBastionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // const systemName = this.node.tryGetContext("systemName");
    // const envType = this.node.tryGetContext("envType");

    // VPC
    // Internet Gateway will be automatically created.
    // Route Table will be automatically created at each subnet.
    // Availability Zone will be ap-northeast-1a.
    const vpc = new ec2.Vpc(this, "Vpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "public-subnet",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "private-subnet",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // key pair
    // const key = new KeyPair(this, "sshkey", {
    //   name: "ssh-key",
    //   description: "ssh key to access from bastion to target machine",
    //   storePublicKey: true,
    // });

    // security group
    // const bastionSg = new ec2.SecurityGroup(this, "SecurityGroup", {
    //   vpc,
    //   description: "Allow SSH (TCP port 22) and HTTP (TCP port 80) in",
    //   allowAllOutbound: true,
    // });

    // EC2
    // default instance type is t3.nano.
    // default machine image is Amazon Linux.
    // SSM is active.
    new ec2.BastionHostLinux(this, "bastionHost", {
      vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
    });
  }
}
