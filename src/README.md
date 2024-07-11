# Building the Infrastructure for Court Reminders - eCourts Edition

Before beginning, copy [make_variables.sample](./make_variables.sample) to ```make_variables``` and set ```INSTANCE``` to a value that will be used to create unique infrastructure names. The ```INSTANCE``` name should consist of lowercase alphanumeric characters and hyphens only.

##  Step 0 - Create Network Resources
If you are not using existing resources, build the network resources, as follows:

```sh
cd ./0-network
make init
make apply-y
cd ..
```

Now replace the four network variables in ```make_variables``` with those from ```./0-network/cn_network_variables.generated```.

## Step 1 - Create the Database and Store Credentials
Now create the database that will be used to store court dates provided through the daily AOC text file.

If you wish, you may set a different password for the main user in the ```make_variables``` file, or you can change it afterward in the database directly.

```sh
cd ./1-db
make init
make apply-y
cd ..
```

The database credentials and connection information should be stored as a secret in AWS Secrets Manager. In the AWS console, navigate to [Secrets Manager](https://us-east-1.console.aws.amazon.com/secretsmanager/listsecrets?region=us-east-1) and create a new secret named ```court-dates-database```. The secret type should be "Other type of secret" and it should include the following key/value pairs:

- host (get this from ```./1-db/make_variables.generated - do not include the port number)
- username (set to ```cn```)
- password (change to actual value of the password for the ```cn``` user)
- type (set to ```postgresql```)
- port (set to ```5432```)
- database (set to ```cn```)
- description (set to "Court dates database")

## Step 2 - Create the ETL Server
The ETL server is an EC2 instance that runs a script to download the daily file from Buncombe County servers to an S3 bucket. Ideally this would run as a Lambda, but letting a Lambda interact with the internet requires a NAT Gateway, which is a significant expense.

The script is part of a City of Asheville system called Bedrock which manages a catalog of data assets and also provides simple data movement capabilities, including SFTP.

### Step 2a - Create and configure an EC2 instance
Create an EC2 server with the userdata from [userdata.sh](userdata.sh). Attach an elastic IP to it that has been authorized for access to the Buncombe County SFTP server (currently 52.87.48.111).

### Step 2b - Set up Github access and clone needed directories
Run the following command
```sh
ssh-keygen -t ed25519 -C
```
Copy the contents of the generated ```.pub``` file in the ```~/.ssh``` directory to Github (navigate to account settings, then to [```SSH and GPG Keys```](https://github.com/settings/keys), and create a new SSH key.

Now clone [this repository](https://github.com/CourtDatesOrg/cn-transition-2024) and the [Bedrock repository](https://github.com/DeepWeave/bedrock2).

### Step 2c - Prepare the Bedrock application

### Step 2b - Set up the systemd timer to run the FTP job
See [this article](https://opensource.com/article/20/7/systemd-timers) on using systemd timers.


