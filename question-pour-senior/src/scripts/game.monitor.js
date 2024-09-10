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
        this.stages = ["home", "identification", "plays", "game"];
        this.currentStage = "";

        this.playsListBloc = $("#monitor #monitor-plays-list");
        this.playList = {};
        this.buzzing = null;

        this.hideAllStages();
        this.initEvents();


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

    initPlayListStage() {
        // hide the play list
        this.playsListBloc.html("");
    }

    deselectAllPlays() {
        $("#monitor .play-element").removeClass("play-selected");
    }

    selectPlay(playId) {
        $("#play-el-" + playId).addClass("play-selected");
    }

    initEvents() {
        // State change
        this.legend.onStateChange((from, state) => {
            if (this.currentStage != state["stage"]) {
                this.currentStage = state["stage"];
                this.hideAllStages();
                this.showStage(this.currentStage);
                // launch init functions (init plays list on stage of choosing the play)
                // check if it is the fisrt time is is the play stage
                if (this.currentStage == this.stages[2]) {
                    this.initPlayListStage();
                }
                if (this.currentStage == this.stages[3]) {
                    this.audio.playBackground();
                }

            }
            if (state.buzzing != null) {
                this.showSlectedPlayer(state.buzzing);
                if (this.buzzing == null) {
                    // make the sound once, not at each time the state is resent
                    this.audio.playBuzz();
                    this.audio.pauseBackground();
                }
            } else {
                this.hideSelectedPlayer();
            }
            this.buzzing = state.buzzing;

            // cHECK if it is play stage (different for the one before)
            if (this.currentStage == this.stages[2]) {
                this.deselectAllPlays();
                if (state.selectedPlay != null) {
                    this.selectPlay(state.selectedPlay);
                }
            }
            if (state.question != null) {
                this.showQuestion(state.question, state.choices, state.selectedAnswer);

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
                this.playsListBloc.append(playEl.content);
            }


        });
    }

    showQuestion(question, choices, selected) {
        // set the question text
        $("#monitor #question h2").text(question);

        let choiceElements = [
            $("#response-a"), $("#response-b"), $("#response-c"), $("#response-d"),
        ];
        let maxQuestions = Math.min(choices.length, choiceElements.length);

        $(".response").removeClass("response-selected");
        // Manage play (questions and responses)
        for (let i = 0; i < maxQuestions; i++) {
            choiceElements[i].children("p").text(choices[i]);
            if (choices[i] == selected) {
                choiceElements[i].addClass("response-selected");
            }
        }



    }

    checkAnswer() {
        let state = this.legend.getState();
        if (state.selectedAnswer != null) {
            if (state.selectedAnswer == state.answer) {
                // the chosen answer is right
                $(".response-selected").addClass("right-response");
                this.audio.pauseBackground();
                this.audio.playRight();
                // cancel the player who is buzzing
                this.cancelPlayerBuzzing();
                // show the result for two seconds
                window.setTimeout(() => {
                    this.requestNewQuestion();
                    this.deselectResponse();
                    this.audio.playBackground();
                }, 3000);
            } else {
                // the chosen answer is wrong
                $(".response-selected").addClass("wrong-response");
                this.audio.pauseBackground();
                this.audio.playWrong();
                // cancel the player who is buzzing
                this.cancelPlayerBuzzing();
                // show the result for two seconds
                window.setTimeout(() => {
                    this.deselectResponse();
                    this.audio.playBackground();
                }, 3000);
            }

        }
    }

    requestNewQuestion() {
        // to request a new question just set the question field of the state to null
        this.legend.updateStateElement("question", null);
    }

    deselectResponse() {
        this.legend.updateStateElement("selectedAnswer", null);
        $(".response").removeClass("response-selected");
        $(".response").removeClass("right-response");
        $(".response").removeClass("wrong-response");
    }

    cancelPlayerBuzzing() {
        this.legend.updateStateElement("buzzing", null);
    }

    showSlectedPlayer(buzzing) {
        $(".selected-color").show();
        $(".selected-color").css({
            background: "linear-gradient(180deg, " + buzzing.color + " 0%, rgba(0, 212, 255, 0) 100%)"
        });
    }

    showSlectedPlayerName(buzzing) {

    }

    hideSelectedPlayer() {
        $(".selected-color").hide();
    }


}