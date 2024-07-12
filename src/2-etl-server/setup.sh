curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
mkdir -p ~/miniconda3
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3
rm -rf ~/miniconda3/miniconda.sh
~/miniconda3/bin/conda init bash
source ~/.bashrc
conda create -n aoc python=3.12 -y
echo "conda activate aoc" >> ~/.bashrc
source ~/.bashrc # Or just run "conda activate aoc"

sudo systemctl daemon-reload
sudo systemctl start aocGet.service
sudo systemctl status aocGet.service
sudo journalctl -S today -f -u aocGet.service

chmod 644 both
