# Theory

In this lab, you'll learn how to manually trigger a database failover and what it means for our application.


## AWS Aurora Database Cluster Architecture

An Amazon Aurora database cluster consists of one or more database instances and a cluster volume that manages the data for those instances. There are two main types of instances in an Aurora cluster:

1. Writer Instance
- Primary instance that handles all write operations
- Only one writer instance per cluster at a time
- Supports both read and write operations
- Also called the primary instance or master

2. Reader Instance(s)  
- Support read-only operations
- Can have 0-15 read replicas per cluster
- Help scale read operations and provide failover targets
- Share the same underlying storage as the writer
- Maintain near real-time synchronization with writer

The cluster volume is a virtual database storage volume that spans multiple Availability Zones, with each AZ having a copy of the cluster data. This architecture provides built-in fault tolerance and high availability, as the data is automatically replicated across AZs.
the data is lost as soon as the last instance in a cluster is deleted.


## Database Failover

A database failover is a mechanism that automatically switches to a backup database system when the primary system fails or needs maintenance. In AWS Aurora, failover happens when:

1. The primary database instance (writer) becomes unavailable
2. An Availability Zone outage occurs
3. The database instance type is modified
4. The database is undergoing software patching

During failover, Aurora automatically promotes one of the read replicas to become the new writer instance. This process typically takes 60-120 seconds, during which write operations are temporarily unavailable but read operations can continue through the remaining read replicas.

The failover mechanism ensures high availability of the database system, minimizing downtime and maintaining business continuity. However, applications need to be designed to handle these temporary disruptions gracefully by implementing proper retry logic and connection management.
