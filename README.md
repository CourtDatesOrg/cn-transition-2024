# Court Reminders Transition 2024
Documentation and artifacts for the 2024 NC eCourts transition

## Overview
On July 22, 2024 the Buncombe County court system will transition to a new statewide eCourts system. As that point the AOC website that the court reminders system has used to look up court dates will become inaccessible.

The data will be made available through a fixed-width text file delivered daily to Buncombe County by AOC and containing the upcoming 6 months of criminal court dates. Details of the file may be found [here](resources/Criminal.Calendar.-.Odyssey.Court.Calendar.File.Layout.pdf).

The transitional system consists of 3 parts:
1. An EC2 server that runs a daily script to copy the court dates file to S3, the [Bedrock Server](bedrock-server)
2. A Lambda triggered by the creation of the file on S3 that loads the court dates into a database (see the [court-notifications-data repository](https://github.com/CodeWithAsheville/court-notifications-data)).
3. A new version of the court reminders system that looks up court dates in that database rather than on an AOC website (still in the [court-notifications repository](https://github.com/CodeWithAsheville/court-notifications))



sudo systemctl daemon-reload
sudo systemctl start aocGet.service
sudo systemctl status aocGet.service
sudo journalctl -S today -f -u aocGet.service

chmod 644 both
