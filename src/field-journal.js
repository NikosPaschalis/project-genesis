import { discoveries } from './geography.js';

const sitesById = new Map(discoveries.map(site => [site.id, site]));
const parallels = [
  {
    ids: ['landing', 'dry-gauge'],
    question: 'The ring wore against the bank. The gauge was set to read the other way up. Who would have needed both?',
  },
  {
    ids: ['silt-gate', 'dry-gauge'],
    question: 'The lowest mark on the gauge sits beyond the bands on the gate. Were the two things measuring the same water?',
  },
  {
    ids: ['threshold', 'seam'],
    question: 'Three marks on the stone. Three pieces at the house. The mark that looks newest on one is absent from the other.',
  },
];

export function journalEvidence(recorded) {
  const entries = Array.from(recorded, id => sitesById.get(id)).filter(Boolean);
  const comparisons = parallels.filter(({ ids }) => ids.every(id => recorded.has(id)))
    .map(({ ids, question }) => ({ sites: ids.map(id => sitesById.get(id)), question }));
  return { entries, comparisons };
}
