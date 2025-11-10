import { query } from '../_generated/server';

/**
 * Get all UK banks
 */
export const getBanks = query({
  args: {},
  handler: async (ctx) => {
    // Return common UK banks with their codes
    return [
      { code: '000004', name: 'HSBC' },
      { code: '000005', name: 'Barclays' },
      { code: '000006', name: 'Lloyds Bank' },
      { code: '000007', name: 'NatWest' },
      { code: '000008', name: 'Royal Bank of Scotland' },
      { code: '000009', name: 'Santander' },
      { code: '000010', name: 'Nationwide' },
      { code: '000011', name: 'TSB' },
      { code: '000012', name: 'Halifax' },
      { code: '000013', name: 'Bank of Scotland' },
      { code: '000014', name: 'First Direct' },
      { code: '000015', name: 'Metro Bank' },
      { code: '000016', name: 'Monzo' },
      { code: '000017', name: 'Starling Bank' },
      { code: '000018', name: 'Revolut' },
      { code: '000019', name: 'Chase' },
      { code: '000020', name: 'Co-operative Bank' },
    ];
  },
});

