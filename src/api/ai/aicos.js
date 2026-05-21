// save: src/routes/ai/unlimitedai.js

import crypto from "node:crypto";

const API =
  "https://app.unlimitedai.chat/api/chat";

const ua =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

function buildCookie(
  deviceId,
  chatId
) {

  return [
    `NEXT_LOCALE=id`,
    `u_device_id=${deviceId}`,
    `home_chat_id=${chatId}`
  ].join("; ");

}

const CHARACTERS = {

  rimuru: {

    name:
      "Rimuru Tempest",

    prompt:
      `Kamu adalah Rimuru Tempest dari Tensei Shitara Slime Datta Ken. Kamu bijak, santai, ramah, dan cerdas. Kamu suka membantu orang lain dan menjelaskan sesuatu dengan simpel tapi detail. Kamu bicara dengan gaya santai bahasa Indonesia dan kadang bercanda ringan.`

  },

  frieren: {

    name:
      "Frieren",

    prompt:
      `Kamu adalah Frieren dari Sousou no Frieren. Kamu bicara dengan tenang, dingin, dan sedikit datar tapi tetap perhatian. Kamu sangat berpengalaman dan sering memberi jawaban yang bijak. Kamu memakai bahasa Indonesia yang sederhana dan lembut.`

  },

  kobo: {

    name:
      "Kobo Kanaeru",

    prompt:
      `Kamu adalah Kobo Kanaeru dari Hololive Indonesia. Kamu ceria, random, dan suka bilang DAJOOR!`

  },

  waguri: {

    name:
      "Waguri",

    prompt:
      `Kamu adalah Waguri-san yang pemalu dan lembut.`

  },

  jokowi: {

    name:
      "Pak Jokowi",

    prompt:
      `Kamu adalah Jokowi dengan gaya sederhana dan logat Jawa.`

  },

  prabowo: {

    name:
      "Pak Prabowo",

    prompt:
      `Kamu adalah Prabowo yang tegas dan patriotik.`

  }

};

async function UnlimitedAI(
  text,
  character = "frieren",
  customPrompt = ""
) {

  const chatId =
    crypto.randomUUID();

  const deviceId =
    crypto.randomUUID();

  const char =
    CHARACTERS[character] ||
    CHARACTERS.frieren;

  // kalau ada custom prompt
  // bakal ditambahin
  const systemPrompt =

`${char.prompt}

${customPrompt ? `Tambahan instruksi:
${customPrompt}

` : ""}User:
${text}`;

  const createdAt =
    new Date().toISOString();

  const body = {

    chatId,

    messages: [

      {

        id:
          crypto.randomUUID(),

        role:
          "user",

        content:
          systemPrompt,

        parts: [

          {
            type: "text",
            text: systemPrompt
          }

        ],

        createdAt

      }

    ],

    selectedChatModel:
      "chat-model-reasoning",

    selectedCharacter:
      null,

    selectedStory:
      null,

    deviceId,

    locale:
      "id"

  };

  const headers = {

    "user-agent":
      ua,

    "content-type":
      "application/json",

    "x-next-intl-locale":
      "id",

    accept:
      "*/*",

    origin:
      "https://app.unlimitedai.chat",

    referer:
      "https://app.unlimitedai.chat/id",

    cookie:
      buildCookie(
        deviceId,
        chatId
      )

  };

  const response =
    await fetch(API, {

      method:
        "POST",

      headers,

      body:
        JSON.stringify(body)

    });

  if (!response.ok) {

    const err =
      await response.text();

    throw new Error(err);

  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let buffer = "";
  let answer = "";

  while (true) {

    const {
      value,
      done
    } = await reader.read();

    if (done) break;

    buffer += decoder.decode(
      value,
      { stream: true }
    );

    const lines =
      buffer.split("\n");

    buffer =
      lines.pop() || "";

    for (const rawLine of lines) {

      const line =
        rawLine.trim();

      if (!line) continue;

      try {

        const json =
          JSON.parse(line);

        if (
          json.type === "delta" &&
          typeof json.delta === "string"
        ) {

          answer +=
            json.delta;

        }

      } catch {}

    }

  }

  return {

    status:
      true,

    character:
      char.name,

    model:
      "chat-model-reasoning",

    custom_prompt:
      customPrompt || null,

    answer

  };

}

export default function(app) {

  app.get(
    "/ai/unlimitedai",
    async (
      req,
      res
    ) => {

      const {

        text,

        character =
          "frieren",

        prompt = ""

      } = req.query;

      if (!text) {

        return res.status(400).json({

          status:
            false,

          error:
            "text is required"

        });

      }

      try {

        const result =
          await UnlimitedAI(
            text,
            character,
            prompt
          );

        res.status(200).json(
          result
        );

      } catch (e) {

        res.status(500).json({

          status:
            false,

          error:
            e.message

        });

      }

    }
  );

}
