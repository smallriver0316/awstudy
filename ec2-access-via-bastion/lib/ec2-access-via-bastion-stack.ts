import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { KeyPair } from "cdk-ec2-key-pair";
import { Construct } from "constructs";

export class Ec2AccessViaBastionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stage = this.node.tryGetContext("stage")
      ? this.node.tryGetContext("stage")
      : "dev";
    const myIp = this.node.tryGetContext("myIp");

    // VPC
    // Internet Gateway will be automatically created.
    // Route Table will be automatically created at each subnet.
    // Availability Zone will be ap-northeast-1a.
    const vpc = new ec2.Vpc(this, `Vpc-${stage}`, {
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

    // Security Group
    const bastionSg = new ec2.SecurityGroup(this, `BastionSg-${stage}`, {
      vpc,
      description: "Allow ssh access to bastion instance",
      allowAllOutbound: true,
    });

    const ipv4Peer =
      myIp === undefined ? ec2.Peer.anyIpv4() : ec2.Peer.ipv4(myIp);

    bastionSg.addIngressRule(
      ipv4Peer,
      ec2.Port.tcp(22),
      "allow ssh access only from me"
    );

    const privateSg = new ec2.SecurityGroup(this, `PrivateSg-${stage}`, {
      vpc,
      description: "Allow ssh access from bastion instance",
      allowAllOutbound: true,
    });

    // set ID of bastion security group as IPeer for access from bastion
    privateSg.addIngressRule(
      ec2.Peer.securityGroupId(bastionSg.securityGroupId),
      ec2.Port.tcp(22),
      "allow ssh access only from bastion instance"
    );

    // key pair
    const bastionKey = new KeyPair(this, "BationKey", {
      name: `bastion-keypair-${stage}`,
      description: "ssh key pair for bastion host",
      storePublicKey: true,
    });

    bastionKey.grantReadOnPublicKey;

    const privateKey = new KeyPair(this, "PrivateKey", {
      name: `private-keypair-${stage}`,
      description: "ssh key pair for private host",
      storePublicKey: true,
    });

    privateKey.grantReadOnPublicKey;

    // EC2

    // default instance type is t3.nano.
    // default machine image is Amazon Linux.
    // About BastionHost, SSM is active.
    // const bastion = new ec2.BastionHostLinux(this, "BastionHost", {
    //   vpc,
    //   subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
    //   instanceType: ec2.InstanceType.of(
    //     ec2.InstanceClass.T2,
    //     ec2.InstanceSize.MICRO
    //   ),
    //   machineImage: new ec2.AmazonLinuxImage({
    //     generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    //   }),
    //   securityGroup: bastionSg,
    // });

    new ec2.Instance(this, `BastionHost-${stage}`, {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup: bastionSg,
      keyName: bastionKey.keyPairName,
    });

    new ec2.Instance(this, `PrivateHost-${stage}`, {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup: privateSg,
      keyName: privateKey.keyPairName,
    });
  }
}
