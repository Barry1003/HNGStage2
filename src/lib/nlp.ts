export interface ParsedQuery {
  gender?: string;
  age_group?: string;
  country_id?: string;
  min_age?: number;
  max_age?: number;
}

const COUNTRY_MAP: Record<string, string> = {
  nigeria:"NG",ghana:"GH",kenya:"KE","south africa":"ZA",egypt:"EG",angola:"AO",
  benin:"BJ",senegal:"SN",tanzania:"TZ",uganda:"UG",ethiopia:"ET",cameroon:"CM",
  "ivory coast":"CI","united states":"US",usa:"US",america:"US","united kingdom":"GB",
  uk:"GB",england:"GB",germany:"DE",france:"FR",india:"IN",brazil:"BR",china:"CN",
  japan:"JP",canada:"CA",australia:"AU",russia:"RU",italy:"IT",spain:"ES",
  indonesia:"ID",pakistan:"PK",mexico:"MX",colombia:"CO",argentina:"AR",algeria:"DZ",
  morocco:"MA","saudi arabia":"SA",turkey:"TR",iran:"IR",thailand:"TH",
  philippines:"PH",vietnam:"VN","south korea":"KR",malaysia:"MY",peru:"PE",
  afghanistan:"AF",netherlands:"NL",chile:"CL",romania:"RO",portugal:"PT",
  sweden:"SE",poland:"PL",ukraine:"UA",greece:"GR",belgium:"BE",austria:"AT",
  switzerland:"CH",denmark:"DK",finland:"FI",norway:"NO","new zealand":"NZ",
  singapore:"SG",israel:"IL",qatar:"QA",kuwait:"KW",tunisia:"TN",libya:"LY",
  somalia:"SO",mali:"ML",rwanda:"RW",chad:"TD",guinea:"GN",burundi:"BI",
  niger:"NE",zambia:"ZM",zimbabwe:"ZW",malawi:"MW",sudan:"SD",iraq:"IQ",
  syria:"SY",yemen:"YE",
};

export function parseNaturalLanguage(q: string): ParsedQuery | null {
  const query = q.toLowerCase().trim();
  if (!query) return null;
  const result: ParsedQuery = {};

  if (/\bmales?\b/.test(query) && !/\bfemales?\b/.test(query)) result.gender = "male";
  else if (/\bfemales?\b/.test(query) && !/\bmales?\b/.test(query)) result.gender = "female";

  if (/\bchildren\b|\bchild\b|\bkids?\b/.test(query)) result.age_group = "child";
  else if (/\bteenagers?\b|\bteens?\b/.test(query)) result.age_group = "teenager";
  else if (/\bseniors?\b|\bolderly\b|\bold people\b/.test(query)) result.age_group = "senior";
  else if (/\badults?\b/.test(query)) result.age_group = "adult";

  if (/\byoung\b/.test(query)) {
    result.min_age = result.min_age ?? 16;
    result.max_age = result.max_age ?? 24;
  }

  const aboveMatch = query.match(/(?:above|over|older than)\s+(\d+)/);
  if (aboveMatch) result.min_age = parseInt(aboveMatch[1]);

  const belowMatch = query.match(/(?:below|under|younger than)\s+(\d+)/);
  if (belowMatch) result.max_age = parseInt(belowMatch[1]);

  const betweenMatch = query.match(/between\s+(\d+)\s+and\s+(\d+)/);
  if (betweenMatch) { result.min_age = parseInt(betweenMatch[1]); result.max_age = parseInt(betweenMatch[2]); }

  const agedMatch = query.match(/aged?\s+(\d+)/);
  if (agedMatch) { result.min_age = parseInt(agedMatch[1]); result.max_age = parseInt(agedMatch[1]); }

  const sortedCountries = Object.keys(COUNTRY_MAP).sort((a, b) => b.length - a.length);
  for (const country of sortedCountries) {
    if (query.includes(country)) { result.country_id = COUNTRY_MAP[country]; break; }
  }

  if (Object.keys(result).length === 0) return null;
  return result;
}
