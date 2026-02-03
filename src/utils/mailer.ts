import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

export const sendOtpEmail = async (to: string, otp: string) => {
  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: "รหัส OTP ของคุณ",
      text: `รหัส OTP ของคุณคือ ${otp} (หมดอายุใน 5 นาที)`,
    });

    console.log("Email sent to:", to);

  } catch (err: any) {
    console.error(
      "SendGrid error:",
      err.response?.body || err.message || err
    );

    // ❗ ห้าม throw ต่อ
    // เพื่อไม่ให้ API กลายเป็น 500
  }
};
