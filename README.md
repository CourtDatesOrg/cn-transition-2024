# Court Reminders Transition 2024
Documentation and artifacts for the 2024 NC eCourts transition

## Overview
On July 22, 2024 the Buncombe County court system will transition to a new statewide eCourts system. As that point the AOC website that the court reminders system has used to look up court dates will become inaccessible.

The data will be made available through a fixed-width text file delivered daily to Buncombe County by AOC and containing the upcoming 6 months of criminal court dates. Details of the file may be found [here](resources/Criminal.Calendar.-.Odyssey.Court.Calendar.File.Layout.pdf).

The transitional system consists of 3 parts:
1. A daily job that copies the court dates file from a Buncombe County FTP server to S3
2. A function triggered by the creation of the file on S3 that loads the court dates into a database
3. An updated court reminders system that looks up court dates in that database rather than on an AOC website

The data infrastructure to accomplish 1 and 2 is in this repository. The updated court reminder system is still in the [existing repository] (https://github.com/CodeWithAsheville/court-notifications).

To build the data infrastructure, follow the instructions in the [README](./src/README.md) file in the [src](./src) directory.

