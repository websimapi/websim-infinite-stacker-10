import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { setupScene } from './setup.js';
import { UIManager } from './ui.js';
import { Game } from './game.js';
import { ReplayRecorder } from './replay.js';
import { CanvasUI } from './canvas-ui.js';
import { Leaderboard } from './leaderboard.js';

// Global state
let game, ui, replayRecorder, canvasUI, leaderboard;
let scene, world, camera, renderer, uiScene, uiCamera;
let currentPage = 1;

function init() {
    const {
        scene: s,
        world: w,
        camera: c,
        renderer: r,
        defaultMaterial: dm,
        uiScene: us,
        uiCamera: uc
    } = setupScene();
    scene = s;
    world = w;
    camera = c;
    renderer = r;
    uiScene = us;
    uiCamera = uc;

    ui = new UIManager();
    canvasUI = new CanvasUI(uiScene);
    leaderboard = new Leaderboard();

    const gameCallbacks = {
        onScoreUpdate: (score) => {
            ui.updateScore(score);
            canvasUI.updateScore(score);
        },
        onGameOver: (score) => {
            setTimeout(() => {
                replayRecorder?.stop();
            }, 3000);
            ui.showGameOver(score);
        }
    };

    game = new Game(scene, world, dm, camera, gameCallbacks);
    
    setupEventListeners();
    
    renderer.setAnimationLoop(animate);
    startGame();
    
    // Subscribe to leaderboard updates
    leaderboard.subscribe((data) => {
        if (!ui.leaderboardElement.classList.contains('hidden')) {
            ui.renderLeaderboard(data);
        }
    });
}

function startGame() {
    game.start();
    ui.hideGameOver();
    ui.showInstructions(true);
    canvasUI.updateScore(0);
    
    replayRecorder = new ReplayRecorder(renderer.domElement);
}

function restart() {
    replayRecorder?.stop();
    game.restart();
    startGame();
}

async function viewReplay() {
    ui.setReplayButtonState(true, 'Loading...');
    const blob = await replayRecorder.getReplayBlob();
    if (blob) {
        ui.showReplayViewer(blob);
    }
    ui.setReplayButtonState(false, 'Watch Replay');
}

async function submitScore() {
    ui.setSubmitScoreButtonState(true, 'Submitting...');
    
    const blob = await replayRecorder.getReplayBlob();
    if (!blob) {
        ui.showMessage('Error: No replay available', true);
        ui.setSubmitScoreButtonState(false, 'Submit Score');
        return;
    }
    
    const result = await leaderboard.submitScore(ui.currentScore, blob);
    ui.showMessage(result.message, !result.success);
    ui.setSubmitScoreButtonState(false, 'Submit Score');
}

function viewLeaderboard() {
    currentPage = 1;
    const data = leaderboard.getTopScores(currentPage);
    ui.showLeaderboard(data);
}

function changeLeaderboardPage(direction) {
    currentPage += direction;
    const data = leaderboard.getTopScores(currentPage);
    ui.renderLeaderboard(data);
}

function viewLeaderboardReplay(url) {
    ui.showReplayViewerFromUrl(url);
}

function setupEventListeners() {
    ui.setupEventListeners({
        onPointerDown: () => {
            if (game.getState() === 'playing') {
                ui.showInstructions(false);
                game.onPointerDown();
            }
        },
        onRestart: restart,
        onViewReplay: viewReplay,
        onSubmitScore: submitScore,
        onViewLeaderboard: viewLeaderboard,
        onLeaderboardPageChange: changeLeaderboardPage,
        onViewLeaderboardReplay: viewLeaderboardReplay,
        onWindowResize: () => {
            const aspect = window.innerWidth / window.innerHeight;
            const frustumSize = 4;
            camera.left = frustumSize * aspect / -2;
            camera.right = frustumSize * aspect / 2;
            camera.top = frustumSize / 2;
            camera.bottom = frustumSize / -2;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);

            uiCamera.left = -window.innerWidth / 2;
            uiCamera.right = window.innerWidth / 2;
            uiCamera.top = window.innerHeight / 2;
            uiCamera.bottom = -window.innerHeight / 2;
            uiCamera.updateProjectionMatrix();
            canvasUI.onWindowResize();
        }
    });
}

function animate() {
    world.step(1 / 60);
    game.update();
    
    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(uiScene, uiCamera);
}

init();