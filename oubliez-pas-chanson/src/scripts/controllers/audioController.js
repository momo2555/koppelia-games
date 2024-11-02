//@ts-check

export class AudioController {
    constructor () {
        this.audio = {}
        this.musicMap = {
            background : "audio/background.mp3",
            ending : "audio/ending.mp3",
            buzz: "audio/buzz.mp3",
            wrong: "audio/wrong.mp3",
            applause: "audio/applause.mp3"
        }
    }
    playOutro() {
        this.playMusic("ending");
    }
    pauseOutro() {
        this.pauseMusic("ending");
    }
    playBackground() {
        this.playMusic("background", true);
    }

    pauseBackground() {
        this.pauseMusic("background");
    }

    playBuzz() {
        this.playMusic("buzz");
    }

    playWrong() {
        this.playMusic("wrong");
    }

    playRight() {
        this.playMusic("applause");
    }

    /**
     * 
     * @param {string} music 
     * @param {string} musicPath 
     */
    addCustom(music, musicPath) {
        this.musicMap[music] = musicPath
    }

    /**
     * 
     * @param {string} music 
     * @param {boolean} loop 
     */
    playCustom(music, loop = false) {
        this.playMusic(music, loop);
    }

    /**
     * 
     * @param {string} music 
     */
    pauseCustom(music) {
        this.pauseMusic(music);
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
        this.audio[music] = new Audio(this.musicMap[music]);
        this.audio[music].loop = loop;
        this.audio[music].play();
    }

    pauseMusic(music) {
        if (music in this.audio)
                this.audio[music].pause()
    }

}