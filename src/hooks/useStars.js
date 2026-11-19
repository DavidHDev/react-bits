import { useState } from 'react';
import { useSingleEffect } from 'react-haiku';
import { getStarsCount } from '../utils/utils';

const CACHE_KEY = 'github_stars_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const DEFAULT_STARS = 52300;

export const useStars = () => {
  const [stars, setStars] = useState(DEFAULT_STARS);

  useSingleEffect(() => {
    const fetchStars = async () => {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);

        if (cachedData) {
          const { count, timestamp } = JSON.parse(cachedData);
          const now = Date.now();

          if (now - timestamp < CACHE_DURATION && count && count !== 'NAN') {
            setStars(count);
            return;
          }
        }

        const count = await getStarsCount();

        // Only update if we got a valid count
        if (count && count !== 'NAN') {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              count,
              timestamp: Date.now()
            })
          );

          setStars(count);
        }
      } catch (error) {
        console.error('Error fetching stars:', error);

        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { count } = JSON.parse(cachedData);
          if (count && count !== 'NAN') {
            setStars(count);
          } else {
            setStars(DEFAULT_STARS);
          }
        } else {
          setStars(DEFAULT_STARS);
        }
      }
    };

    fetchStars();
  }, []);

  return stars;
};
