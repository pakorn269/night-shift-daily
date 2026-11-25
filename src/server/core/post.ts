import { reddit } from '@devvit/web/server';

export const createPost = async () => {
  return await reddit.submitCustomPost({
    title: 'Night Shift Daily — Halcyon Desk Incident Queue',
  });
};
