import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

export class RdsAccessViaBastionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const stage = this.node.tryGetContext("stage")
      ? this.node.tryGetContext("stage")
      : "dev";

    // availability zone x2, subnet type (private/public) => 4 subnets will be created
    const vpc = new ec2.Vpc(this, `Vpc-${stage}`, {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "public-subnet",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "private-subnet",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Security Group
    const bastionSg = new ec2.SecurityGroup(this, "BastionSg", {
      vpc,
      description: "Security Group for bastion server",
      allowAllOutbound: true,
    });

    const databaseSg = new ec2.SecurityGroup(this, "DatabaseSg", {
      vpc,
      description: "Security Group for database",
      allowAllOutbound: true,
    });

    databaseSg.addIngressRule(
      ec2.Peer.securityGroupId(bastionSg.securityGroupId),
      ec2.Port.tcp(3306),
      "allow access only from bastion instance"
    );

    // BastionHostLinux
    // default instance type is t3.nano.
    // default machine image is Amazon Linux.
    // About BastionHost, SSM is active.
    new ec2.BastionHostLinux(this, "BastionHost", {
      vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup: bastionSg,
    });

    new rds.DatabaseCluster(this, "Database", {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_2_07_8,
      }),
      credentials: rds.Credentials.fromGeneratedSecret("admin"),
      instanceProps: {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE2,
          ec2.InstanceSize.SMALL
        ),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [databaseSg],
        vpc,
      },
    });
  }
}
