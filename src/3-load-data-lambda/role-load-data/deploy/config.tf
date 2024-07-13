provider "aws" {
  region	= var.region
}

resource "aws_iam_role" "cn-load-data-role-$$INSTANCE$$" {
    name = "load-data-role-${var.instance}"
    assume_role_policy = file("./policy_role.json")
    tags = {
      Name          = "cn-load-data-role-${var.instance}"
      Description   = "Role used for lambda functions to load AOC court dates data."
    }
}

resource "aws_iam_policy" "secrets_manager_policy-ld-$$INSTANCE$$" {
  name        = "secrets_manager_policy-ld-${var.instance}"
  description = "Read secrets"
  policy = templatefile("./policy_secrets_manager.json",{})
}

resource "aws_iam_policy" "invoke_lambda_policy-ld-$$INSTANCE$$" {
  name        = "invoke_lambda_policy-ld-${var.instance}"
  description = "Invoke another Lambda"
  policy = templatefile("./policy_invoke_lambda.json",{})
}

resource "aws_iam_role_policy_attachment" "lambda_basic-$$INSTANCE$$" {
    role        = aws_iam_role.cn-load-data-role-$$INSTANCE$$.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_s3_access-$$INSTANCE$$" {
    role        = aws_iam_role.cn-load-data-role-$$INSTANCE$$.name
    policy_arn  = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_ses_access-$$INSTANCE$$" {
    role        = aws_iam_role.cn-load-data-role-$$INSTANCE$$.name
    policy_arn  = "arn:aws:iam::aws:policy/AmazonSESFullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access-$$INSTANCE$$" {
    role        = aws_iam_role.cn-load-data-role-$$INSTANCE$$.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy_attachment" "secrets_manager-$$INSTANCE$$" {
    role        = aws_iam_role.cn-load-data-role-$$INSTANCE$$.name
    policy_arn  = aws_iam_policy.secrets_manager_policy-ld-$$INSTANCE$$.arn
}

resource "aws_iam_role_policy_attachment" "invoke_lambda_policy-$$INSTANCE$$" {
    role        = aws_iam_role.cn-load-data-role-$$INSTANCE$$.name
    policy_arn  = aws_iam_policy.invoke_lambda_policy-ld-$$INSTANCE$$.arn
}

output "load_data_role_arn" {
  value = "${aws_iam_role.cn-load-data-role-$$INSTANCE$$.arn}"
}