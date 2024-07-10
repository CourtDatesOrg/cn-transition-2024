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



