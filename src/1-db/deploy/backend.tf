terraform {
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/cn/$$INSTANCE$$/testing/cn-db/terraform.tfstate"
  }
}