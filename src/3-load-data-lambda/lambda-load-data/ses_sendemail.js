let { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

async function ses_sendemail(emailAddrs, emailSender, textEmail, htmlEmail, emailSubject)  {
  console.log('email sender = ', emailSender);
  console.log('To addresses are: ', emailAddrs);

  const sesClient = new SESClient({ region: "us-east-1" });

  const input = {
    Source: emailSender,
    Destination: {
      ToAddresses: emailAddrs,
    },
    Message: {
      Subject: {
        Data: emailSubject,
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: textEmail,
          Charset: 'UTF-8',
        },
        Html: {
          Data: htmlEmail,
          Charset: 'UTF-8',
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(input);
    const response = await sesClient.send(command);
    console.log("Email sent successfully:", response.MessageId);
    return "Email sent successfully:" + response.MessageId;
  } catch (error) {
    console.error("Error sending email:", error);
    console.log(error);
    return error;
  }
}

module.exports = {
  ses_sendemail
};

