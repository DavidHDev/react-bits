export const diamondSponsors = [
  {
    id: 1,
    name: 'shadcnblocks.com',
    imageUrl: '/assets/sponsors/shadcnblocks.svg',
    lightImageUrl: '/assets/sponsors/shadcnblocks-lightmode.svg',
    url: 'https://www.shadcnblocks.com/'
  },
  {
    id: 2,
    name: 'shaders.com',
    imageUrl: '/assets/sponsors/shaders.svg',
    lightImageUrl: '/assets/sponsors/shaders-lightmode.svg',
    url: 'https://shaders.com/'
  }
];

export const platinumSponsors = [];

export const silverSponsors = [
  {
    id: 1,
    name: 'shadcnuikit.com',
    imageUrl: '/assets/sponsors/shadcnuikit.svg',
    lightImageUrl: '/assets/sponsors/shadcnuikit-lightmode.svg',
    url: 'https://shadcnuikit.com/'
  },
  {
    id: 2,
    name: 'Shadcn Studio',
    imageUrl: '/assets/sponsors/shadcnstudio.svg',
    lightImageUrl: '/assets/sponsors/shadcnstudio-lightmode.svg',
    url: 'https://shadcnstudio.com/'
  }
];

export const hasSponsors = diamondSponsors.length > 0 || platinumSponsors.length > 0 || silverSponsors.length > 0;
export const hasDiamondSponsors = diamondSponsors.length > 0;
export const hasPlatinumSponsors = platinumSponsors.length > 0;
export const hasSilverSponsors = silverSponsors.length > 0;
