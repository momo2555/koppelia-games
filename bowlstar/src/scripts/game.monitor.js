import { PlayListElement } from './components/playListElement.js';
import { AudioController } from './controllers/audioController.js';

export class MonitorGame {

    /**
     * Constructor of ControllerGame
     * @param {import('legendary/extern/legend').Legend} legend
     */

    constructor(legend) {
        this.legend = legend;
        this.audio = new AudioController()
        this.stages = ["home", "identification", "game", "end-game"];
        this.currentStage = "";

        this.playList = {};
        this.buzzing = null;

        this.hideAllStages();
        this.initEvents();

        this.penalityTime = 3000;


    }
    hideAllStages() {
        for (let stage of this.stages) {
            this.hideSatge(stage);
        }
    }

    hideSatge(stageName) {
        $('#monitor #monitor-' + stageName).hide();
    }

    showStage(stageName) {
        this.hideAllStages();
        $('#monitor #monitor-' + stageName).show();

    }

    initEvents() {
        // State change
        this.legend.onStateChange((from, state) => {
            if (this.currentStage != state["stage"]) {
                this.currentStage = state["stage"];
                this.hideAllStages();
                this.showStage(this.currentStage);

                if (this.currentStage == this.stages[2]) {
                    this.audio.playBackground();
                }
                console.log(this.currentStage);
                if (this.currentStage == this.stages[3]) {
                    this.audio.pauseBackground();
                    this.audio.playOutro();
                    console.log("Show end game");
                    this.showEndGame(state);
                }
                if (this.currentStage == this.stages[0]) {
                    this.audio.pauseBackground();
                    this.audio.pauseOutro();
                }
            }
            // manage identification stage
            if (state.stage == this.stages[1]) {
                this.showIdentification();
            }

            // manage game stage
            if (state.stage == this.stages[2]) {
                // if there is no question, choose question
                this.showGame();
            }

        });

        this.legend.onData((from, data) => {
            if ('action' in data) {
                // execute an action sent by controller
                if (data.action == "verif") {
                    this.checkAnswer();
                }
            }

            if ('play' in data) {
                console.log(data);
                const play = data.play;
                // add a play in the play list
                this.playList[play.play_id] = play;
                // Add it as an element 
                let playEl = new PlayListElement(play.play_id, play.play_name, play.play_image).getMonitorElement();

            }
        });
    }



    showIdentification() {
        let state = this.legend.getState();
        let i = 0;
        console.log(state["bowls"]);
        for (let bowl of state["bowls"]) {
            console.log(bowl);
            console.log(bowl.vertical)
            $("#monitor #id-bowl" + (i + 1)).css({
                border: "10px solid " + bowl.color,
                backgroundColor: bowl.vertical ? bowl.color : "grey"
            });
           
            i++;
        }
    }

    showGame() {

    }


    showEndGame(state) {


    }




}