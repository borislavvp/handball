const POSITIVE_TEXT_COLOR = '#166534'; // dark green
const NEGATIVE_TEXT_COLOR = '#b91c1c'; // dark red

export function getScoreColor(score: number){
  let boxColor = '';
  let textColor = '';
  if (score === -1) {
    boxColor = '#e5e7eb'; // gray background
    textColor = '#6b7280'; // medium gray text
  } else if (score <= 30) {
    boxColor = '#fee2e2'; // soft red
    textColor = '#b91c1c'; // dark red
  } else if (score <= 60) {
    boxColor = '#fef3c7'; // soft yellow
    textColor = '#92400e'; // brownish orange
  } else if (score <= 80) {
    boxColor = '#dcfce7'; // soft green
    textColor = '#166534'; // dark green
  } else {
    boxColor = '#bbf7d0'; // mint green
    textColor = '#065f46'; // deep green
  } 
  return {boxColor,textColor};
}

export function getBinaryColor(value: boolean){
    if(value){
        return POSITIVE_TEXT_COLOR; // green
    } else {
        return NEGATIVE_TEXT_COLOR; // red
    }
}