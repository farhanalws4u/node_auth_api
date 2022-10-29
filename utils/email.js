import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  //1.) create a transporter ... a service that will actually send the email e.g. gmail.
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    }, // activate in gmail 'less secure app' option. gmail is not a production idea. only can send 500 mail per day.
  });

  //2.) define email options
  const mailOptions = {
    from: 'farhan khan <snowj4582@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  //3.) send the email with nodemailer
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
