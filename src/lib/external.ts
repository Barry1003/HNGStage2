interface GenderizeResponse { gender: string | null; probability: number; count: number; }
interface AgifyResponse { age: number | null; count: number; }
interface NationalizeResponse { country: { country_id: string; probability: number }[]; }

const COUNTRY_NAMES: Record<string, string> = {
  NG:"Nigeria",US:"United States",GB:"United Kingdom",DE:"Germany",FR:"France",
  IN:"India",BR:"Brazil",CN:"China",JP:"Japan",KE:"Kenya",GH:"Ghana",ZA:"South Africa",
  EG:"Egypt",AO:"Angola",BJ:"Benin",CI:"Ivory Coast",CM:"Cameroon",SN:"Senegal",
  TZ:"Tanzania",UG:"Uganda",ET:"Ethiopia",MX:"Mexico",CA:"Canada",AU:"Australia",
  RU:"Russia",IT:"Italy",ES:"Spain",KR:"South Korea",ID:"Indonesia",PK:"Pakistan",
  BD:"Bangladesh",PH:"Philippines",VN:"Vietnam",TR:"Turkey",IR:"Iran",TH:"Thailand",
  MM:"Myanmar",CO:"Colombia",AR:"Argentina",DZ:"Algeria",SD:"Sudan",IQ:"Iraq",
  MA:"Morocco",SA:"Saudi Arabia",PE:"Peru",UZ:"Uzbekistan",MY:"Malaysia",
  MZ:"Mozambique",AF:"Afghanistan",NE:"Niger",YE:"Yemen",KP:"North Korea",
  TW:"Taiwan",LK:"Sri Lanka",RO:"Romania",MW:"Malawi",CL:"Chile",KZ:"Kazakhstan",
  ZM:"Zambia",GT:"Guatemala",EC:"Ecuador",SY:"Syria",NL:"Netherlands",ZW:"Zimbabwe",
  SS:"South Sudan",CG:"Republic of the Congo",CD:"DR Congo",PT:"Portugal",SE:"Sweden",
  PL:"Poland",UA:"Ukraine",CZ:"Czech Republic",HU:"Hungary",GR:"Greece",BE:"Belgium",
  AT:"Austria",CH:"Switzerland",DK:"Denmark",FI:"Finland",NO:"Norway",NZ:"New Zealand",
  SG:"Singapore",IL:"Israel",AE:"United Arab Emirates",QA:"Qatar",KW:"Kuwait",
  TN:"Tunisia",LY:"Libya",SO:"Somalia",ML:"Mali",BF:"Burkina Faso",RW:"Rwanda",
  TD:"Chad",GN:"Guinea",BI:"Burundi",
};

export function getCountryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}

async function safeFetch(url: string, apiName: string): Promise<unknown> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    throw new ExternalApiError(apiName);
  }
}

export class ExternalApiError extends Error {
  constructor(public readonly apiName: string) {
    super(`${apiName} returned an invalid response`);
  }
}

export async function fetchGenderize(name: string) {
  const data = (await safeFetch(`https://api.genderize.io?name=${encodeURIComponent(name)}`, "Genderize")) as GenderizeResponse;
  if (!data.gender || data.count === 0) throw new ExternalApiError("Genderize");
  return { gender: data.gender, gender_probability: data.probability, sample_size: data.count };
}

export async function fetchAgify(name: string) {
  const data = (await safeFetch(`https://api.agify.io?name=${encodeURIComponent(name)}`, "Agify")) as AgifyResponse;
  if (data.age === null || data.age === undefined) throw new ExternalApiError("Agify");
  return { age: data.age };
}

export async function fetchNationalize(name: string) {
  const data = (await safeFetch(`https://api.nationalize.io?name=${encodeURIComponent(name)}`, "Nationalize")) as NationalizeResponse;
  if (!data.country || data.country.length === 0) throw new ExternalApiError("Nationalize");
  const top = data.country.reduce((a, b) => (a.probability >= b.probability ? a : b));
  return { country_id: top.country_id, country_name: getCountryName(top.country_id), country_probability: top.probability };
}
