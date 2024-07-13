terraform { 
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/cn/$$INSTANCE$$/cn-lambda-load-data/terraform.tfstate"
  }
}
