function initAudioPlayer() {
    const audio = document.getElementById('post-audio');
    if (!audio) return;

    const player = audio.closest('.audio-player');
    const playButton = player.querySelector('.play-button');
    const progressBar = player.querySelector('.progress-bar');
    const progressIndicator = progressBar.querySelector('.progress-indicator');
    const currentTimeDisplay = player.querySelector('.current-time');
    const durationDisplay = player.querySelector('.duration');
    const speedButton = player.querySelector('.speed-button');

    const speeds = [1, 1.25, 1.5, 1.75, 2];
    let currentSpeedIndex = 0;

    // Show duration immediately if metadata already loaded (cached audio)
    if (audio.readyState >= 1 && isFinite(audio.duration)) {
        durationDisplay.textContent = formatTime(audio.duration);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function setPlayerState(state) {
        player.dataset.state = state;
    }

    function togglePlay() {
        if (audio.paused) {
            setPlayerState('loading');
            audio.play().then(() => {
                setPlayerState('playing');
            }).catch(() => {
                setPlayerState('error');
            });
        } else {
            audio.pause();
            setPlayerState('paused');
        }
    }

    function cyclePlaybackSpeed() {
        currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
        audio.playbackRate = speeds[currentSpeedIndex];
        speedButton.textContent = speeds[currentSpeedIndex] + 'x';
    }

    // Event listeners — buttons
    playButton.addEventListener('click', togglePlay);
    speedButton.addEventListener('click', cyclePlaybackSpeed);

    // Keyboard: Space/Enter on play button
    playButton.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            togglePlay();
        }
    });

    // Event listeners — audio element
    audio.addEventListener('loadedmetadata', () => {
        if (isFinite(audio.duration)) {
            durationDisplay.textContent = formatTime(audio.duration);
        }
    });

    audio.addEventListener('durationchange', () => {
        if (isFinite(audio.duration)) {
            durationDisplay.textContent = formatTime(audio.duration);
        }
    });

    audio.addEventListener('timeupdate', () => {
        if (!isFinite(audio.duration)) return;
        const progress = (audio.currentTime / audio.duration) * 100;
        progressIndicator.style.width = progress + '%';
        currentTimeDisplay.textContent = formatTime(audio.currentTime);
    });

    audio.addEventListener('playing', () => {
        setPlayerState('playing');
    });

    audio.addEventListener('waiting', () => {
        setPlayerState('loading');
    });

    audio.addEventListener('ended', () => {
        setPlayerState('paused');
        progressIndicator.style.width = '0%';
        currentTimeDisplay.textContent = '0:00';
        audio.currentTime = 0;
    });

    audio.addEventListener('error', () => {
        setPlayerState('error');
    });

    // Progress bar — click/drag to seek
    function seek(e) {
        if (!isFinite(audio.duration)) return;
        const rect = progressBar.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audio.currentTime = pos * audio.duration;
    }

    progressBar.addEventListener('click', seek);

    // Drag support
    let dragging = false;
    progressBar.addEventListener('pointerdown', (e) => {
        dragging = true;
        progressBar.setPointerCapture(e.pointerId);
        seek(e);
    });
    progressBar.addEventListener('pointermove', (e) => {
        if (dragging) seek(e);
    });
    progressBar.addEventListener('pointerup', () => {
        dragging = false;
    });
}

document.addEventListener('DOMContentLoaded', initAudioPlayer);
