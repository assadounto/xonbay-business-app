export type GhanaBusinessLocation = {
  name: string;
  region: string;
  district: string;
  latitude: number;
  longitude: number;
};

// Mirrors the location shape used by the mobile app. Keep this list local so
// business forms remain fast and usable without a third-party geocoding API.
export const GHANA_BUSINESS_LOCATIONS: GhanaBusinessLocation[] = [
  {
    name: 'Accra Central',
    region: 'Greater Accra',
    district: 'Accra Metropolitan',
    latitude: 5.6037,
    longitude: -0.187
  },
  {
    name: 'Osu',
    region: 'Greater Accra',
    district: 'Korle Klottey Municipal',
    latitude: 5.554,
    longitude: -0.188
  },
  {
    name: 'Labone',
    region: 'Greater Accra',
    district: 'La Dade-Kotopon Municipal',
    latitude: 5.566,
    longitude: -0.171
  },
  {
    name: 'Cantonments',
    region: 'Greater Accra',
    district: 'La Dade-Kotopon Municipal',
    latitude: 5.571,
    longitude: -0.1715
  },
  {
    name: 'Airport Residential Area',
    region: 'Greater Accra',
    district: 'Ayawaso West Municipal',
    latitude: 5.614,
    longitude: -0.174
  },
  {
    name: 'Dzorwulu',
    region: 'Greater Accra',
    district: 'Ayawaso West Municipal',
    latitude: 5.616,
    longitude: -0.214
  },
  {
    name: 'East Legon',
    region: 'Greater Accra',
    district: 'Ayawaso West Municipal',
    latitude: 5.631,
    longitude: -0.167
  },
  {
    name: 'West Legon',
    region: 'Greater Accra',
    district: 'Ayawaso West Municipal',
    latitude: 5.64,
    longitude: -0.206
  },
  {
    name: 'North Legon',
    region: 'Greater Accra',
    district: 'La Nkwantanang-Madina Municipal',
    latitude: 5.648,
    longitude: -0.174
  },
  {
    name: 'Madina',
    region: 'Greater Accra',
    district: 'La Nkwantanang-Madina Municipal',
    latitude: 5.674,
    longitude: -0.218
  },
  {
    name: 'Adenta',
    region: 'Greater Accra',
    district: 'Adenta Municipal',
    latitude: 5.677,
    longitude: -0.208
  },
  {
    name: 'Oyarifa',
    region: 'Greater Accra',
    district: 'La Nkwantanang-Madina Municipal',
    latitude: 5.707,
    longitude: -0.22
  },
  {
    name: 'Ashaley Botwe',
    region: 'Greater Accra',
    district: 'Adenta Municipal',
    latitude: 5.645,
    longitude: -0.152
  },
  {
    name: 'Oyibi',
    region: 'Greater Accra',
    district: 'Kpone-Katamanso Municipal',
    latitude: 5.758,
    longitude: -0.167
  },
  {
    name: 'Achimota',
    region: 'Greater Accra',
    district: 'Okaikwei North Municipal',
    latitude: 5.62,
    longitude: -0.219
  },
  {
    name: 'Tesano',
    region: 'Greater Accra',
    district: 'Okaikwei North Municipal',
    latitude: 5.611,
    longitude: -0.241
  },
  {
    name: 'Lapaz',
    region: 'Greater Accra',
    district: 'Okaikwei North Municipal',
    latitude: 5.614,
    longitude: -0.263
  },
  {
    name: 'Kaneshie',
    region: 'Greater Accra',
    district: 'Ablekuma Central Municipal',
    latitude: 5.588,
    longitude: -0.244
  },
  {
    name: 'Dansoman',
    region: 'Greater Accra',
    district: 'Ablekuma West Municipal',
    latitude: 5.556,
    longitude: -0.262
  },
  {
    name: 'La',
    region: 'Greater Accra',
    district: 'La Dade-Kotopon Municipal',
    latitude: 5.583,
    longitude: -0.166
  },
  {
    name: 'Teshie',
    region: 'Greater Accra',
    district: 'Ledzokuku Municipal',
    latitude: 5.588,
    longitude: -0.095
  },
  {
    name: 'Nungua',
    region: 'Greater Accra',
    district: 'Krowor Municipal',
    latitude: 5.601,
    longitude: -0.072
  },
  {
    name: 'Spintex',
    region: 'Greater Accra',
    district: 'Krowor Municipal',
    latitude: 5.621,
    longitude: -0.093
  },
  {
    name: 'Sakumono',
    region: 'Greater Accra',
    district: 'Tema West Municipal',
    latitude: 5.614,
    longitude: -0.057
  },
  {
    name: 'Tema Community 1',
    region: 'Greater Accra',
    district: 'Tema Metropolitan',
    latitude: 5.673,
    longitude: -0.017
  },
  {
    name: 'Tema Community 25',
    region: 'Greater Accra',
    district: 'Kpone-Katamanso Municipal',
    latitude: 5.745,
    longitude: 0.018
  },
  {
    name: 'Ashaiman',
    region: 'Greater Accra',
    district: 'Ashaiman Municipal',
    latitude: 5.699,
    longitude: -0.03
  },
  {
    name: 'Prampram',
    region: 'Greater Accra',
    district: 'Ningo-Prampram District',
    latitude: 5.717,
    longitude: 0.107
  },
  {
    name: 'Amasaman',
    region: 'Greater Accra',
    district: 'Ga West Municipal',
    latitude: 5.706,
    longitude: -0.309
  },
  {
    name: 'Pokuase',
    region: 'Greater Accra',
    district: 'Ga North Municipal',
    latitude: 5.681,
    longitude: -0.294
  },
  {
    name: 'Kwabenya',
    region: 'Greater Accra',
    district: 'Ga East Municipal',
    latitude: 5.671,
    longitude: -0.255
  },
  {
    name: 'Dome',
    region: 'Greater Accra',
    district: 'Ga East Municipal',
    latitude: 5.65,
    longitude: -0.238
  },
  {
    name: 'Weija',
    region: 'Greater Accra',
    district: 'Weija-Gbawe Municipal',
    latitude: 5.576,
    longitude: -0.355
  },
  {
    name: 'Gbawe',
    region: 'Greater Accra',
    district: 'Weija-Gbawe Municipal',
    latitude: 5.577,
    longitude: -0.338
  },
  {
    name: 'Kasoa',
    region: 'Central',
    district: 'Awutu Senya East Municipal',
    latitude: 5.5345,
    longitude: -0.4168
  },
  {
    name: 'Cape Coast',
    region: 'Central',
    district: 'Cape Coast Metropolitan',
    latitude: 5.1053,
    longitude: -1.2466
  },
  {
    name: 'Elmina',
    region: 'Central',
    district: 'Komenda-Edina-Eguafo-Abirem Municipal',
    latitude: 5.0847,
    longitude: -1.3509
  },
  {
    name: 'Winneba',
    region: 'Central',
    district: 'Effutu Municipal',
    latitude: 5.3511,
    longitude: -0.6231
  },
  {
    name: 'Swedru',
    region: 'Central',
    district: 'Agona West Municipal',
    latitude: 5.5371,
    longitude: -0.6998
  },
  {
    name: 'Kumasi Central',
    region: 'Ashanti',
    district: 'Kumasi Metropolitan',
    latitude: 6.69,
    longitude: -1.623
  },
  {
    name: 'Adum',
    region: 'Ashanti',
    district: 'Kumasi Metropolitan',
    latitude: 6.6885,
    longitude: -1.6244
  },
  {
    name: 'Bantama',
    region: 'Ashanti',
    district: 'Kumasi Metropolitan',
    latitude: 6.7047,
    longitude: -1.6364
  },
  {
    name: 'Asokwa',
    region: 'Ashanti',
    district: 'Asokwa Municipal',
    latitude: 6.6666,
    longitude: -1.6038
  },
  {
    name: 'Ahodwo',
    region: 'Ashanti',
    district: 'Kumasi Metropolitan',
    latitude: 6.6621,
    longitude: -1.6234
  },
  {
    name: 'Suame',
    region: 'Ashanti',
    district: 'Suame Municipal',
    latitude: 6.7311,
    longitude: -1.6327
  },
  {
    name: 'Ejisu',
    region: 'Ashanti',
    district: 'Ejisu Municipal',
    latitude: 6.716,
    longitude: -1.478
  },
  {
    name: 'Obuasi',
    region: 'Ashanti',
    district: 'Obuasi Municipal',
    latitude: 6.2023,
    longitude: -1.6679
  },
  {
    name: 'Konongo',
    region: 'Ashanti',
    district: 'Asante Akim Central Municipal',
    latitude: 6.6167,
    longitude: -1.2167
  },
  {
    name: 'Tamale Central',
    region: 'Northern',
    district: 'Tamale Metropolitan',
    latitude: 9.4075,
    longitude: -0.8533
  },
  {
    name: 'Sagnarigu',
    region: 'Northern',
    district: 'Sagnarigu Municipal',
    latitude: 9.4356,
    longitude: -0.8646
  },
  {
    name: 'Yendi',
    region: 'Northern',
    district: 'Yendi Municipal',
    latitude: 9.4427,
    longitude: -0.0099
  },
  {
    name: 'Takoradi',
    region: 'Western',
    district: 'Sekondi-Takoradi Metropolitan',
    latitude: 4.8845,
    longitude: -1.7554
  },
  {
    name: 'Sekondi',
    region: 'Western',
    district: 'Sekondi-Takoradi Metropolitan',
    latitude: 4.934,
    longitude: -1.7137
  },
  {
    name: 'Tarkwa',
    region: 'Western',
    district: 'Tarkwa-Nsuaem Municipal',
    latitude: 5.3005,
    longitude: -1.9958
  },
  {
    name: 'Ho',
    region: 'Volta',
    district: 'Ho Municipal',
    latitude: 6.6008,
    longitude: 0.4713
  },
  {
    name: 'Hohoe',
    region: 'Volta',
    district: 'Hohoe Municipal',
    latitude: 7.1518,
    longitude: 0.4736
  },
  {
    name: 'Keta',
    region: 'Volta',
    district: 'Keta Municipal',
    latitude: 5.9179,
    longitude: 0.9879
  },
  {
    name: 'Koforidua',
    region: 'Eastern',
    district: 'New Juaben South Municipal',
    latitude: 6.0941,
    longitude: -0.2591
  },
  {
    name: 'Akosombo',
    region: 'Eastern',
    district: 'Asuogyaman District',
    latitude: 6.2997,
    longitude: 0.0599
  },
  {
    name: 'Nkawkaw',
    region: 'Eastern',
    district: 'Kwahu West Municipal',
    latitude: 6.5512,
    longitude: -0.7662
  },
  {
    name: 'Sunyani',
    region: 'Bono',
    district: 'Sunyani Municipal',
    latitude: 7.3349,
    longitude: -2.3123
  },
  {
    name: 'Berekum',
    region: 'Bono',
    district: 'Berekum East Municipal',
    latitude: 7.4534,
    longitude: -2.584
  },
  {
    name: 'Techiman',
    region: 'Bono East',
    district: 'Techiman Municipal',
    latitude: 7.5909,
    longitude: -1.9343
  },
  {
    name: 'Wa',
    region: 'Upper West',
    district: 'Wa Municipal',
    latitude: 10.0601,
    longitude: -2.5099
  },
  {
    name: 'Bolgatanga',
    region: 'Upper East',
    district: 'Bolgatanga Municipal',
    latitude: 10.7856,
    longitude: -0.8514
  },
  {
    name: 'Navrongo',
    region: 'Upper East',
    district: 'Kassena-Nankana Municipal',
    latitude: 10.8956,
    longitude: -1.0921
  },
  {
    name: 'Goaso',
    region: 'Ahafo',
    district: 'Asunafo North Municipal',
    latitude: 6.8036,
    longitude: -2.5172
  },
  {
    name: 'Dambai',
    region: 'Oti',
    district: 'Krachi East Municipal',
    latitude: 8.0662,
    longitude: 0.1793
  },
  {
    name: 'Damongo',
    region: 'Savannah',
    district: 'West Gonja Municipal',
    latitude: 9.083,
    longitude: -1.8188
  },
  {
    name: 'Nalerigu',
    region: 'North East',
    district: 'East Mamprusi Municipal',
    latitude: 10.5272,
    longitude: -0.3698
  },
  {
    name: 'Sefwi Wiawso',
    region: 'Western North',
    district: 'Sefwi Wiawso Municipal',
    latitude: 6.205,
    longitude: -2.4894
  }
];
