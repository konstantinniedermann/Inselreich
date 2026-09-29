import { startGame } from './ui/app';

const root = document.getElementById('app');
if (!root) throw new Error('#app fehlt');
startGame(root);
