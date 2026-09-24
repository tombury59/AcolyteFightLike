import './style.css';
import { Game } from './game';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
if (!canvas) throw new Error('Canvas #game introuvable');

const game = new Game(canvas);
game.start();
