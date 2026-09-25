// Only include real sponsors with imageUrl - placeholders are handled in display components
export const diamondSponsors = [
  {
    id: 1,
    name: 'shadcnblocks.com',
    imageUrl: '/assets/sponsors/shadcnblocks.svg',
    url: 'https://www.shadcnblocks.com/'
  }
];

export const platinumSponsors = [];

export const silverSponsors = [
  {
    id: 1,
    name: 'Shadcncraft',
    imageUrl: '/assets/sponsors/shadcncraft.svg',
    url: 'https://shadcncraft.com/'
  },
  {
    id: 2,
    name: 'shadcnuikit.com',
    imageUrl: '/assets/sponsors/shadcnuikit.svg',
    url: 'https://shadcnuikit.com/'
  },
  {
    id: 3,
    name: 'Shadcn Studio',
    imageUrl: '/assets/sponsors/shadcnstudio.svg',
    url: 'https://shadcnstudio.com/'
  }
];

export const hasSponsors = diamondSponsors.length > 0 || platinumSponsors.length > 0 || silverSponsors.length > 0;
export const hasDiamondSponsors = diamondSponsors.length > 0;
export const hasPlatinumSponsors = platinumSponsors.length > 0;
export const hasSilverSponsors = silverSponsors.length > 0;
