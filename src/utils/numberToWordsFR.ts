/**
 * Convert numeric grades (e.g. 15.41, 14.57) into official French uppercase words
 * As seen on West African and French official academic report cards:
 * "QUINZE VIRGULE QUARANTE UN", "QUATORZE VIRGULE CINQUANTE SEPT", etc.
 */

const UNITS = [
  'ZERO', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF',
  'DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE'
];

const TENS: { [key: number]: string } = {
  10: 'DIX',
  20: 'VINGT',
  30: 'TRENTE',
  40: 'QUARANTE',
  50: 'CINQUANTE',
  60: 'SOIXANTE',
  70: 'SOIXANTE-DIX',
  80: 'QUATRE-VINGTS',
  90: 'QUATRE-VINGT-DIX'
};

function intToFrenchWords(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n <= 16) return UNITS[n];
  if (n < 20) return `DIX-${UNITS[n - 10]}`;
  
  if (n < 70) {
    const ten = Math.floor(n / 10) * 10;
    const unit = n % 10;
    if (unit === 0) return TENS[ten];
    if (unit === 1) return `${TENS[ten]} ET UN`;
    return `${TENS[ten]} ${UNITS[unit]}`;
  }
  
  if (n < 80) {
    const unit = n - 60;
    if (unit === 11) return 'SOIXANTE ET ONZE';
    return `SOIXANTE ${intToFrenchWords(unit)}`;
  }
  
  if (n < 100) {
    const unit = n - 80;
    if (unit === 0) return 'QUATRE-VINGTS';
    return `QUATRE-VINGT ${intToFrenchWords(unit)}`;
  }

  if (n === 100) return 'CENT';
  if (n < 200) return `CENT ${intToFrenchWords(n - 100)}`;
  
  return `${n}`;
}

export function formatGradeInFrenchWords(score: number): string {
  if (isNaN(score)) return 'ZERO VIRGULE ZERO';
  const rounded = Math.round(score * 100) / 100;
  const integerPart = Math.floor(rounded);
  const decimalPart = Math.round((rounded - integerPart) * 100);

  const intWords = intToFrenchWords(integerPart);
  
  if (decimalPart === 0) {
    return `${intWords} VIRGULE ZERO ZERO`;
  }
  
  const decWords = decimalPart < 10 
    ? `ZERO ${intToFrenchWords(decimalPart)}` 
    : intToFrenchWords(decimalPart);
    
  return `${intWords} VIRGULE ${decWords}`.toUpperCase();
}
