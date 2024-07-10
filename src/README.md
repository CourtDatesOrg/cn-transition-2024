# Building the Infrastructure for Court Reminders - eCourts Edition

Before beginning, copy [make_variables.sample](./make_variables.sample) to ```make_variables``` and set ```INSTANCE``` to a value that will be used to create unique infrastructure names. The ```INSTANCE``` name should consist of lowercase alphanumeric characters and hyphens only.

#  Step 0
If you are not using existing resources, build the network resources, as follows:

```sh
cd 0-network
make init
make apply-y
cd ..
```

Now replace the four network variables in ```make_variables``` with those from ```./0-network/cn_network_variables.generated```.

