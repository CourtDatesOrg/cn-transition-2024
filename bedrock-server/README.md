# Setting Up the Bedrock Server

## Step 1 Create and configure an EC2 instance
Create an EC2 server with the userdata from [userdata.sh](userdata.sh). Attach an elastic IP to it that has been authorized for access to the Buncombe County SFTP server (currently 52.87.48.111).

## Step 2 Set up Github access and clone needed directories
Run the following command
```sh
ssh-keygen -t ed25519 -C
```
Copy the contents of the generated ```.pub``` file in the ```~/.ssh``` directory to Github (navigate to account settings, then to [```SSH and GPG Keys```](https://github.com/settings/keys), and create a new SSH key.

Now clone [this repository](https://github.com/CourtDatesOrg/cn-transition-2024) and the [Bedrock repository](https://github.com/DeepWeave/bedrock2).

## Step 3 Prepare the Bedrock application

## Step 4 Set up the systemd timer to run the FTP job
See [this article](https://opensource.com/article/20/7/systemd-timers) on using systemd timers.
