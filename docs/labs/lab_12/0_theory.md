# Theory

In this lab, we will learn how to write files to S3.


## CloudFront

CloudFront is a Content Delivery Network (CDN) that can be used to deliver your static files.

It can be used to deliver files to users around the world with low latency.

Common alternative CDNs are Cloudflare, Akamai and Fastly.

We won't use CloudFront in this workshop, but it's a great service to know about.


## S3

Amazon S3 is a storage service that lets you store and retrieve files over the internet. Unlike traditional network drives that work like folders on your computer, S3:

- Stores data as objects (files) in containers called buckets
- Grows automatically without having to plan storage size upfront
- Is accessed through web requests instead of being mounted as a drive
- Keeps multiple copies of your data across different locations automatically
- Lets you control exactly who can access what through permissions
- Can trigger other AWS services when files change
- Offers different storage types based on how often you need to access files

It's commonly used for:
- Hosting website files
- Storing application files like images and videos
- Large-scale data storage and analysis
- Backup storage
- Delivering content through CDNs
- Storage for serverless applications

The main difference from network drives is that S3 is built for storing and retrieving data over the internet at large scale, while network drives are better for quick access to files within your local network.

Since the API is object-based instead of block-based, files cannot be modified once they are uploaded. Instead, you can only overwrite the entire file.


## Common pitfalls of S3

While S3 is generally an awesome service, there are a few pitfalls to be aware of:


### Public Buckets

Creating public buckets is often convenient, as you can just download the files as needed, but it is almost always a bad idea.

You can never be sure in advance what someone in the future will upload to your bucket.

S3 has caused a lot of privacy violations and security incidents in the past for this exact reason.

If your argument is that you use the bucket for a static website, be aware of the cost per S3 API request.
Although not the case any more, in the past you were billed for 403 and 404 responses, like for any other API request. So anyone could just bombard your bucket with whatever requests they want, and you'd have been billed for it.

You'll learn what to do instead further below.


### Proxying S3 requests with your application

Since you shouldn't use public buckets, you might have the idea of proxying the requests with your application.

While this allows you to control access to the files, it's often forgotten to constrain the permissions, so the bucket is still somewhat public.

A bigger problem is the increased cost; Because of the proxying, your application needs resources which you'll have to pay for.

And, depending on whether you use the public S3 API endpoint or a VPC endpoint, you'll have to pay double for egress traffic.


### What to do instead: Pre-signed URLs

Use a pre-signed url for temporary access or a CloudFront distribution for public access.

Pre-signed URLs are temporary URLs that give time-limited access to specific S3 objects. They allow secure sharing of private S3 content without making buckets public or changing permissions. The URL contains authentication information and expires after a set time.


### What to do instead: CloudFront

CloudFront is a CDN that can be used to deliver your static files.

It can be used to deliver your S3 files to users around the world with low latency.

When used for static websites, it'll improve the performance of your website and lower the cost of your S3 requests.

#### Example cost comparison - small numbers (ignoring free tier):
- The size of the average page load, including images is 5MB.
- One page load requires 50 different files to be loaded.
- Your website has 1000 visitors per month.


- 1000 visitors * 5MB = 5GB of outgoing traffic per month.
- 1000 visitors * 50 files = 50k API requests per month.

Pricing with just S3:
Egress fee: 5GB * $0.09 = $0.45
API request fee: 50k * $0.0004 = $20
Total: $20.45

Pricing with S3 and CloudFront:
Egress fee: 5GB * $0.085 = $0.425
API request fee: 0$
Total: $0.425


### Example cost comparison - large numbers (ignoring free tier):
- The size of the average page load, including images is 5MB.
- One page load requires 50 different files to be loaded.
- Your website has 100.000 (100k) visitors per month.


- 100k visitors * 5MB = 500GB of outgoing traffic per month.
- 100k visitors * 50 files = 5M API requests per month.

With just S3:
- Egress fee: 500GB * $0.09 = $45
- API request fee: 5M * $0.0004 = $2000
- Total: $2045

With S3 and CloudFront:
- Egress fee: 500GB * $0.085 = $42.5
- API request fee: 0$
- Total: $42.5


### Conclusion

CloudFront is way cheaper than direct S3 access.
While other CDNs might have similar effects due to caching, CloudFront has the additional benefit that its requests to the S3 API are free.
