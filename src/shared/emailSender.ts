import nodemailer, { SendMailOptions, TransportOptions } from "nodemailer";
import config from "../config";

const emailSender = async (email: string, html: string, subject: string) => {
  if (!config.emailSender.host) return;

  const transporter = nodemailer.createTransport({
    host: config.emailSender.host,
    port: config.emailSender.port,
    secure: config.emailSender.secure,
    auth: {
      user: config.emailSender.user,
      pass: config.emailSender.pass,
    },
  } as TransportOptions);

  const mailOptions: SendMailOptions = {
    from: config.emailSender.user,
    to: email,
    subject: subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
};

export default emailSender;
