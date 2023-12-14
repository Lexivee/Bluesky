interface Language {
  code3: string
  code2: string
  name: string
}

export enum AppLanguage {
  en = 'en',
  hi = 'hi',
  ja = 'ja',
  ko = 'ko',
}

interface AppLanguageConfig {
  code2: AppLanguage
  name: string
}

export const APP_LANGUAGES: AppLanguageConfig[] = [
  {code2: AppLanguage.en, name: 'English'},
  {code2: AppLanguage.hi, name: 'हिंदी'},
  {code2: AppLanguage.ja, name: '日本語'},
  {code2: AppLanguage.ko, name: '한국어'},
]

export const LANGUAGES: Language[] = [
  {code3: 'aar', code2: 'aa', name: 'Afar'},
  {code3: 'abk', code2: 'ab', name: 'Abkhazian'},
  {code3: 'ace', code2: '', name: 'Achinese'},
  {code3: 'ach', code2: '', name: 'Acoli'},
  {code3: 'ada', code2: '', name: 'Adangme'},
  {code3: 'ady', code2: '', name: 'Adyghe; Adygei'},
  {code3: 'afa', code2: '', name: 'Afro-Asiatic languages'},
  {code3: 'afh', code2: '', name: 'Afrihili'},
  {code3: 'afr', code2: 'af', name: 'Afrikaans'},
  {code3: 'ain', code2: '', name: 'Ainu'},
  {code3: 'aka', code2: 'ak', name: 'Akan'},
  {code3: 'akk', code2: '', name: 'Akkadian'},
  {code3: 'alb', code2: 'sq', name: 'Albanian'},
  {code3: 'ale', code2: '', name: 'Aleut'},
  {code3: 'alg', code2: '', name: 'Algonquian languages'},
  {code3: 'alt', code2: '', name: 'Southern Altai'},
  {code3: 'amh', code2: 'am', name: 'Amharic'},
  {code3: 'ang', code2: '', name: 'English, Old (ca.450-1100)'},
  {code3: 'anp ', code2: 'Angika', name: 'Angika'},
  {code3: 'apa', code2: '', name: 'Apache languages'},
  {code3: 'ara', code2: 'ar', name: 'Arabic'},
  {
    code3: 'arc',
    code2: '',
    name: 'Official Aramaic (700-300 BCE); Imperial Aramaic (700-300 BCE)',
  },
  {code3: 'arg', code2: 'an', name: 'Aragonese'},
  {code3: 'arm', code2: 'hy', name: 'Armenian'},
  {code3: 'arn', code2: '', name: 'Mapudungun; Mapuche'},
  {code3: 'arp', code2: '', name: 'Arapaho'},
  {code3: 'art', code2: '', name: 'Artificial languages'},
  {code3: 'arw', code2: '', name: 'Arawak'},
  {code3: 'asm', code2: 'as', name: 'Assamese'},
  {code3: 'ast', code2: '', name: 'Asturian; Bable; Leonese; Asturleonese'},
  {code3: 'ath', code2: '', name: 'Athapascan languages'},
  {code3: 'aus', code2: '', name: 'Australian languages'},
  {code3: 'ava', code2: 'av', name: 'Avaric'},
  {code3: 'ave', code2: 'ae', name: 'Avestan'},
  {code3: 'awa', code2: '', name: 'Awadhi'},
  {code3: 'aym', code2: 'ay', name: 'Aymara'},
  {code3: 'aze', code2: 'az', name: 'Azerbaijani'},
  {code3: 'bad', code2: '', name: 'Banda languages'},
  {code3: 'bai', code2: '', name: 'Bamileke languages'},
  {code3: 'bak', code2: 'ba', name: 'Bashkir'},
  {code3: 'bal', code2: '', name: 'Baluchi'},
  {code3: 'bam', code2: 'bm', name: 'Bambara'},
  {code3: 'ban', code2: '', name: 'Balinese'},
  {code3: 'baq', code2: 'eu', name: 'Basque'},
  {code3: 'bas', code2: '', name: 'Basa'},
  {code3: 'bat', code2: '', name: 'Baltic languages'},
  {code3: 'bej', code2: '', name: 'Beja; Bedawiyet'},
  {code3: 'bel', code2: 'be', name: 'Belarusian'},
  {code3: 'bem', code2: '', name: 'Bemba'},
  {code3: 'ben', code2: 'bn', name: 'Bengali'},
  {code3: 'ber', code2: '', name: 'Berber languages'},
  {code3: 'bho', code2: '', name: 'Bhojpuri'},
  {code3: 'bih', code2: 'bh', name: 'Bihari languages'},
  {code3: 'bik', code2: '', name: 'Bikol'},
  {code3: 'bin', code2: '', name: 'Bini; Edo'},
  {code3: 'bis', code2: 'bi', name: 'Bislama'},
  {code3: 'bla', code2: '', name: 'Siksika'},
  {code3: 'bnt', code2: '', name: 'Bantu languages'},
  {code3: 'bod', code2: 'bo', name: 'Tibetan'},
  {code3: 'bos', code2: 'bs', name: 'Bosnian'},
  {code3: 'bra', code2: '', name: 'Braj'},
  {code3: 'bre', code2: 'br', name: 'Breton'},
  {code3: 'btk', code2: '', name: 'Batak languages'},
  {code3: 'bua', code2: '', name: 'Buriat'},
  {code3: 'bug', code2: '', name: 'Buginese'},
  {code3: 'bul', code2: 'bg', name: 'Bulgarian'},
  {code3: 'bur', code2: 'my', name: 'Burmese'},
  {code3: 'byn', code2: '', name: 'Blin; Bilin'},
  {code3: 'cad', code2: '', name: 'Caddo'},
  {code3: 'cai', code2: '', name: 'Central American Indian languages'},
  {code3: 'car', code2: '', name: 'Galibi Carib'},
  {code3: 'cat', code2: 'ca', name: 'Catalan; Valencian'},
  {code3: 'cau', code2: '', name: 'Caucasian languages'},
  {code3: 'ceb', code2: '', name: 'Cebuano'},
  {code3: 'cel', code2: '', name: 'Celtic languages'},
  {code3: 'ces', code2: 'cs', name: 'Czech'},
  {code3: 'cha', code2: 'ch', name: 'Chamorro'},
  {code3: 'chb', code2: '', name: 'Chibcha'},
  {code3: 'che', code2: 'ce', name: 'Chechen'},
  {code3: 'chg', code2: '', name: 'Chagatai'},
  {code3: 'chi', code2: 'zh', name: 'Chinese'},
  {code3: 'chk', code2: '', name: 'Chuukese'},
  {code3: 'chm', code2: '', name: 'Mari'},
  {code3: 'chn', code2: '', name: 'Chinook jargon'},
  {code3: 'cho', code2: '', name: 'Choctaw'},
  {code3: 'chp', code2: '', name: 'Chipewyan; Dene Suline'},
  {code3: 'chr', code2: '', name: 'Cherokee'},
  {
    code3: 'chu',
    code2: 'cu',
    name: 'Church Slavic; Old Slavonic; Church Slavonic; Old Bulgarian; Old Church Slavonic',
  },
  {code3: 'chv', code2: 'cv', name: 'Chuvash'},
  {code3: 'chy', code2: '', name: 'Cheyenne'},
  {code3: 'cmc', code2: '', name: 'Chamic languages'},
  {code3: 'cnr', code2: '', name: 'Montenegrin'},
  {code3: 'cop', code2: '', name: 'Coptic'},
  {code3: 'cor', code2: 'kw', name: 'Cornish'},
  {code3: 'cos', code2: 'co', name: 'Corsican'},
  {code3: 'cpe', code2: '', name: 'Creoles and pidgins, English based'},
  {code3: 'cpf', code2: '', name: 'Creoles and pidgins, French-based'},
  {code3: 'cpp', code2: '', name: 'Creoles and pidgins, Portuguese-based'},
  {code3: 'cre', code2: 'cr', name: 'Cree'},
  {code3: 'crh', code2: '', name: 'Crimean Tatar; Crimean Turkish'},
  {code3: 'crp', code2: '', name: 'Creoles and pidgins'},
  {code3: 'csb', code2: '', name: 'Kashubian'},
  {code3: 'cus', code2: '', name: 'Cushitic languages'},
  {code3: 'cym', code2: 'cy', name: 'Welsh'},
  {code3: 'cze', code2: 'cs', name: 'Czech'},
  {code3: 'dak', code2: '', name: 'Dakota'},
  {code3: 'dan', code2: 'da', name: 'Danish'},
  {code3: 'dar', code2: '', name: 'Dargwa'},
  {code3: 'day', code2: '', name: 'Land Dayak languages'},
  {code3: 'del', code2: '', name: 'Delaware'},
  {code3: 'den', code2: '', name: 'Slave (Athapascan)'},
  {code3: 'deu', code2: 'de', name: 'German'},
  {code3: 'dgr', code2: '', name: 'Dogrib'},
  {code3: 'din', code2: '', name: 'Dinka'},
  {code3: 'div', code2: 'dv', name: 'Divehi; Dhivehi; Maldivian'},
  {code3: 'doi', code2: '', name: 'Dogri'},
  {code3: 'dra', code2: '', name: 'Dravidian languages'},
  {code3: 'dsb', code2: '', name: 'Lower Sorbian'},
  {code3: 'dua', code2: '', name: 'Duala'},
  {code3: 'dum', code2: '', name: 'Dutch, Middle (ca.1050-1350)'},
  {code3: 'dut', code2: 'nl', name: 'Dutch; Flemish'},
  {code3: 'dyu', code2: '', name: 'Dyula'},
  {code3: 'dzo', code2: 'dz', name: 'Dzongkha'},
  {code3: 'efi', code2: '', name: 'Efik'},
  {code3: 'egy', code2: '', name: 'Egyptian (Ancient)'},
  {code3: 'eka', code2: '', name: 'Ekajuk'},
  {code3: 'ell', code2: 'el', name: 'Greek, Modern (1453-)'},
  {code3: 'elx', code2: '', name: 'Elamite'},
  {code3: 'eng', code2: 'en', name: 'English'},
  {code3: 'enm', code2: '', name: 'English, Middle (1100-1500)'},
  {code3: 'epo', code2: 'eo', name: 'Esperanto'},
  {code3: 'est', code2: 'et', name: 'Estonian'},
  {code3: 'eus', code2: 'eu', name: 'Basque'},
  {code3: 'ewe', code2: 'ee', name: 'Ewe'},
  {code3: 'ewo', code2: '', name: 'Ewondo'},
  {code3: 'fan', code2: '', name: 'Fang'},
  {code3: 'fao', code2: 'fo', name: 'Faroese'},
  {code3: 'fas', code2: 'fa', name: 'Persian'},
  {code3: 'fat', code2: '', name: 'Fanti'},
  {code3: 'fij', code2: 'fj', name: 'Fijian'},
  {code3: 'fil', code2: '', name: 'Filipino; Pilipino'},
  {code3: 'fin', code2: 'fi', name: 'Finnish'},
  {code3: 'fiu', code2: '', name: 'Finno-Ugrian languages'},
  {code3: 'fon', code2: '', name: 'Fon'},
  {code3: 'fra', code2: 'fr', name: 'French'},
  {code3: 'fre', code2: 'fr', name: 'French'},
  {code3: 'frm', code2: '', name: 'French, Middle (ca.1400-1600)'},
  {code3: 'fro', code2: '', name: 'French, Old (842-ca.1400)'},
  {code3: 'frr', code2: '', name: 'Northern Frisian'},
  {code3: 'frs', code2: '', name: 'Eastern Frisian'},
  {code3: 'fry', code2: 'fy', name: 'Western Frisian'},
  {code3: 'ful', code2: 'ff', name: 'Fulah'},
  {code3: 'fur', code2: '', name: 'Friulian'},
  {code3: 'gaa', code2: '', name: 'Ga'},
  {code3: 'gay', code2: '', name: 'Gayo'},
  {code3: 'gba', code2: '', name: 'Gbaya'},
  {code3: 'gem', code2: '', name: 'Germanic languages'},
  {code3: 'geo', code2: 'ka', name: 'Georgian'},
  {code3: 'ger', code2: 'de', name: 'German'},
  {code3: 'gez', code2: '', name: 'Geez'},
  {code3: 'gil', code2: '', name: 'Gilbertese'},
  {code3: 'gla', code2: 'gd', name: 'Gaelic; Scottish Gaelic'},
  {code3: 'gle', code2: 'ga', name: 'Irish'},
  {code3: 'glg', code2: 'gl', name: 'Galician'},
  {code3: 'glv', code2: 'gv', name: 'Manx'},
  {code3: 'gmh', code2: '', name: 'German, Middle High (ca.1050-1500)'},
  {code3: 'goh', code2: '', name: 'German, Old High (ca.750-1050)'},
  {code3: 'gon', code2: '', name: 'Gondi'},
  {code3: 'gor', code2: '', name: 'Gorontalo'},
  {code3: 'got', code2: '', name: 'Gothic'},
  {code3: 'grb', code2: '', name: 'Grebo'},
  {code3: 'grc', code2: '', name: 'Greek, Ancient (to 1453)'},
  {code3: 'gre', code2: 'el', name: 'Greek, Modern (1453-)'},
  {code3: 'grn', code2: 'gn', name: 'Guarani'},
  {code3: 'gsw', code2: '', name: 'Swiss German; Alemannic; Alsatian'},
  {code3: 'gujgu', code2: 'Gujarati', name: 'goudjrati'},
  {code3: 'gwi', code2: '', name: "Gwich'in"},
  {code3: 'hai', code2: '', name: 'Haida'},
  {code3: 'hat', code2: 'ht', name: 'Haitian; Haitian Creole'},
  {code3: 'hau', code2: 'ha', name: 'Hausa'},
  {code3: 'haw', code2: '', name: 'Hawaiian'},
  {code3: 'heb', code2: 'he', name: 'Hebrew'},
  {code3: 'her', code2: 'hz', name: 'Herero'},
  {code3: 'hil', code2: '', name: 'Hiligaynon'},
  {
    code3: 'him',
    code2: '',
    name: 'Himachali languages; Western Pahari languages',
  },
  {code3: 'hin', code2: 'hi', name: 'Hindi'},
  {code3: 'hit', code2: '', name: 'Hittite'},
  {code3: 'hmn', code2: '', name: 'Hmong; Mong'},
  {code3: 'hmo', code2: 'ho', name: 'Hiri Motu'},
  {code3: 'hrv', code2: 'hr', name: 'Croatian'},
  {code3: 'hsb', code2: '', name: 'Upper Sorbian'},
  {code3: 'hun', code2: 'hu', name: 'Hungarian'},
  {code3: 'hup', code2: '', name: 'Hupa'},
  {code3: 'hye', code2: 'hy', name: 'Armenian'},
  {code3: 'iba', code2: '', name: 'Iban'},
  {code3: 'ibo', code2: 'ig', name: 'Igbo'},
  {code3: 'ice', code2: 'is', name: 'Icelandic'},
  {code3: 'ido', code2: 'io', name: 'Ido'},
  {code3: 'iii', code2: 'ii', name: 'Sichuan Yi; Nuosu'},
  {code3: 'ijo', code2: '', name: 'Ijo languages'},
  {code3: 'iku', code2: 'iu', name: 'Inuktitut'},
  {code3: 'ile', code2: 'ie', name: 'Interlingue; Occidental'},
  {code3: 'ilo', code2: '', name: 'Iloko'},
  {
    code3: 'ina',
    code2: 'ia',
    name: 'Interlingua (International Auxiliary Language Association)',
  },
  {code3: 'inc', code2: '', name: 'Indic languages'},
  {code3: 'ind', code2: 'id', name: 'Indonesian'},
  {code3: 'ine', code2: '', name: 'Indo-European languages'},
  {code3: 'inh', code2: '', name: 'Ingush'},
  {code3: 'ipk', code2: 'ik', name: 'Inupiaq'},
  {code3: 'ira', code2: '', name: 'Iranian languages'},
  {code3: 'iro', code2: '', name: 'Iroquoian languages'},
  {code3: 'isl', code2: 'is', name: 'Icelandic'},
  {code3: 'ita', code2: 'it', name: 'Italian'},
  {code3: 'jav', code2: 'jv', name: 'Javanese'},
  {code3: 'jbo', code2: '', name: 'Lojban'},
  {code3: 'jpn', code2: 'ja', name: 'Japanese'},
  {code3: 'jpr', code2: '', name: 'Judeo-Persian'},
  {code3: 'jrb', code2: '', name: 'Judeo-Arabic'},
  {code3: 'kaa', code2: '', name: 'Kara-Kalpak'},
  {code3: 'kab', code2: '', name: 'Kabyle'},
  {code3: 'kac', code2: '', name: 'Kachin; Jingpho'},
  {code3: 'kal', code2: 'kl', name: 'Kalaallisut; Greenlandic'},
  {code3: 'kam', code2: '', name: 'Kamba'},
  {code3: 'kan', code2: 'kn', name: 'Kannada'},
  {code3: 'kar', code2: '', name: 'Karen languages'},
  {code3: 'kas', code2: 'ks', name: 'Kashmiri'},
  {code3: 'kat', code2: 'ka', name: 'Georgian'},
  {code3: 'kau', code2: 'kr', name: 'Kanuri'},
  {code3: 'kaw', code2: '', name: 'Kawi'},
  {code3: 'kaz', code2: 'kk', name: 'Kazakh'},
  {code3: 'kbd', code2: '', name: 'Kabardian'},
  {code3: 'kha', code2: '', name: 'Khasi'},
  {code3: 'khi', code2: '', name: 'Khoisan languages'},
  {code3: 'khm', code2: 'km', name: 'Central Khmer'},
  {code3: 'kho', code2: '', name: 'Khotanese; Sakan'},
  {code3: 'kik', code2: 'ki', name: 'Kikuyu; Gikuyu'},
  {code3: 'kin', code2: 'rw', name: 'Kinyarwanda'},
  {code3: 'kir', code2: 'ky', name: 'Kirghiz; Kyrgyz'},
  {code3: 'kmb', code2: '', name: 'Kimbundu'},
  {code3: 'kok', code2: '', name: 'Konkani'},
  {code3: 'kom', code2: 'kv', name: 'Komi'},
  {code3: 'kon', code2: 'kg', name: 'Kongo'},
  {code3: 'kor', code2: 'ko', name: 'Korean'},
  {code3: 'kos', code2: '', name: 'Kosraean'},
  {code3: 'kpe', code2: '', name: 'Kpelle'},
  {code3: 'krc', code2: '', name: 'Karachay-Balkar'},
  {code3: 'krl', code2: '', name: 'Karelian'},
  {code3: 'kro', code2: '', name: 'Kru languages'},
  {code3: 'kru', code2: '', name: 'Kurukh'},
  {code3: 'kua', code2: 'kj', name: 'Kuanyama; Kwanyama'},
  {code3: 'kum', code2: '', name: 'Kumyk'},
  {code3: 'kur', code2: 'ku', name: 'Kurdish'},
  {code3: 'kut', code2: '', name: 'Kutenai'},
  {code3: 'lad', code2: '', name: 'Ladino'},
  {code3: 'lah', code2: '', name: 'Lahnda'},
  {code3: 'lam', code2: '', name: 'Lamba'},
  {code3: 'lao', code2: 'lo', name: 'Lao'},
  {code3: 'lat', code2: 'la', name: 'Latin'},
  {code3: 'lav', code2: 'lv', name: 'Latvian'},
  {code3: 'lez', code2: '', name: 'Lezghian'},
  {code3: 'lim', code2: 'li', name: 'Limburgan; Limburger; Limburgish'},
  {code3: 'lin', code2: 'ln', name: 'Lingala'},
  {code3: 'lit', code2: 'lt', name: 'Lithuanian'},
  {code3: 'lol', code2: '', name: 'Mongo'},
  {code3: 'loz', code2: '', name: 'Lozi'},
  {code3: 'ltz', code2: 'lb', name: 'Luxembourgish; Letzeburgesch'},
  {code3: 'lua', code2: '', name: 'Luba-Lulua'},
  {code3: 'lub', code2: 'lu', name: 'Luba-Katanga'},
  {code3: 'lug', code2: 'lg', name: 'Ganda'},
  {code3: 'lui', code2: '', name: 'Luiseno'},
  {code3: 'lun', code2: '', name: 'Lunda'},
  {
    code3: 'luo',
    code2: ' Luo (Kenya and Tanzania)',
    name: 'luo (Kenya et Tanzanie)',
  },
  {code3: 'lus', code2: '', name: 'Lushai'},
  {code3: 'mac', code2: 'mk', name: 'Macedonian'},
  {code3: 'mad', code2: '', name: 'Madurese'},
  {code3: 'mag', code2: '', name: 'Magahi'},
  {code3: 'mah', code2: 'mh', name: 'Marshallese'},
  {code3: 'mai', code2: '', name: 'Maithili'},
  {code3: 'mak', code2: '', name: 'Makasar'},
  {code3: 'mal', code2: 'ml', name: 'Malayalam'},
  {code3: 'man', code2: '', name: 'Mandingo'},
  {code3: 'mao', code2: 'mi', name: 'Maori'},
  {code3: 'map', code2: '', name: 'Austronesian languages'},
  {code3: 'mar', code2: 'mr', name: 'Marathi'},
  {code3: 'mas', code2: '', name: 'Masai'},
  {code3: 'may', code2: 'ms', name: 'Malay'},
  {code3: 'mdf', code2: '', name: 'Moksha'},
  {code3: 'mdr', code2: '', name: 'Mandar'},
  {code3: 'men', code2: '', name: 'Mende'},
  {code3: 'mga', code2: '', name: 'Irish, Middle (900-1200)'},
  {code3: 'mic', code2: '', name: "Mi'kmaq; Micmac"},
  {code3: 'min', code2: '', name: 'Minangkabau'},
  {code3: 'mis', code2: '', name: 'Uncoded languages'},
  {code3: 'mkd', code2: 'mk', name: 'Macedonian'},
  {code3: 'mkh', code2: '', name: 'Mon-Khmer languages'},
  {code3: 'mlg', code2: 'mg', name: 'Malagasy'},
  {code3: 'mlt', code2: 'mt', name: 'Maltese'},
  {code3: 'mnc', code2: '', name: 'Manchu'},
  {code3: 'mni', code2: '', name: 'Manipuri'},
  {code3: 'mno', code2: '', name: 'Manobo languages'},
  {code3: 'moh', code2: '', name: 'Mohawk'},
  {code3: 'mon', code2: 'mn', name: 'Mongolian'},
  {code3: 'mos', code2: '', name: 'Mossi'},
  {code3: 'mri', code2: 'mi', name: 'Maori'},
  {code3: 'msa', code2: 'ms', name: 'Malay'},
  {code3: 'mul', code2: '', name: 'Multiple languages'},
  {code3: 'mun', code2: '', name: 'Munda languages'},
  {code3: 'mus', code2: '', name: 'Creek'},
  {code3: 'mwl', code2: '', name: 'Mirandese'},
  {code3: 'mwr', code2: '', name: 'Marwari'},
  {code3: 'mya', code2: 'my', name: 'Burmese'},
  {code3: 'myn', code2: '', name: 'Mayan languages'},
  {code3: 'myv', code2: '', name: 'Erzya'},
  {code3: 'nah', code2: '', name: 'Nahuatl languages'},
  {code3: 'nai', code2: '', name: 'North American Indian languages'},
  {code3: 'nap', code2: '', name: 'Neapolitan'},
  {code3: 'nau', code2: 'na', name: 'Nauru'},
  {code3: 'nav', code2: 'nv', name: 'Navajo; Navaho'},
  {code3: 'nbl', code2: 'nr', name: 'Ndebele, South; South Ndebele'},
  {code3: 'nde', code2: 'nd', name: 'Ndebele, North; North Ndebele'},
  {code3: 'ndo', code2: 'ng', name: 'Ndonga'},
  {
    code3: 'nds',
    code2: '',
    name: 'Low German; Low Saxon; German, Low; Saxon, Low',
  },
  {code3: 'nep', code2: 'ne', name: 'Nepali'},
  {code3: 'new', code2: '', name: 'Nepal Bhasa; Newari'},
  {code3: 'nia', code2: '', name: 'Nias'},
  {code3: 'nic', code2: '', name: 'Niger-Kordofanian languages'},
  {code3: 'niu', code2: '', name: 'Niuean'},
  {code3: 'nld', code2: 'nl', name: 'Dutch; Flemish'},
  {code3: 'nno', code2: 'nn', name: 'Norwegian Nynorsk; Nynorsk, Norwegian'},
  {code3: 'nob', code2: 'nb', name: 'Bokmål, Norwegian; Norwegian Bokmål'},
  {code3: 'nog', code2: '', name: 'Nogai'},
  {code3: 'non', code2: '', name: 'Norse, Old'},
  {code3: 'nor', code2: 'no', name: 'Norwegian'},
  {code3: 'nqo', code2: '', name: "N'Ko"},
  {code3: 'nso', code2: '', name: 'Pedi; Sepedi; Northern Sotho'},
  {code3: 'nub', code2: '', name: 'Nubian languages'},
  {
    code3: 'nwc',
    code2: '',
    name: 'Classical Newari; Old Newari; Classical Nepal Bhasa',
  },
  {code3: 'nya', code2: 'ny', name: 'Chichewa; Chewa; Nyanja'},
  {code3: 'nym', code2: '', name: 'Nyamwezi'},
  {code3: 'nyn', code2: '', name: 'Nyankole'},
  {code3: 'nyo', code2: '', name: 'Nyoro'},
  {code3: 'nzi', code2: '', name: 'Nzima'},
  {code3: 'oci', code2: 'oc', name: 'Occitan (post 1500)'},
  {code3: 'oji', code2: 'oj', name: 'Ojibwa'},
  {code3: 'ori', code2: 'or', name: 'Oriya'},
  {code3: 'orm', code2: 'om', name: 'Oromo'},
  {code3: 'osa', code2: '', name: 'Osage'},
  {code3: 'oss', code2: 'os', name: 'Ossetian; Ossetic'},
  {code3: 'ota', code2: '', name: 'Turkish, Ottoman (1500-1928)'},
  {code3: 'oto', code2: '', name: 'Otomian languages'},
  {code3: 'paa', code2: '', name: 'Papuan languages'},
  {code3: 'pag', code2: '', name: 'Pangasinan'},
  {code3: 'pal', code2: ' ', name: 'Pahlavi'},
  {code3: 'pam', code2: ' ', name: 'Pampanga; Kapampangan'},
  {code3: 'pan', code2: 'paPanjabi; Punjabi', name: 'pendjabi'},
  {code3: 'pap', code2: ' ', name: 'Papiamento'},
  {code3: 'pau', code2: ' ', name: 'Palauan'},
  {code3: 'peo', code2: ' ', name: 'Persian, Old (ca.600-400 B.C.)'},
  {code3: 'per', code2: 'fa', name: 'Persian'},
  {code3: 'phi', code2: ' ', name: 'Philippine languages'},
  {code3: 'phn', code2: ' ', name: 'Phoenician'},
  {code3: 'pli', code2: 'pi', name: 'Pali'},
  {code3: 'pol', code2: 'pl', name: 'Polish'},
  {code3: 'pon', code2: ' ', name: 'Pohnpeian'},
  {code3: 'por', code2: 'pt', name: 'Portuguese'},
  {code3: 'pra', code2: ' ', name: 'Prakrit languages'},
  {
    code3: 'pro',
    code2: ' ',
    name: 'Provençal, Old (to 1500);Occitan, Old (to 1500)',
  },
  {code3: 'pus', code2: 'ps', name: 'Pushto; Pashto'},
  {code3: 'que', code2: 'qu', name: 'Quechua'},
  {code3: 'raj', code2: ' ', name: 'Rajasthani'},
  {code3: 'rap', code2: ' ', name: 'Rapanui'},
  {code3: 'rar', code2: ' ', name: 'Rarotongan; Cook Islands Maori'},
  {code3: 'roa', code2: ' ', name: 'Romance languages'},
  {code3: 'roh', code2: 'rm', name: 'Romansh'},
  {code3: 'rom', code2: ' ', name: 'Romany'},
  {code3: 'rum', code2: 'ro', name: 'Romanian; Moldavian; Moldovan'},
  {code3: 'ron', code2: 'ro', name: 'Romanian; Moldavian; Moldovan'},
  {code3: 'run', code2: 'rn', name: 'Rundi'},
  {code3: 'rup', code2: ' ', name: 'Aromanian; Arumanian; Macedo-Romanian'},
  {code3: 'rus', code2: 'ru', name: 'Russian'},
  {code3: 'sad', code2: ' ', name: 'Sandawe'},
  {code3: 'sag', code2: 'sg', name: 'Sango'},
  {code3: 'sah', code2: ' ', name: 'Yakut'},
  {code3: 'sai', code2: ' ', name: 'South American Indian languages'},
  {code3: 'sal', code2: ' ', name: 'Salishan languages'},
  {code3: 'sam', code2: ' ', name: 'Samaritan Aramaic'},
  {code3: 'san', code2: 'sa', name: 'Sanskrit'},
  {code3: 'sas', code2: ' ', name: 'Sasak'},
  {code3: 'sat', code2: ' ', name: 'Santali'},
  {code3: 'scn', code2: ' ', name: 'Sicilian'},
  {code3: 'sco', code2: ' ', name: 'Scots'},
  {code3: 'sel', code2: ' ', name: 'Selkup'},
  {code3: 'sem', code2: ' ', name: 'Semitic languages'},
  {code3: 'sga', code2: ' ', name: 'Irish, Old (to 900)'},
  {code3: 'sgn', code2: ' ', name: 'Sign Languages'},
  {code3: 'shn', code2: ' ', name: 'Shan'},
  {code3: 'sid', code2: ' ', name: 'Sidamo'},
  {code3: 'sin', code2: 'si', name: 'Sinhala; Sinhalese'},
  {code3: 'sio', code2: ' ', name: 'Siouan languages'},
  {code3: 'sit', code2: ' ', name: 'Sino-Tibetan languages'},
  {code3: 'sla', code2: ' ', name: 'Slavic languages'},
  {code3: 'slo', code2: 'sk', name: 'Slovak'},
  {code3: 'slk', code2: 'sk', name: 'Slovak'},
  {code3: 'slv', code2: 'sl', name: 'Slovenian'},
  {code3: 'sma', code2: ' ', name: 'Southern Sami'},
  {code3: 'sme', code2: 'se', name: 'Northern Sami'},
  {code3: 'smi', code2: ' ', name: 'Sami languages'},
  {code3: 'smj', code2: ' ', name: 'Lule Sami'},
  {code3: 'smn', code2: ' ', name: 'Inari Sami'},
  {code3: 'smo', code2: 'sm', name: 'Samoan'},
  {code3: 'sms', code2: ' ', name: 'Skolt Sami'},
  {code3: 'sna', code2: 'sn', name: 'Shona'},
  {code3: 'snd', code2: 'sd', name: 'Sindhi'},
  {code3: 'snk', code2: ' ', name: 'Soninke'},
  {code3: 'sog', code2: ' ', name: 'Sogdian'},
  {code3: 'som', code2: 'so', name: 'Somali'},
  {code3: 'son', code2: ' ', name: 'Songhai languages'},
  {code3: 'sot', code2: 'st', name: 'Sotho, Southern'},
  {code3: 'spa', code2: 'es', name: 'Spanish'},
  {code3: 'sqi', code2: 'sq', name: 'Albanian'},
  {code3: 'srd', code2: 'sc', name: 'Sardinian'},
  {code3: 'srn', code2: ' ', name: 'Sranan Tongo'},
  {code3: 'srp', code2: 'sr', name: 'Serbian'},
  {code3: 'srr', code2: ' ', name: 'Serer'},
  {code3: 'ssa', code2: ' ', name: 'Nilo-Saharan languages'},
  {code3: 'ssw', code2: 'ss', name: 'Swati'},
  {code3: 'suk', code2: ' ', name: 'Sukuma'},
  {code3: 'sun', code2: 'su', name: 'Sundanese'},
  {code3: 'sus', code2: ' ', name: 'Susu'},
  {code3: 'sux', code2: ' ', name: 'Sumerian'},
  {code3: 'swa', code2: 'sw', name: 'Swahili'},
  {code3: 'swe', code2: 'sv', name: 'Swedish'},
  {code3: 'syc', code2: ' ', name: 'Classical Syriac'},
  {code3: 'syr', code2: ' ', name: 'Syriac'},
  {code3: 'tah', code2: 'ty', name: 'Tahitian'},
  {code3: 'tai', code2: ' ', name: 'Tai languages'},
  {code3: 'tam', code2: 'ta', name: 'Tamil'},
  {code3: 'tat', code2: 'tt', name: 'Tatar'},
  {code3: 'tel', code2: 'te', name: 'Telugu'},
  {code3: 'tem', code2: ' ', name: 'Timne'},
  {code3: 'ter', code2: ' ', name: 'Tereno'},
  {code3: 'tet', code2: ' ', name: 'Tetum'},
  {code3: 'tgk', code2: 'tg', name: 'Tajik'},
  {code3: 'tgl', code2: 'tl', name: 'Tagalog'},
  {code3: 'tha', code2: 'th', name: 'Thai'},
  {code3: 'tib', code2: 'bo', name: 'Tibetan'},
  {code3: 'tig', code2: ' ', name: 'Tigre'},
  {code3: 'tir', code2: 'ti', name: 'Tigrinya'},
  {code3: 'tiv', code2: ' ', name: 'Tiv'},
  {code3: 'tkl', code2: ' ', name: 'Tokelau'},
  {code3: 'tlh', code2: ' ', name: 'Klingon; tlhIngan-Hol'},
  {code3: 'tli', code2: ' ', name: 'Tlingit'},
  {code3: 'tmh', code2: ' ', name: 'Tamashek'},
  {code3: 'tog', code2: ' ', name: 'Tonga (Nyasa)'},
  {code3: 'ton', code2: 'to', name: 'Tonga (Tonga Islands)'},
  {code3: 'tpi', code2: ' ', name: 'Tok Pisin'},
  {code3: 'tsi', code2: ' ', name: 'Tsimshian'},
  {code3: 'tsn', code2: 'tn', name: 'Tswana'},
  {code3: 'tso', code2: 'ts', name: 'Tsonga'},
  {code3: 'tuk', code2: 'tk', name: 'Turkmen'},
  {code3: 'tum', code2: ' ', name: 'Tumbuka'},
  {code3: 'tup', code2: ' ', name: 'Tupi languages'},
  {code3: 'tur', code2: 'tr', name: 'Turkish'},
  {code3: 'tut', code2: ' ', name: 'Altaic languages'},
  {code3: 'tvl', code2: ' ', name: 'Tuvalu'},
  {code3: 'twi', code2: 'tw', name: 'Twi'},
  {code3: 'tyv', code2: ' ', name: 'Tuvinian'},
  {code3: 'udm', code2: ' ', name: 'Udmurt'},
  {code3: 'uga', code2: ' ', name: 'Ugaritic'},
  {code3: 'uig', code2: 'ug', name: 'Uighur; Uyghur'},
  {code3: 'ukr', code2: 'uk', name: 'Ukrainian'},
  {code3: 'umb', code2: ' ', name: 'Umbundu'},
  {code3: 'und', code2: ' ', name: 'Undetermined'},
  {code3: 'urd', code2: 'ur', name: 'Urdu'},
  {code3: 'uzb', code2: 'uz', name: 'Uzbek'},
  {code3: 'vai', code2: ' ', name: 'Vai'},
  {code3: 'ven', code2: 've', name: 'Venda'},
  {code3: 'vie', code2: 'vi', name: 'Vietnamese'},
  {code3: 'vol', code2: 'vo', name: 'Volapük'},
  {code3: 'vot', code2: ' ', name: 'Votic'},
  {code3: 'wak', code2: ' ', name: 'Wakashan languages'},
  {code3: 'wal', code2: ' ', name: 'Wolaitta; Wolaytta'},
  {code3: 'war', code2: ' ', name: 'Waray'},
  {code3: 'was', code2: ' ', name: 'Washo'},
  {code3: 'wel', code2: 'cy', name: 'Welsh'},
  {code3: 'wen', code2: ' ', name: 'Sorbian languages'},
  {code3: 'wln', code2: 'wa', name: 'Walloon'},
  {code3: 'wol', code2: 'wo', name: 'Wolof'},
  {code3: 'xal', code2: ' ', name: 'Kalmyk; Oirat'},
  {code3: 'xho', code2: 'xh', name: 'Xhosa'},
  {code3: 'yao', code2: ' ', name: 'Yao'},
  {code3: 'yap', code2: ' ', name: 'Yapese'},
  {code3: 'yid', code2: 'yi', name: 'Yiddish'},
  {code3: 'yor', code2: 'yo', name: 'Yoruba'},
  {code3: 'ypk', code2: ' ', name: 'Yupik languages'},
  {code3: 'zap', code2: ' ', name: 'Zapotec'},
  {code3: 'zbl', code2: ' ', name: 'Blissymbols; Blissymbolics; Bliss'},
  {code3: 'zen', code2: ' ', name: 'Zenaga'},
  {code3: 'zgh', code2: ' ', name: 'Standard Moroccan Tamazight'},
  {code3: 'zha', code2: 'za', name: 'Zhuang; Chuang'},
  {code3: 'zho', code2: 'zh', name: 'Chinese'},
  {code3: 'znd', code2: ' ', name: 'Zande languages'},
  {code3: 'zul', code2: 'zu', name: 'Zulu'},
  {code3: 'zun', code2: ' ', name: 'Zuni'},
  {
    code3: 'zza',
    code2: '',
    name: 'Zaza; Dimili; Dimli; Kirdki; Kirmanjki; Zazaki',
  },
]

export const LANGUAGES_MAP_CODE2 = Object.fromEntries(
  LANGUAGES.map(lang => [lang.code2, lang]),
)

export const LANGUAGES_MAP_CODE3 = Object.fromEntries(
  LANGUAGES.map(lang => [lang.code3, lang]),
)
// some additional manual mappings (not clear if these should be in the "official" mappings)
if (LANGUAGES_MAP_CODE2.fa) {
  LANGUAGES_MAP_CODE3.pes = LANGUAGES_MAP_CODE2.fa
}
