import axios from "axios";

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;

export const sendLineMedicineNotify = async (
  lineUserId: string,
  message: string,
  medicineTimeId: number,
  imageUrl?: string | null
) => {
  const messages: any[] = [];

  if (imageUrl) {
    messages.push({
      type: "image",
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl,
    });
  }

  messages.push({
    type: "template",
    altText: "แจ้งเตือนทานยา",
    template: {
      type: "buttons",
      text: message,
      actions: [
        {
          type: "postback",
          label: "ทานแล้ว",
          data: `action=taken&timeId=${medicineTimeId}`,
        },
      ],
    },
  });

  await axios.post(
    "https://api.line.me/v2/bot/message/push",
    {
      to: lineUserId,
      messages,
    },
    {
      headers: {
        Authorization: `Bearer ${LINE_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
};
