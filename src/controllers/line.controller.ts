import { Request, Response } from "express";
import axios from "axios";
import { db } from "../config/db";

export const lineLogin = (req: Request, res: Response) => {
  const elderlyId = req.query.elderlyId as string;
  const state = elderlyId;

  const redirectUri = process.env.LINE_CALLBACK_URL!;

  const url =
    "https://access.line.me/oauth2/v2.1/authorize" +
    `?response_type=code` +
    `&client_id=${process.env.LINE_CHANNEL_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}` +
    `&scope=profile%20openid`;

  res.redirect(url);
};


export const lineCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query as { code: string; state: string };
  const elderlyId = state;

  try {
    const tokenRes = await axios.post(
      "https://api.line.me/oauth2/v2.1/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.LINE_CALLBACK_URL!,
        client_id: process.env.LINE_CHANNEL_ID!,
        client_secret: process.env.LINE_CHANNEL_SECRET!,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenRes.data.access_token;

    const profileRes = await axios.get("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const lineUserId = profileRes.data.userId;

    await db.query("UPDATE elderly SET line_user_id = ? WHERE id = ?", [
      lineUserId,
      elderlyId,
    ]);

    const oaLink = "https://line.me/R/ti/p/@401irdzu";

    res.redirect(oaLink);
  } catch (error) {
    console.error("LINE callback error:", error);
    res.status(500).send("LINE connect failed");
  }
};

export const getLineStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const [rows]: any = await db.query(
    "SELECT line_user_id FROM elderly WHERE id = ?",
    [id]
  );

  res.json(rows[0]);
};

export const unlinkLine = async (req: Request, res: Response) => {
  const { id } = req.params;
  await db.query("UPDATE elderly SET line_user_id = NULL WHERE id = ?", [id]);
  res.json({ success: true });
};

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;

export const lineWebhook = async (req: Request, res: Response) => {
  try {
    for (const event of req.body.events || []) {
      if (event.type === "postback") {
        const params = new URLSearchParams(event.postback.data);
        const action = params.get("action");
        const timeId = params.get("timeId");

        if (action === "taken" && timeId) {

          // เช็คก่อนว่ากดไปแล้วหรือยัง
          const [rows]: any = await db.query(
            `SELECT status FROM medicine_times WHERE id=?`,
            [timeId]
          );

          if (!rows.length || rows[0].status === "taken") {
            return res.sendStatus(200); // เคยกดแล้ว ไม่ต้องตอบซ้ำ
          }

          // อัปเดตครั้งแรก
          await db.query(
            `UPDATE medicine_times
             SET status='taken', response_at=NOW()
             WHERE id=?`,
            [timeId]
          );

          // ตอบกลับครั้งเดียว
          await axios.post(
            "https://api.line.me/v2/bot/message/reply",
            {
              replyToken: event.replyToken,
              messages: [
                {
                  type: "text",
                  text: "✅ บันทึกว่าทานยาเรียบร้อยแล้ว",
                },
              ],
            },
            {
              headers: {
                Authorization: `Bearer ${LINE_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
};


