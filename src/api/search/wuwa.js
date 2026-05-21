// save: src/routes/anime/wuwa.js

import axios from "axios";
import * as cheerio from "cheerio";

const BASE =
  "https://wutheringwaves.fandom.com";

const SEARCH =
  `${BASE}/wiki/Special:Search`;

async function searchWuwa(query) {

  const { data } = await axios.get(
    SEARCH,
    {
      params: {
        query
      },
      headers: {
        "User-Agent":
          "Mozilla/5.0"
      }
    }
  );

  const $ = cheerio.load(data);

  const results = [];

  $(".unified-search__result").each(
    (_, el) => {

      const title = $(el)
        .find(
          ".unified-search__result__title"
        )
        .text()
        .trim();

      const href = $(el)
        .find("a")
        .attr("href");

      const desc = $(el)
        .find(
          ".unified-search__result__snippet"
        )
        .text()
        .replace(/\s+/g, " ")
        .trim();

      if (title && href) {

        results.push({
          title,
          description: desc,
          url: href.startsWith("http")
            ? href
            : BASE + href
        });

      }

    }
  );

  return results;

}

async function getCharacter(url) {

  const { data } = await axios.get(
    url,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0"
      }
    }
  );

  const $ = cheerio.load(data);

  const name =
    $("h1.page-header__title")
      .text()
      .trim();

  const description =
    $(".mw-parser-output p")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();

  const image =
    $(".pi-image-thumbnail")
      .attr("src") ||
    $("meta[property='og:image']")
      .attr("content");

  const info = {};

  $(".pi-data").each((_, el) => {

    const label = $(el)
      .find(".pi-data-label")
      .text()
      .trim()
      .toLowerCase();

    const value = $(el)
      .find(".pi-data-value")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (label && value) {
      info[label] = value;
    }

  });

  let story = "";

  $("h2").each((_, el) => {

    const title = $(el)
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
            next.text().trim() +
            "\n\n";

        }

        next = next.next();

      }

    }

  });

  return {

    name,

    description,

    story:
      story.trim() ||
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

        const search =
          await searchWuwa(
            query
          );

        if (
          !search.length
        ) {

          return res.status(404).json({
            status: false,
            error:
              "Character not found"
          });

        }

        const detail =
          await getCharacter(
            search[0].url
          );

        res.status(200).json({

          status: true,

          result: {

            ...detail,

            search_results:
              search

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