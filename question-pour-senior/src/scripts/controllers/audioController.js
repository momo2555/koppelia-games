//@ts-check

export class AudioController {
    constructor () {
        this.audio = {}
    }

    playBackground() {
        this.playMusic("background.mp3", true)
    }

    playBuzz() {

    }

    playWrong() {

    }

    playRight() {
        
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

}