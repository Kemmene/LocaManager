export interface CountryCode {
  country: string;
  code: string;
  dialCode: string;
  flag: string;
  placeholder: string;
}

export const COUNTRIES: CountryCode[] = [
  { country: 'Cameroun', code: 'CM', dialCode: '+237', flag: '🇨🇲', placeholder: '6 99 48 92 11' },
  { country: 'Côte d\'Ivoire', code: 'CI', dialCode: '+225', flag: '🇨🇮', placeholder: '07 88 12 34 56' },
  { country: 'Sénégal', code: 'SN', dialCode: '+221', flag: '🇸🇳', placeholder: '77 123 45 67' },
  { country: 'Gabon', code: 'GA', dialCode: '+241', flag: '🇬🇦', placeholder: '66 12 34 56' },
  { country: 'Congo-Brazzaville', code: 'CG', dialCode: '+242', flag: '🇨🇬', placeholder: '06 123 45 67' },
  { country: 'RD Congo', code: 'CD', dialCode: '+243', flag: '🇨🇩', placeholder: '81 234 5678' },
  { country: 'Tchad', code: 'TD', dialCode: '+235', flag: '🇹🇩', placeholder: '66 12 34 56' },
  { country: 'Guinée', code: 'GN', dialCode: '+224', flag: '🇬🇳', placeholder: '620 12 34 56' },
  { country: 'Mali', code: 'ML', dialCode: '+223', flag: '🇲🇱', placeholder: '70 12 34 56' },
  { country: 'Bénin', code: 'BJ', dialCode: '+229', flag: '🇧🇯', placeholder: '97 12 34 56' },
  { country: 'Togo', code: 'TG', dialCode: '+228', flag: '🇹🇬', placeholder: '90 12 34 56' },
  { country: 'Burkina Faso', code: 'BF', dialCode: '+226', flag: '🇧🇫', placeholder: '70 12 34 56' },
  { country: 'Niger', code: 'NE', dialCode: '+227', flag: '🇳🇪', placeholder: '90 12 34 56' },
  { country: 'Guinée Équatoriale', code: 'GQ', dialCode: '+240', flag: '🇬🇶', placeholder: '222 12 34 56' },
  { country: 'Centrafrique', code: 'CF', dialCode: '+236', flag: '🇨🇫', placeholder: '75 12 34 56' },
  { country: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬', placeholder: '802 123 4567' },
  { country: 'Ghana', code: 'GH', dialCode: '+233', flag: '🇬🇭', placeholder: '24 123 4567' },
  { country: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷', placeholder: '6 12 34 56 78' },
  { country: 'Belgique', code: 'BE', dialCode: '+32', flag: '🇧🇪', placeholder: '470 12 34 56' },
  { country: 'Suisse', code: 'CH', dialCode: '+41', flag: '🇨🇭', placeholder: '78 123 45 67' },
  { country: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦', placeholder: '514 123 4567' },
  { country: 'États-Unis', code: 'US', dialCode: '+1', flag: '🇺🇸', placeholder: '202 555 0123' },
  { country: 'Maroc', code: 'MA', dialCode: '+212', flag: '🇲🇦', placeholder: '6 12 34 56 78' },
  { country: 'Rwanda', code: 'RW', dialCode: '+250', flag: '🇷🇼', placeholder: '788 123 456' }
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Cameroun (+237)
