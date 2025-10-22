export class UIManager {
    constructor() {
        this.scoreElement = document.getElementById('score');
        this.instructionsElement = document.getElementById('instructions');
        this.gameOverElement = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');
        this.restartButton = document.getElementById('restart-button');
        this.replayButton = document.getElementById('replay-button');
        this.submitScoreButton = document.getElementById('submit-score-button');
        this.viewLeaderboardButton = document.getElementById('view-leaderboard-button');
        this.replayViewer = document.getElementById('replay-viewer');
        this.replayVideo = document.getElementById('replay-video');
        this.closeReplayButton = document.getElementById('close-replay');
        this.downloadReplayButton = document.getElementById('download-replay');
        this.replayControlsElement = document.getElementById('replay-controls');
        
        // Leaderboard elements
        this.leaderboardElement = document.getElementById('leaderboard');
        this.leaderboardList = document.getElementById('leaderboard-list');
        this.closeLeaderboardButton = document.getElementById('close-leaderboard');
        this.prevPageButton = document.getElementById('prev-page');
        this.nextPageButton = document.getElementById('next-page');
        this.pageInfo = document.getElementById('page-info');

        this.currentReplayBlob = null;
        this.currentScore = 0;
    }

    setupEventListeners({ onPointerDown, onRestart, onViewReplay, onWindowResize, onSubmitScore, onViewLeaderboard, onLeaderboardPageChange, onViewLeaderboardReplay }) {
        window.addEventListener('pointerdown', onPointerDown);
        this.restartButton.addEventListener('click', onRestart);
        this.replayButton.addEventListener('click', onViewReplay);
        this.submitScoreButton.addEventListener('click', onSubmitScore);
        this.viewLeaderboardButton.addEventListener('click', onViewLeaderboard);
        this.closeReplayButton.addEventListener('click', () => this.hideReplayViewer());
        this.downloadReplayButton.addEventListener('click', () => this.downloadReplay());
        this.closeLeaderboardButton.addEventListener('click', () => this.hideLeaderboard());
        this.prevPageButton.addEventListener('click', () => onLeaderboardPageChange(-1));
        this.nextPageButton.addEventListener('click', () => onLeaderboardPageChange(1));
        window.addEventListener('resize', onWindowResize, false);
        
        // Delegate click events for replay viewing in leaderboard
        this.leaderboardList.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-replay-btn')) {
                const replayUrl = e.target.dataset.replayUrl;
                onViewLeaderboardReplay(replayUrl);
            }
        });
    }

    updateScore(score) {
        this.currentScore = score;
        this.scoreElement.innerText = score;
    }

    showInstructions(visible) {
        if (visible) {
            this.instructionsElement.classList.remove('hidden');
        } else {
            this.instructionsElement.classList.add('hidden');
        }
    }

    showGameOver(score) {
        this.currentScore = score;
        this.finalScoreElement.innerText = score;
        this.gameOverElement.classList.remove('hidden');
        this.replayControlsElement.classList.remove('hidden');
    }

    hideGameOver() {
        this.gameOverElement.classList.add('hidden');
        this.replayControlsElement.classList.add('hidden');
        this.updateScore(0);
        this.showInstructions(true);
    }

    showReplayViewer(blob) {
        this.currentReplayBlob = blob;
        const url = URL.createObjectURL(blob);
        this.replayVideo.src = url;
        this.gameOverElement.classList.add('hidden');
        this.leaderboardElement.classList.add('hidden');
        this.replayViewer.classList.remove('hidden');
    }

    showReplayViewerFromUrl(url) {
        this.replayVideo.src = url;
        this.gameOverElement.classList.add('hidden');
        this.leaderboardElement.classList.add('hidden');
        this.replayViewer.classList.remove('hidden');
        this.downloadReplayButton.style.display = 'none';
    }

    hideReplayViewer() {
        this.replayViewer.classList.add('hidden');
        if (this.leaderboardElement.classList.contains('hidden')) {
            this.gameOverElement.classList.remove('hidden');
        } else {
            this.leaderboardElement.classList.remove('hidden');
        }
        this.downloadReplayButton.style.display = 'block';
        if (this.replayVideo.src && !this.replayVideo.src.startsWith('http')) {
            URL.revokeObjectURL(this.replayVideo.src);
        }
        this.replayVideo.src = '';
    }
    
    downloadReplay() {
        if (!this.currentReplayBlob) return;
        
        const url = URL.createObjectURL(this.currentReplayBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stacker-replay-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    setReplayButtonState(disabled, text) {
        this.replayButton.disabled = disabled;
        this.replayButton.textContent = text;
    }

    setSubmitScoreButtonState(disabled, text) {
        this.submitScoreButton.disabled = disabled;
        this.submitScoreButton.textContent = text;
    }

    showLeaderboard(data) {
        this.gameOverElement.classList.add('hidden');
        this.leaderboardElement.classList.remove('hidden');
        this.renderLeaderboard(data);
    }

    hideLeaderboard() {
        this.leaderboardElement.classList.add('hidden');
        this.gameOverElement.classList.remove('hidden');
    }

    renderLeaderboard(data) {
        const { scores, totalPages, currentPage } = data;
        
        this.leaderboardList.innerHTML = '';
        
        if (scores.length === 0) {
            this.leaderboardList.innerHTML = '<p style="text-align: center; padding: 20px;">No scores yet!</p>';
        } else {
            scores.forEach((scoreData, index) => {
                const rank = (currentPage - 1) * 10 + index + 1;
                const entry = document.createElement('div');
                entry.className = 'leaderboard-entry';
                entry.innerHTML = `
                    <div class="rank">${rank}</div>
                    <img src="https://images.websim.com/avatar/${scoreData.username}" alt="${scoreData.username}" class="avatar">
                    <div class="player-info">
                        <div class="username">${scoreData.username}</div>
                    </div>
                    <div class="score-value">${scoreData.score}</div>
                    <button class="view-replay-btn" data-replay-url="${scoreData.replay_url}">▶</button>
                `;
                this.leaderboardList.appendChild(entry);
            });
        }
        
        this.pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
        this.prevPageButton.disabled = currentPage === 1;
        this.nextPageButton.disabled = currentPage >= totalPages;
    }

    showMessage(message, isError = false) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message-toast';
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${isError ? '#f44336' : '#4CAF50'};
            color: white;
            padding: 15px 30px;
            border-radius: 5px;
            z-index: 10000;
            animation: slideDown 0.3s ease;
        `;
        messageEl.textContent = message;
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => messageEl.remove(), 300);
        }, 3000);
    }
}