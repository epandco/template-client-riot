import { component } from 'riot';
import AppRoot from './app-root.riot';

document.addEventListener('DOMContentLoaded', () => {
  component(AppRoot)(document.querySelector('app-root') || document.body);
});