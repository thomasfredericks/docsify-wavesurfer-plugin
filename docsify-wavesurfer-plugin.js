(function () {
  function initWaveSurfer() {
    const supportedAudioExtensions = ['.m4a', '.mp3', '.wav', '.aac', '.wma', '.flac', '.opus', '.ogg'];

    handleAudioTags();
    handleAudioLinks();

    function handleAudioTags() {
      const audios = document.querySelectorAll('audio');
      audios.forEach(audio => {
        const audioSrc = audio.querySelector('source')?.src;
        if (audioSrc) {
          const container = document.createElement('div');
          audio.parentNode.replaceChild(container, audio);
          createWaveSurferPlayer(audioSrc, container);
        }
      });
    }

    function handleAudioLinks() {
      const links = document.querySelectorAll('a[href]');
      links.forEach(link => {
        const url = link.href.toLowerCase();
        if (supportedAudioExtensions.some(ext => url.endsWith(ext))) {
          const audioSrc = link.href.replace(/#\//, '');
          const description = link.innerText || link.textContent;
          const container = document.createElement('div');
          link.parentNode.replaceChild(container, link);
          createWaveSurferPlayer(audioSrc, container, description);
        }
      });
    }
  }

  function createWaveSurferPlayer(audioSrc, container, description = '') {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    container.appendChild(wrapper);

    const playPauseButton = createPlayPauseButton();

    let title;
    if (description) {
      title = document.createElement('div');
      title.innerText = description;
      title.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        font-weight: bold;
        background-color: rgba(255, 255, 255, 0.7);
        color: black;
        padding: 5px;
        cursor: pointer;
        z-index: 10;
        opacity: 0.9;
      `;
      title.onclick = playPauseButton.onclick;
      wrapper.appendChild(title);
    }

    const waveColor = getComputedStyle(document.documentElement).getPropertyValue('--wave-color').trim() || '#ababab';
    const progressColor = getComputedStyle(document.documentElement).getPropertyValue('--progress-color').trim() || '#dadada';

    const wavesurfer = WaveSurfer.create({
      container: wrapper,
      waveColor: waveColor,
      progressColor: progressColor,
      backend: 'MediaElement'
    });

    wavesurfer.load(audioSrc);
    playPauseButton.wavesurfer = wavesurfer;
    wavesurfer.on('play', () => {
      playPauseButton.style.backgroundColor = 'darkgrey';
      playPauseButton.innerHTML = '⏸️';
      if (title) {
        title.style.boxShadow = 'inset 0px 0px 5px #000000';
      }
    });
    wavesurfer.on('pause', () => {
      playPauseButton.style.backgroundColor = 'white';
      playPauseButton.innerHTML = '▶️';
      if (title) {
        title.style.boxShadow = '';
      }
    });

    const controlsContainer = createControlsContainer(wavesurfer, playPauseButton);
    wrapper.appendChild(controlsContainer);
    container.style.margin = '10px 0';
  }

  function createControlsContainer(wavesurfer, playPauseButton) {
    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 10px;
    `;

    const transportControls = createTransportControls(wavesurfer, playPauseButton);
    controlsContainer.appendChild(transportControls);

    const speedControlContainer = createSpeedControlContainer(wavesurfer);
    controlsContainer.appendChild(speedControlContainer);

    const volumeControlContainer = createVolumeControlContainer(wavesurfer);
    controlsContainer.appendChild(volumeControlContainer);

    controlsContainer.speedControlContainer = speedControlContainer;
    controlsContainer.volumeControlContainer = volumeControlContainer;

    return controlsContainer;
  }

  function createTransportControls(wavesurfer, playPauseButton) {
    const transportControls = document.createElement('div');
    transportControls.style.cssText = `
      display: flex;
      justify-content: center;
      margin-bottom: 10px;
    `;

    transportControls.appendChild(createGoToStartButton(wavesurfer));
    transportControls.appendChild(playPauseButton);
    transportControls.appendChild(createFastForwardButton(wavesurfer));
    transportControls.appendChild(createLoopButton(wavesurfer));
    transportControls.appendChild(createSpeedToggleButton());
    transportControls.appendChild(createVolumeToggleButton());

    return transportControls;
  }

  function createButton(icon) {
    const button = document.createElement('button');
    button.style.cssText = `
      margin: 0 5px;
      background: white;
      border: 1px solid black;
      border-radius: 4px;
      cursor: pointer;
      padding: 5px;
    `;
    button.innerHTML = icon;
    return button;
  }

  function createPlayPauseButton() {
    const playPauseBtn = createButton('▶️');
    playPauseBtn.onclick = () => {
      if (playPauseBtn.wavesurfer.isPlaying()) {
        playPauseBtn.wavesurfer.pause();
      } else {
        playPauseBtn.wavesurfer.play();
      }
    };
    return playPauseBtn;
  }

  function createLoopButton(wavesurfer) {
    const loopBtn = createButton('🔁');
    let isLooping = false;
    loopBtn.onclick = () => {
      isLooping = !isLooping;
      if (isLooping) {
        wavesurfer.on('finish', wavesurfer.play.bind(wavesurfer));
        loopBtn.style.backgroundColor = 'darkgrey';
      } else {
        wavesurfer.un('finish', wavesurfer.play.bind(wavesurfer));
        loopBtn.style.backgroundColor = '';
      }
    };
    return loopBtn;
  }

  function createFastForwardButton(wavesurfer) {
    const fastForwardBtn = createButton('⏩');
    let originalSpeed = 1;

    fastForwardBtn.onmousedown = () => {
      originalSpeed = wavesurfer.getPlaybackRate();
      wavesurfer.setPlaybackRate(originalSpeed * 10);
      fastForwardBtn.style.backgroundColor = 'darkgrey';
    };

    fastForwardBtn.onmouseup = () => {
      wavesurfer.setPlaybackRate(originalSpeed);
      fastForwardBtn.style.backgroundColor = '';
    };

    fastForwardBtn.onmouseleave = fastForwardBtn.onmouseup;

    return fastForwardBtn;
  }

  function createGoToStartButton(wavesurfer) {
    const goToStartBtn = createButton('⏮️');
    goToStartBtn.onclick = () => {
      wavesurfer.seekTo(0);
    };
    return goToStartBtn;
  }

  function createSpeedToggleButton() {
    const speedToggleBtn = createButton('⏱️');
    speedToggleBtn.onclick = (event) => {
      const controlsContainer = event.currentTarget.closest('div').parentNode;
      const speedControlContainer = controlsContainer.speedControlContainer;
      const isVisible = speedControlContainer.style.display === 'flex';
      speedControlContainer.style.display = isVisible ? 'none' : 'flex';
      speedToggleBtn.style.backgroundColor = isVisible ? '' : 'darkgrey';
    };
    return speedToggleBtn;
  }

  function createVolumeToggleButton() {
    const volumeToggleBtn = createButton('🔊');
    volumeToggleBtn.onclick = (event) => {
      const controlsContainer = event.currentTarget.closest('div').parentNode;
      const volumeControlContainer = controlsContainer.volumeControlContainer;
      const isVisible = volumeControlContainer.style.display === 'flex';
      volumeControlContainer.style.display = isVisible ? 'none' : 'flex';
      volumeToggleBtn.style.backgroundColor = isVisible ? '' : 'darkgrey';
    };
    return volumeToggleBtn;
  }

  function createSpeedControlContainer(wavesurfer) {
    const speedControlContainer = document.createElement('div');
    speedControlContainer.style.cssText = `
      display: none;
      align-items: center;
      margin-bottom: 10px;
    `;

    const speedLabel = createButton('⏱️');
    speedControlContainer.appendChild(speedLabel);

    const speedControl = document.createElement('input');
    speedControl.type = 'range';
    speedControl.min = 0.1;
    speedControl.max = 2;
    speedControl.step = 0.01;
    speedControl.value = 1;
    speedControl.style.margin = '0 10px';
    speedControl.oninput = () => {
      const speed = parseFloat(speedControl.value);
      wavesurfer.setPlaybackRate(speed);
      speedReadout.innerHTML = speed.toFixed(2) + 'x';
    };
    speedControlContainer.appendChild(speedControl);

    const speedReadout = document.createElement('span');
    speedReadout.innerHTML = '1.00x';
    speedReadout.style.cssText = `
      margin-left: 10px;
      font-family: monospace;
    `;
    speedControlContainer.appendChild(speedReadout);

    speedLabel.onclick = () => {
      speedControl.value = 1;
      wavesurfer.setPlaybackRate(1);
      speedReadout.innerHTML = '1.00x';
    };

    return speedControlContainer;
  }

  function createVolumeControlContainer(wavesurfer) {
    const volumeControlContainer = document.createElement('div');
    volumeControlContainer.style.cssText = `
      display: none;
      align-items: center;
    `;

    const volumeLabel = createButton('🔊');
    volumeControlContainer.appendChild(volumeLabel);

    const volumeControl = document.createElement('input');
    volumeControl.type = 'range';
    volumeControl.min = 0;
    volumeControl.max = 1;
    volumeControl.step = 0.01;
    volumeControl.value = wavesurfer.getVolume();
    volumeControl.style.margin = '0 10px';
    volumeControl.oninput = () => {
      wavesurfer.setVolume(volumeControl.value);
      volumeReadout.innerHTML = padVolume((volumeControl.value * 100).toFixed(0)) + '%';
    };
    volumeControlContainer.appendChild(volumeControl);

    const volumeReadout = document.createElement('span');
    volumeReadout.innerHTML = padVolume('100%');
    volumeReadout.style.cssText = `
      margin-left: 10px;
      width: 40px;
      display: inline-block;
      text-align: right;
      font-family: monospace;
    `;
    volumeControlContainer.appendChild(volumeReadout);

    volumeLabel.onclick = () => {
      volumeControl.value = 1;
      wavesurfer.setVolume(1);
      volumeReadout.innerHTML = '100%';
    };

    return volumeControlContainer;
  }

  function padVolume(volume) {
    return volume.padStart(3, '0');
  }

  window.$docsify.plugins = [].concat(function (hook, vm) {
    hook.doneEach(() => {
      initWaveSurfer();
    });
  }, window.$docsify.plugins);
})();
