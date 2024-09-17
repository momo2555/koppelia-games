//@ts-check

export class AudioController {
    constructor () {
        this.audio = {}
    }
    playOutro() {
        this.playMusic("ending.mp3");
    }
    pauseOutro() {
        this.pauseMusic("ending.mp3");
    }
    playBackground() {
        this.playMusic("background.mp3", true);
    }

    pauseBackground() {
        this.pauseMusic("background.mp3");
    }

    playBuzz() {
        this.playMusic("buzz.mp3");
    }

    playWrong() {
        this.playMusic("wrong.mp3");
    }

    playRight() {
        this.playMusic("applause.mp3");
    }

    playSpecial() {
        this.playMusic("lelacduconnemera.mp3");
    }

    pauseSpecial() {
        this.pauseMusic("lelacduconnemera.mp3");
    }

    /**
     * 
     * @param {string} music 
     * @param {boolean} loop 
     */
    playMusic(music, loop = false) {
        if (this.audio != null && typeof (this.audio) !== 'undefined')
            if (music in this.audio)
                this.audio[music].pause()
        this.audio[music] = new Audio('audio/' + music);
        this.audio[music].loop = loop;
        this.audio[music].play();
    }

    pauseMusic(music) {
        if (music in this.audio)
                this.audio[music].pause()
    }

}