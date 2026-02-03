import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendOtpEmail = async (to: string, otp: string) => {
  await sgMail.send({
    to,
    from: "navaponbutsa@gmail.com", // ⚠️ ต้องตรงกับ Verified sender
    subject: "รหัส OTP ของคุณ",
    text: `รหัส OTP ของคุณคือ ${otp}`,
  });
};
