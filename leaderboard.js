import WebsimSocket from 'websim-socket';

export class Leaderboard {
    constructor() {
        this.room = new WebsimSocket();
        this.currentPage = 1;
        this.scoresPerPage = 10;
    }

    async submitScore(score, replayBlob) {
        try {
            // Upload replay video
            const replayUrl = await window.websim.upload(replayBlob);

            // Get current user
            const currentUser = await window.websim.getCurrentUser();

            // Get user's existing scores
            const userScores = this.room.collection('score')
                .filter({ username: currentUser.username })
                .getList()
                .sort((a, b) => b.score - a.score);

            if (userScores.length >= 3) {
                // Find lowest score
                const lowestScore = userScores[userScores.length - 1];

                // Only replace if new score is higher
                if (score > lowestScore.score) {
                    await this.room.collection('score').update(lowestScore.id, {
                        score: score,
                        replay_url: replayUrl
                    });
                    return { success: true, message: 'Score updated!' };
                } else {
                    return { success: false, message: 'Score too low to replace existing scores' };
                }
            } else {
                // Create new score
                await this.room.collection('score').create({
                    score: score,
                    replay_url: replayUrl
                });
                return { success: true, message: 'Score submitted!' };
            }
        } catch (error) {
            console.error('Error submitting score:', error);
            return { success: false, message: 'Error submitting score' };
        }
    }

    getTopScores(page = 1) {
        const allScores = this.room.collection('score').getList();

        // Sort by score descending
        const sortedScores = allScores.sort((a, b) => b.score - a.score);

        // Paginate
        const startIndex = (page - 1) * this.scoresPerPage;
        const endIndex = startIndex + this.scoresPerPage;
        const pageScores = sortedScores.slice(startIndex, endIndex);

        return {
            scores: pageScores,
            totalPages: Math.ceil(sortedScores.length / this.scoresPerPage),
            currentPage: page
        };
    }

    subscribe(callback) {
        return this.room.collection('score').subscribe(() => {
            callback(this.getTopScores(this.currentPage));
        });
    }
}