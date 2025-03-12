# Theory

In this lab, you will learn how to create a database in AWS and how to use AWS Secrets Manager to retrieve the credentials for it.
You will also connect your locally running application to the AWS-hosted database.

## AWS Relational Database Service (RDS)

AWS RDS (Relational Database Service) is a managed database service that makes it easier to set up, operate, and scale relational databases in the cloud. It supports multiple database engines like PostgreSQL, MySQL, MariaDB, Oracle, and SQL Server.

In RDS, databases can be deployed as standalone instances or as part of a cluster:

- **DB Instances** are the basic building blocks - individual database servers running your chosen database engine with specific compute and storage resources.

- **DB Clusters** consist of multiple DB instances working together, typically in a primary/replica configuration:
  - The primary instance handles write operations and replicates data to replica instances
  - Replica instances can handle read operations to improve performance
  - If the primary fails, a replica can be promoted to take over

Clusters provide benefits like:
- High availability through automatic failover
- Read scaling by distributing read traffic across replicas
- Automated backups and point-in-time recovery
- Easy horizontal scaling by adding/removing replicas

RDS handles many administrative tasks automatically, including hardware provisioning, database setup, patching, and backups, allowing you to focus on your application rather than database management.


## AWS Secrets Manager

AWS Secrets Manager is a service that helps you store and manage sensitive information like database credentials, API keys, and other confidential information in a secure and automated way. It provides:

- **Secure Storage**: Encrypts and stores secrets
- **Automatic Rotation**: Can automatically rotate secrets on a schedule
- **Access Control**: Uses IAM policies to control access
- **Audit Trail**: Tracks all access to secrets through CloudTrail

When you create an RDS database, AWS automatically generates credentials and stores them in Secrets Manager as an encrypted JSON containing the database endpoint, port, name, username, and password. Applications can then securely retrieve these credentials at runtime using the Secrets Manager API instead of hardcoding sensitive information.
