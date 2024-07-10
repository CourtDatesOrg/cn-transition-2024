terraform {
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/cn/$$INSTANCE$$/cn-network/terraform.tfstate"
  }
}