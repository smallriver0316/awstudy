# RDS access via bastion server

This project is to demonstrate accessing RDS via bastion server.

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
mkdir rds-access-via-bastion
cd rds-access-via-bastion.
cdk init --language typescript
```

After that, implement lib/rds-access-via-bastion-stack.ts and bin/rds-access-via-bastion.ts.

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
```

## How to delete

Don't forget to delete DB snapshot after the destroy command.

```bash
cdk destroy
```

## How to access RDS via bastion server

DB credential information will be stored in SecretsManager.

Secret ID can be confirmed from AWS console.

```bash
$ aws secretsmanager get-secret-value \
--secret-id RdsAccessViaBastionStackdev-VCRHh4bxSaJr \
--query SecretString \
--output text | jq .
{
  "dbClusterIdentifier": "rdsaccessviabastionstack-dev-databaseb269d8bb-nwyuyahjaqqx",
  "password": "m-FA_Rp5qtmpnIEK,I4wwMscgMonv_",
  "engine": "mysql",
  "port": 3306,
  "host": "rdsaccessviabastionstack-dev-databaseb269d8bb-nwyuyahjaqqx.cluster-c8fpmb3ipjzo.us-east-1.rds.amazonaws.com",
  "username": "admin"
}
```

Access bastion server with Session Manager on AWS console.

```bash
sudo su - ec2-user

# install mysql client
$ sudo yum install -y mysql
$ mysql --version
mysql  Ver 15.1 Distrib 5.5.68-MariaDB, for Linux (x86_64) using readline 5.1
```

Writer endpoint of cluster is equal to "host" in credential obtained from SecretsManager.

It can also be confirmed in AWS console.

```bash
# access RDS cluster
$ mysql -h <writer endpoint of cluster> -u admin -p
Enter password: <Enter password obtained from SecretsManager>
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MySQL connection id is 19
Server version: 5.7.12 MySQL Community Server (GPL)

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

MySQL [(none)]>
```

Create DB user.

```bash
MySQL [(none)]> SELECT Host, User FROM mysql.user;
+-----------+-----------+
| Host      | User      |
+-----------+-----------+
| %         | admin     |
| localhost | mysql.sys |
| localhost | rdsadmin  |
+-----------+-----------+
3 rows in set (0.01 sec)

MySQL [(none)]> CREATE USER testuser@'%' IDENTIFIED BY 'testEncP';
Query OK, 0 rows affected (0.01 sec)

MySQL [(none)]> GRANT ALL ON testapp.* TO testuser@'%' WITH GRANT OPTION;
Query OK, 0 rows affected (0.00 sec)

MySQL [(none)]> SELECT Host, User FROM mysql.user;
+-----------+-----------+
| Host      | User      |
+-----------+-----------+
| %         | admin     |
| %         | testuser  |
| localhost | mysql.sys |
| localhost | rdsadmin  |
+-----------+-----------+
5 rows in set (0.00 sec)

MySQL [(none)]> exit
Bye
```

Create DB table.

```bash
MySQL [(none)]> CREATE DATABASE movies;
Query OK, 1 row affected (0.01 sec)

MySQL [(none)]> SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| movies             |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
5 rows in set (0.00 sec)

MySQL [(none)]> USE movies;
Database changed

MySQL [movies]> CREATE TABLE movies(
    -> title VARCHAR(50) NOT NULL,
    -> genre VARCHAR(30) NOT NULL,
    -> director VARCHAR(60) NOT NULL,
    -> release_year INT NOT NULL,
    -> PRIMARY KEY(title));
Query OK, 0 rows affected (0.12 sec)

MySQL [movies]> DESCRIBE movies;
+--------------+-------------+------+-----+---------+-------+
| Field        | Type        | Null | Key | Default | Extra |
+--------------+-------------+------+-----+---------+-------+
| title        | varchar(50) | NO   | PRI | NULL    |       |
| genre        | varchar(30) | NO   |     | NULL    |       |
| director     | varchar(60) | NO   |     | NULL    |       |
| release_year | int(11)     | NO   |     | NULL    |       |
+--------------+-------------+------+-----+---------+-------+
4 rows in set (0.00 sec)

MySQL [movies]> INSERT INTO movies VALUE ("Joker", "psychological thriller", "Todd Phillips", 2019);
Query OK, 1 row affected (0.01 sec)

MySQL [movies]> SELECT * FROM movies;
+-------+------------------------+---------------+--------------+
| title | genre                  | director      | release_year |
+-------+------------------------+---------------+--------------+
| Joker | psychological thriller | Todd Phillips |         2019 |
+-------+------------------------+---------------+--------------+
1 row in set (0.00 sec)
```
