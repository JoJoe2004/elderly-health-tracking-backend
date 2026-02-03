import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendOtpEmail = async (to: string, otp: string) => {
  await sgMail.send({
    to,
    from: process.env.EMAIL_USER!, // ต้องเป็น email ที่ยืนยันใน SendGrid
    subject: "รหัส OTP ของคุณ",
    text: `รหัส OTP ของคุณคือ ${otp} (หมดอายุใน 5 นาที)`
  });
};
