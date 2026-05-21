// save: src/routes/anime/wuwa.js

import axios from "axios";
import * as cheerio from "cheerio";

const API =
  "https://wutheringwaves.fandom.com/api.php";

const BASE =
  "https://wutheringwaves.fandom.com";

async function searchCharacter(query) {

  const { data } = await axios.get(API, {
    params: {
      action: "query",
      list: "search",
      srsearch: query,
      format: "json"
    },
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  return (
    data?.query?.search || []
  );

}

async function getPage(title) {

  const url =
    `${BASE}/wiki/${encodeURIComponent(title)}`;

  const { data } = await axios.get(
    url,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0"
      }
    }
  );

  return {
    html: data,
    url
  };

}

function clean(text = "") {

  return text
    .replace(/\s+/g, " ")
    .trim();

}

async function getCharacter(title) {

  const {
    html,
    url
  } = await getPage(title);

  const $ = cheerio.load(html);

  const image =
    $(".pi-image-thumbnail")
      .attr("src") ||
    $("meta[property='og:image']")
      .attr("content") ||
    null;

  const description =
    clean(
      $(".mw-parser-output p")
        .first()
        .text()
    );

  const info = {};

  $(".pi-data").each((_, el) => {

    const label =
      clean(
        $(el)
          .find(
            ".pi-data-label"
          )
          .text()
      );

    const value =
      clean(
        $(el)
          .find(
            ".pi-data-value"
          )
          .text()
      );

    if (label && value) {
      info[label] = value;
    }

  });

  let story = "";

  $("h2").each((_, el) => {

    const title =
      $(el)
        .text()
        .toLowerCase();

    if (
      title.includes("story") ||
      title.includes("lore") ||
      title.includes("background")
    ) {

      let next =
        $(el).next();

      while (
        next.length &&
        next[0].name !== "h2"
      ) {

        if (
          next[0].name === "p"
        ) {

          story +=
            clean(
              next.text()
            ) + "\n\n";

        }

        next = next.next();

      }

    }

  });

  return {

    name: title,

    description,

    story:
      story ||
      "No story found",

    image,

    info,

    url

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

        const results =
          await searchCharacter(
            query
          );

        if (
          !results.length
        ) {

          return res.status(404).json({
            status: false,
            error:
              "Character not found"
          });

        }

        const first =
          results[0];

        const detail =
          await getCharacter(
            first.title
          );

        res.status(200).json({

          status: true,

          result: {

            ...detail,

            search_results:
              results.map(v => ({
                title: v.title,
                snippet: clean(
                  v.snippet.replace(
                    /<[^>]+>/g,
                    ""
                  )
                ),
                url:
                  `${BASE}/wiki/${encodeURIComponent(v.title)}`
              }))

          }

        });

      } catch (e) {

        res.status(500).json({

          status: false,

          error: e.message

        });

      }

    }
  );

}