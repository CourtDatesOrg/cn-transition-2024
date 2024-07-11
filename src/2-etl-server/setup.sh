

sudo systemctl daemon-reload
sudo systemctl start aocGet.service
sudo systemctl status aocGet.service
sudo journalctl -S today -f -u aocGet.service

chmod 644 both
