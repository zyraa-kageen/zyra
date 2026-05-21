// save: src/routes/anime/wuwa.js

import axios from "axios";

const API =
  "https://wutheringwaves.fandom.com/api.php";

async function searchCharacter(query) {

  const { data } = await axios.get(API, {
    params: {
      action: "opensearch",
      search: query,
      limit: 1,
      namespace: 0,
      format: "json"
    },
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  return data?.[1]?.[0] || null;
}

async function getPage(title) {

  const { data } = await axios.get(API, {
    params: {
      action: "parse",
      page: title,
      prop: "wikitext",
      format: "json"
    },
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  return data?.parse?.wikitext?.["*"] || "";
}

async function getExtract(title) {

  const { data } = await axios.get(API, {
    params: {
      action: "query",
      prop: "extracts",
      explaintext: 1,
      exintro: 1,
      titles: title,
      format: "json",
      formatversion: 2
    },
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  return data?.query?.pages?.[0]?.extract || "";
}

function cleanText(text = "") {

  return text
    .replace(/\[\[|\]\]/g, "")
    .replace(/\{\{.*?\}\}/g, "")
    .replace(/<.*?>/g, "")
    .replace(/File:/gi, "")
    .replace(/\|/g, "")
    .trim();

}

function findValue(text, ...keys) {

  for (const key of keys) {

    const regex = new RegExp(
      `\\|\\s*${key}\\s*=\\s*([^\\n]+)`,
      "i"
    );

    const match = text.match(regex);

    if (match?.[1]) {

      const value =
        cleanText(match[1]);

      if (
        value &&
        value.toLowerCase() !== "unknown"
      ) {
        return value;
      }

    }

  }

  return null;

}

function getImage(text) {

  const match =
    text.match(
      /\|\s*image\s*=\s*(.+)/i
    );

  if (!match?.[1]) return null;

  const file =
    cleanText(match[1]);

  return `https://static.wikia.nocookie.net/wutheringwaves/images/${encodeURIComponent(file)}`;

}

function getStory(text) {

  const loreMatch =
    text.match(
      /==\s*Lore\s*==([\s\S]*?)(==|$)/i
    );

  const storyMatch =
    text.match(
      /==\s*Story\s*==([\s\S]*?)(==|$)/i
    );

  const aboutMatch =
    text.match(
      /==\s*About\s*==([\s\S]*?)(==|$)/i
    );

  const raw =
    loreMatch?.[1] ||
    storyMatch?.[1] ||
    aboutMatch?.[1];

  if (!raw) return null;

  return cleanText(raw)
    .replace(/\n{2,}/g, "\n")
    .slice(0, 2000);

}

async function wuwa(query) {

  const title =
    await searchCharacter(query);

  if (!title) {
    return {
      status: false,
      error: "Character not found"
    };
  }

  const wikiText =
    await getPage(title);

  const extract =
    await getExtract(title);

  return {

    status: true,

    result: {

      name: title,

      description: extract,

      story:
        getStory(wikiText),

      rarity:
        findValue(
          wikiText,
          "rarity"
        ),

      weapon:
        findValue(
          wikiText,
          "weapon"
        ),

      attribute:
        findValue(
          wikiText,
          "attribute",
          "element"
        ),

      faction:
        findValue(
          wikiText,
          "faction",
          "affiliation"
        ),

      gender:
        findValue(
          wikiText,
          "gender",
          "sex"
        ),

      birthday:
        findValue(
          wikiText,
          "birthday"
        ),

      homeland:
        findValue(
          wikiText,
          "nation",
          "region",
          "homeland"
        ),

      release_date:
        findValue(
          wikiText,
          "release_date"
        ),

      hp:
        findValue(
          wikiText,
          "hp",
          "base_hp"
        ),

      atk:
        findValue(
          wikiText,
          "atk",
          "base_atk"
        ),

      def:
        findValue(
          wikiText,
          "def",
          "base_def"
        ),

      crit_rate:
        findValue(
          wikiText,
          "crit_rate"
        ),

      crit_dmg:
        findValue(
          wikiText,
          "crit_dmg"
        ),

      image:
        getImage(wikiText),

      url:
        `https://wutheringwaves.fandom.com/wiki/${encodeURIComponent(title)}`

    }

  };

}

export default function(app) {

  app.get(
    "/search/wuwa",
    async (req, res) => {

      try {

        const {
          query
        } = req.query;

        if (!query) {

          return res.status(400).json({
            status: false,
            error:
              "Query is required"
          });

        }

        const result =
          await wuwa(query);

        res.status(200).json(result);

      } catch (e) {

        res.status(500).json({
          status: false,
          error: e.message
        });

      }

    }
  );

}