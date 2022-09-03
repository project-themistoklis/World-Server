import twilio from "twilio";
import nodemailer from "nodemailer";

export default class Messenger {
  twilio_client = null;
  transporter = null;

  constructor() {
    this.twilio_client = new twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_NAME,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  sendSMS = (to, body) => {
    this.twilio_client.messages
      .create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      })
      .then((message) => console.log(message.sid));
  };
  sendEmail = (to, subject, body) => {
    const options = {
      from: process.env.EMAIL_NAME,
      to,
      subject,
      text: body,
    };

    this.transporter.sendMail(options, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(info);
      }
    });
  };
}
