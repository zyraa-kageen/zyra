import axios from 'axios'

const BASE =
  'https://wutheringwaves.fandom.com/api.php'

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36'
}

function cleanText(text = '') {
  return text
    .replace(/\[\[|\]\]/g, '')
    .replace(/<.*?>/g, '')
    .replace(/\{\{.*?\}\}/g, '')
    .replace(/File:/gi, '')
    .replace(/'''/g, '')
    .trim()
}

function findValue(text, ...keys) {
  for (const key of keys) {

    const regex = new RegExp(
      `\\|\\s*${key}\\s*=\\s*([^\\n]+)`,
      'i'
    )

    const match = text.match(regex)

    if (match?.[1]) {

      const clean =
        cleanText(match[1])

      if (
        clean &&
        clean.toLowerCase() !== 'unknown' &&
        clean.toLowerCase() !== 'null'
      ) {
        return clean
      }
    }
  }

  return undefined
}

async function wuwa(query = 'Rover') {

  // SEARCH
  const search = await axios.get(BASE, {
    params: {
      action: 'opensearch',
      search: query,
      limit: 1,
      namespace: 0,
      format: 'json'
    },
    headers
  })

  const title =
    search.data?.[1]?.[0]

  if (!title) {
    throw new Error('Character not found')
  }

  // EXTRACT
  const extract = await axios.get(BASE, {
    params: {
      action: 'query',
      prop: 'extracts',
      explaintext: 1,
      exintro: 1,
      titles: title,
      format: 'json',
      formatversion: 2
    },
    headers
  })

  const page =
    extract.data.query.pages[0]

  // PARSE
  const wiki = await axios.get(BASE, {
    params: {
      action: 'parse',
      page: title,
      prop: 'wikitext|images',
      format: 'json'
    },
    headers
  })

  const text =
    wiki.data.parse?.wikitext?.['*']

  if (!text) {
    throw new Error('No data found')
  }

  // IMAGE
  let image

  const images =
    wiki.data.parse?.images || []

  const png =
    images.find(v =>
      /\.(png|jpg|jpeg|webp)$/i.test(v)
    )

  if (png) {

    const imgReq = await axios.get(BASE, {
      params: {
        action: 'query',
        titles: `File:${png}`,
        prop: 'imageinfo',
        iiprop: 'url',
        format: 'json'
      },
      headers
    })

    const pages =
      imgReq.data.query.pages

    const first =
      Object.values(pages)[0]

    image =
      first?.imageinfo?.[0]?.url
  }

  // STORY
  let story

  const sections = text.match(
    /==\s*(Lore|Story|Background|Profile|Introduction)\s*==([\s\S]*?)(?=\n==|$)/i
  )

  if (sections?.[2]) {

    story = cleanText(sections[2])
      .replace(/\n+/g, ' ')
      .slice(0, 1000)
  }

  // RESULT
  const result = {

    name: title,

    description:
      page.extract,

    story,

    rarity:
      findValue(text, 'rarity'),

    weapon:
      findValue(text, 'weapon'),

    attribute:
      findValue(
        text,
        'attribute',
        'element'
      ),

    faction:
      findValue(
        text,
        'affiliation',
        'faction'
      ),

    gender:
      findValue(
        text,
        'sex',
        'gender'
      ),

    birthday:
      findValue(
        text,
        'birthday'
      ),

    homeland:
      findValue(
        text,
        'nation',
        'region',
        'homeland'
      ),

    release_date:
      findValue(
        text,
        'release_date',
        'release date'
      ),

    hp:
      findValue(
        text,
        'hp',
        'base_hp',
        'HP'
      ),

    atk:
      findValue(
        text,
        'atk',
        'base_atk',
        'ATK'
      ),

    def:
      findValue(
        text,
        'def',
        'base_def',
        'DEF'
      ),

    crit_rate:
      findValue(
        text,
        'crit_rate',
        'crit rate'
      ),

    crit_dmg:
      findValue(
        text,
        'crit_dmg',
        'crit damage'
      ),

    image,

    url:
      `https://wutheringwaves.fandom.com/wiki/${encodeURIComponent(title)}`
  }

  // REMOVE EMPTY
  Object.keys(result).forEach(key => {

    if (
      result[key] === undefined ||
      result[key] === null ||
      result[key] === ''
    ) {
      delete result[key]
    }

  })

  return result
}

export default function(app) {

  app.get('/search/wuwa', async (req, res) => {

    const {
      query = 'Rover'
    } = req.query

    if (!query) {
      return res.status(400).json({
        status: false,
        error: 'Query is required'
      })
    }

    try {

      const result =
        await wuwa(query)

      res.status(200).json({
        status: true,
        result
      })

    } catch (e) {

      res.status(500).json({
        status: false,
        error:
          e.response?.data ||
          e.message
      })

    }

  })

}