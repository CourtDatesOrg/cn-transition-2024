# Building the Infrastructure for Court Reminders - eCourts Edition

## Step 1 - Create the make_variables file

Before beginning, clone this repository and navigate to it. Next, copy [make_variables.sample](./make_variables.sample) to ```make_variables``` and set ```INSTANCE``` to a value that will be used to create unique infrastructure names. The ```INSTANCE``` name should consist of lowercase alphanumeric characters and hyphens only.

Note that you will need to have ```make``` and ```terraform``` installed on your machine.

##  Step 1 - Create Network Resources
If you are not using existing resources, build the network resources, as follows:

```sh
cd ./1-network
make init       # Initializes the back end for storing state
make apply-y    # Creates the network infrastructure
cd ..
```

Now replace the four network variables in ```make_variables``` with those from ```./1-network/cn_network_variables.generated```.

## Step 2 - Create the Database and Store Credentials
Now create the database that will be used to store court dates provided through the daily AOC text file.

If you wish, you may set a different password for the main user in the ```make_variables``` file, or you can change it afterward in the database directly.

```sh
cd ./2-db
make init    # Initializes the back end for storing state
make apply-y # Creates the RDS instance
make db      # Initializes the schema and tables
cd ..
```

The database credentials and connection information should be stored as a secret in AWS Secrets Manager. In the AWS console, navigate to [Secrets Manager](https://us-east-1.console.aws.amazon.com/secretsmanager/listsecrets?region=us-east-1) and create a new secret named ```court-dates-database```. The secret type should be "Other type of secret" and it should include the following key/value pairs:

- host (get this from ```./2-db/make_variables.generated - do not include the port number)
- username (set to ```cn```)
- password (change to actual value of the password for the ```cn``` user)
- type (set to ```postgresql```)
- port (set to ```5432```)
- database (set to ```cn```)
- description (set to "Court dates database")

## Step 3 - Create the Data-Loader Lambda
Now create the lambda that will be triggered whenever a file is added to the S3 bucket to process the court dates into the database.

```sh
cd ./3-load-data-lambda
make init
make apply-y
cd ..
```

This will create the lambda and also add the notification to the s3 bucket.

__Important__: Note that the ```courttexts``` bucket used to stage files from the Buncombe County SFTP server is hardcoded in the [configuration](./3-load-data-lambda/lambda-load-data/deploy/config.tf) and in the ```aoc.json``` for the ETL server via the ```connection``` parameter for the target location. That parameter is the name of SecretsManager secret containing the following information:

```js
{
    type:       s3
    s3_bucket   courttexts
}
```

In the future this should be parameterized.

## Step 4 - Create the ETL Server
The ETL server is an EC2 instance that runs a script to download the daily file from Buncombe County servers to an S3 bucket. Ideally this would run as a Lambda, but letting a Lambda interact with the internet requires a NAT Gateway, which is a significant expense.

The script is part of a City of Asheville system called Bedrock which manages a catalog of data assets and also provides simple data movement capabilities, including SFTP.

### Step 4a - Create the EC2 Server
Begin by creating an EC2 server running Amazon Linux (the smallest instance is fine). The production instance is named ```cn-etl-ecourts```.

Attach an elastic IP to it that has been authorized for access to the Buncombe County SFTP server (currently 52.87.48.111).

Next, create a role with the ```SecretsManagerReadWrite``` and ```AmazonS3FullAccess``` roles. The production instance is named ```cn-etl-ecourts-agent```. In the EC2 console go to ```Actions->Security->Modify IAM Role``` and associate the role with the EC2 server.

Now log into the server using ssh and run the following commands:

```
sudo yum update -y
sudo yum install -y make git python311 # Get a newer python3 version
sudo ln -sf /usr/bin/python3.11 /usr/bin/python3 # and make it the default
sudo python3 -m ensurepip # Ignore the warning

# Do we actually need this? Might not for now, but later when we bring the DB load in, we likely will
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
```

### Step 4b - Set up Github access and clone needed directories
Run the following command, replacing with the appropriate email address.
```sh
ssh-keygen -t ed25519 -C "your_email@example.com"
```
Copy the contents of the generated ```.pub``` file in the ```~/.ssh``` directory to Github (navigate to account settings, then to [```SSH and GPG Keys```](https://github.com/settings/keys), and create a new SSH key.

Now clone [this repository](https://github.com/CourtDatesOrg/cn-transition-2024) and the [Bedrock repository](https://github.com/DeepWeave/bedrock2).

### Step 4c - Prepare the Bedrock application

We are only using a portion of the Bedrock application for now, so we don't need to do the full set up, just the following steps:

```
cd ~/bedrock2/src
cp ~/cn-transition-2024/src/4-etl-server/bedrock_make_variables make_variables
cp ~/cn-transition-2024/src/4-etl-server/aoc.json etl/lambdas/etl_task_file_copy
```

The instance in that file is set to the production name - change it if you are creating a separate instance. Next:

```
cd ~/bedrock2/src/etl/lambdas/etl_task_file_copy
make package
```

### Step 4d - Set up the systemd timer to run the FTP job
Now install the timer that will run the daily ftp job. Do the following step. Note that the ```systemctl start``` command will run the FTP job once. From that point, it will be run at the time specified in the timer file.

```
sudo cp ~/cn-transition-2024/src/4-etl-server/aocGet.service /etc/systemd/system
sudo cp ~/cn-transition-2024/src/4-etl-server/aocGet.timer /etc/systemd/system
sudo chmod 644 /etc/systemd/system/aocGet*
sudo systemctl daemon-reload
sudo systemctl start aocGet.service
sudo systemctl status aocGet.service
```

To view details on the daily runs you can run the following command:

```
sudo journalctl -S today -f -u aocGet.service
```

The ```-S``` option can be followed by a date and time of the format "2012-10-30 18:17:16". If the date is omitted, today is assumed. If the time is omitted, "00:00:00" is assumed. For more information on systemd timers, see [this article](https://opensource.com/article/20/7/systemd-timers).



