import nodemailer from "nodemailer";

export const sendOtpEmail = async (to: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"EHT Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: "รหัส OTP ของคุณ",
    text: `รหัส OTP ของคุณคือ ${otp} (หมดอายุใน 5 นาที)`,
  });
};
