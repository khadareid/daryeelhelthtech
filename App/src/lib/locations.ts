/**
 * Worldwide countries for Profile Country (searchable).
 * Detailed Region/City lists for East Africa; other countries use free-text.
 */

export type LocationCountry = {
  name: string;
  regions: { name: string; cities: string[] }[];
};

const EAST_AFRICA_DETAIL: LocationCountry[] = [
  {
    name: 'Somaliland',
    regions: [
      {
        name: 'Maroodi Jeex',
        cities: ['Hargeisa', 'Gabiley', 'Wajaale', 'Allaybaday', 'Salahley'],
      },
      {
        name: 'Togdheer',
        cities: ['Burao', 'Oodweyne', 'Buuhoodle', 'Qoryale'],
      },
      { name: 'Sahil', cities: ['Berbera', 'Sheikh', 'Bulhar'] },
      {
        name: 'Sanaag',
        cities: ['Erigavo', 'El Afweyn', 'Badhan', 'Las Qoray'],
      },
      { name: 'Sool', cities: ['Las Anod', 'Aynabo', 'Taleh', 'Hudun'] },
      { name: 'Awdal', cities: ['Borama', 'Zeila', 'Lughaya', 'Baki'] },
    ],
  },
  {
    name: 'Somalia',
    regions: [
      { name: 'Banaadir', cities: ['Mogadishu', 'Afgooye'] },
      { name: 'Bari', cities: ['Bosaso', 'Qardho', 'Iskushuban'] },
      { name: 'Nugaal', cities: ['Garowe', 'Eyl'] },
      { name: 'Mudug', cities: ['Galkayo', 'Hobyo', 'Galdogob'] },
      { name: 'Galguduud', cities: ['Dhusamareb', 'Abudwak', 'Adado'] },
      { name: 'Hiiraan', cities: ['Beledweyne', 'Buulobarde'] },
      { name: 'Shabeellaha Dhexe', cities: ['Jowhar', 'Balcad'] },
      { name: 'Shabeellaha Hoose', cities: ['Marka', 'Afgooye', 'Qoryooley'] },
      { name: 'Bay', cities: ['Baidoa', 'Diinsoor'] },
      { name: 'Bakool', cities: ['Xudur', 'Tieglow'] },
      { name: 'Gedo', cities: ['Garbahaarey', 'Luuq', 'Beled Xaawo'] },
      { name: 'Jubbada Dhexe', cities: ["Bu'aale", 'Jilib'] },
      { name: 'Jubbada Hoose', cities: ['Kismayo', 'Afmadow'] },
    ],
  },
  {
    name: 'Ethiopia',
    regions: [
      {
        name: 'Somali Region',
        cities: ['Jigjiga', 'Gode', 'Kebri Dahar', 'Degehabur'],
      },
      { name: 'Addis Ababa', cities: ['Addis Ababa'] },
      { name: 'Oromia', cities: ['Adama', 'Jimma', 'Harar'] },
      { name: 'Dire Dawa', cities: ['Dire Dawa'] },
      { name: 'Afar', cities: ['Semera'] },
    ],
  },
  {
    name: 'Kenya',
    regions: [
      { name: 'Nairobi', cities: ['Nairobi'] },
      { name: 'North Eastern', cities: ['Garissa', 'Wajir', 'Mandera'] },
      { name: 'Coast', cities: ['Mombasa', 'Malindi'] },
      { name: 'Eastern', cities: ['Isiolo', 'Meru', 'Embu'] },
      { name: 'Rift Valley', cities: ['Nakuru', 'Eldoret'] },
    ],
  },
  {
    name: 'Djibouti',
    regions: [
      {
        name: 'Djibouti',
        cities: ['Djibouti City', 'Ali Sabieh', 'Tadjourah', 'Obock'],
      },
    ],
  },
  {
    name: 'Uganda',
    regions: [
      { name: 'Central', cities: ['Kampala', 'Entebbe'] },
      { name: 'Eastern', cities: ['Jinja', 'Mbale'] },
      { name: 'Northern', cities: ['Gulu', 'Lira'] },
      { name: 'Western', cities: ['Mbarara', 'Fort Portal'] },
    ],
  },
  {
    name: 'Tanzania',
    regions: [
      { name: 'Dar es Salaam', cities: ['Dar es Salaam'] },
      { name: 'Arusha', cities: ['Arusha'] },
      { name: 'Dodoma', cities: ['Dodoma'] },
      { name: 'Zanzibar', cities: ['Zanzibar City', 'Stone Town'] },
    ],
  },
  {
    name: 'Rwanda',
    regions: [
      { name: 'Kigali', cities: ['Kigali'] },
      { name: 'Northern', cities: ['Musanze'] },
      { name: 'Eastern', cities: ['Rwamagana'] },
      { name: 'Southern', cities: ['Huye'] },
      { name: 'Western', cities: ['Rubavu'] },
    ],
  },
  {
    name: 'Burundi',
    regions: [
      { name: 'Bujumbura', cities: ['Bujumbura'] },
      { name: 'Gitega', cities: ['Gitega'] },
    ],
  },
  {
    name: 'South Sudan',
    regions: [
      { name: 'Central Equatoria', cities: ['Juba'] },
      { name: 'Eastern Equatoria', cities: ['Torit'] },
      { name: 'Jonglei', cities: ['Bor'] },
    ],
  },
  {
    name: 'Eritrea',
    regions: [
      { name: 'Maekel', cities: ['Asmara'] },
      { name: 'Northern Red Sea', cities: ['Massawa'] },
    ],
  },
];

export const WORLD_COUNTRIES: string[] = [
  'Somaliland',
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Democratic Republic of the Congo',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Ivory Coast',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Palestine',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
];

const DETAIL_BY_NAME = new Map(
  EAST_AFRICA_DETAIL.map((c) => [c.name.toLowerCase(), c]),
);

export function countryNames() {
  return WORLD_COUNTRIES;
}

export function filterCountries(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return WORLD_COUNTRIES;
  return WORLD_COUNTRIES.filter((name) => name.toLowerCase().includes(q));
}

export function hasRegionData(country?: string | null) {
  return regionsForCountry(country).length > 0;
}

export function regionsForCountry(country?: string | null) {
  const found = DETAIL_BY_NAME.get(String(country || '').toLowerCase());
  return found?.regions.map((r) => r.name) || [];
}

export function citiesForRegion(
  country?: string | null,
  region?: string | null,
) {
  const found = DETAIL_BY_NAME.get(String(country || '').toLowerCase());
  const reg = found?.regions.find(
    (r) => r.name.toLowerCase() === String(region || '').toLowerCase(),
  );
  return reg?.cities || [];
}

export function withCurrentOption(options: string[], current?: string | null) {
  const value = String(current || '').trim();
  if (!value) return options;
  if (options.some((o) => o.toLowerCase() === value.toLowerCase())) {
    return options;
  }
  return [value, ...options];
}
