provider "aws" {
  region	= var.region
}

resource "aws_db_instance" "cn-db-$$INSTANCE$$" {
  allocated_storage    = 10
  db_name              = "cn"
  identifier           = "cn-db-$$INSTANCE$$"
  engine               = "postgres"
  engine_version       = "13.14"
  instance_class       = "db.t3.micro"
  username             = "cn"
  password             = "$$CN_DB_PASSWORD$$"
  parameter_group_name = "default.postgres13"
  skip_final_snapshot  = true
  publicly_accessible  = true
  db_subnet_group_name = $$DB_SUBNET_GROUP_NAME$$
  vpc_security_group_ids = [aws_security_group.cn-pg-sg-$$INSTANCE$$.id]
}

resource "aws_security_group" "cn-pg-sg-$$INSTANCE$$" {
  name        = "cn-pg-sg-$$INSTANCE$$"
  description = "Allow public access to postgres"
  vpc_id      = $$CN_VPC_ID$$

  ingress {
    description      = "Inbound access to postgres"
    from_port        = 5432
    to_port          = 5432
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "cn-pg-sg-$$INSTANCE$$"
  }
}

output "CN_DB_HOST_ENDPOINT" {
  value = "${aws_db_instance.cn-db-$$INSTANCE$$.endpoint}"
}
