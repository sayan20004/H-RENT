const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (options) => {
  const msg = {
    to: options.email,
    from: process.env.SENDGRID_VERIFIED_SENDER, // Your verified sender email
    subject: options.subject,
    text: options.message,
    // html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${options.email}`);
  } catch (error) {
    console.error('Error sending email:', error);

    // Log more details if available
    if (error.response) {
      console.error(error.response.body)
    }
  }
};

module.exports = sendEmail;