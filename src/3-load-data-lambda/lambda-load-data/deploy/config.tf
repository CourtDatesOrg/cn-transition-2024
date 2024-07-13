provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "load_data_fn-$$INSTANCE$$" {
    description      = "Function to load AOC court dates data" 
    filename        = "../function.zip"
    function_name   = "load_data_fn-$$INSTANCE$$"
    role            = data.terraform_remote_state.cn-load-data-role.outputs.load_data_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "nodejs20.x"
    source_code_hash = filebase64sha256("../function.zip")
    timeout         = 900
    memory_size     = 256
    environment {
        variables = {
            MAX_PERCENT_CHANGE = $$MAX_PERCENT_CHANGE$$
            FILE_REGEXP = $$FILE_REGEXP$$
        }
    }
}

data "aws_s3_bucket" "courttexts" {
  bucket = "courttexts"
}

resource "aws_lambda_permission" "allow_bucket" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.load_data_fn-$$INSTANCE$$.arn
  principal     = "s3.amazonaws.com"
  source_arn    = data.aws_s3_bucket.courttexts.arn
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = data.aws_s3_bucket.courttexts.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.load_data_fn-$$INSTANCE$$.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.allow_bucket]
}

output "load_data_fn_arn" {
  value = "${aws_lambda_function.load_data_fn-$$INSTANCE$$.arn}"
}