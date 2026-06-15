import { defineEventHandler } from 'h3';
import { manifest } from '../manifest';

export default defineEventHandler(() => {
  return manifest;
});
