terraform {
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/cn/$$INSTANCE$$/cn-load-data-role/terraform.tfstate"
  }
}