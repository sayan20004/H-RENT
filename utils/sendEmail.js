const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (options) => {
  const msg = {
    to: options.email,
    from: process.env.SENDGRID_VERIFIED_SENDER, 
    subject: options.subject,
    text: options.message,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${options.email}`);
  } catch (error) {
    console.error('Error sending email:', error);


    if (error.response) {
      console.error(error.response.body)
    }
  }
};

module.exports = sendEmail;