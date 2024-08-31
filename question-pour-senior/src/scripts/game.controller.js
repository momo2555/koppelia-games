//@ts-check

import { PlayListElement } from './components/playListElement.js';

export class ControllerGame {

    /**
     * Constructor of ControllerGame
     * @param {import('legendary/extern/legend').Legend} legend
     */

    constructor(legend) {
        this.legend = legend;
        this.stages = ["home", "identification", "plays", "game"];
        this.currentStage = "";

        this.buttonPlay = $("#controller #button-play");
        this.buttonExplanations = $("#controller #button-explanations");
        this.buttonIdBloc = $("#controller #id-bottom-bloc");
        this.buttonStartPlay = $("#plays-bottom-bloc");

        this.playsListBloc = $("#controller #plays-page");
        this.playList = {};
        this.selectedPLay = "";

        this.remainingQuestions = [];

        this.hideAllStages();
        this.initEvents();
        this.initializeGame();

    }

    hideAllStages() {
        for (let stage of this.stages) {
            this.hideSatge(stage);
        }
    }

    hideSatge(stageName) {
        $('#controller #controller-' + stageName).hide();
    }

    showStage(stageName) {
        this.hideAllStages();
        $('#controller #controller-' + stageName).show();

    }

    initializeGame() {
        //set default state
        // steps : home, identify, thems, play
        this.currentStage = this.stages[0];
        this.showStage(this.currentStage);
        this.legend.setState({
            stage: this.stages[0],
            players: [],
            question: null,
            choices: [],
            answer: [],
            selectedANswer: null,
            buzzing: null,
        });
    }

    initPlayListStage() {
        // hide the play list
        this.playsListBloc.html("");
        // Get the game plays list
        this.legend.getGamePlays();

    }

    deselectAllPlays() {
        $('.play-element').removeClass("selected");
    }

    initEvents() {
        // State change
        this.legend.onStateChange((from, state) => {
            if (this.currentStage != state["stage"]) {
                this.currentStage = state["stage"];
                this.hideAllStages();
                this.showStage(this.currentStage);
                // launch init functions 
                if (this.currentStage == this.stages[2]) {
                    this.initPlayListStage();
                }
            }
            if (state.stage == this.stages[3]) {
                // if there is no question, choose question
                if (state.question == null) {
                    this.chosQuestion();
                } else {
                    this.showQuestion(state.question, state.choices, state.answer);
                }
            }

        });

        this.legend.onData((from, data) => {
            console.log(data);
            for (const playId in data.plays) {
                this.legend.parseGamePlay(playId, data.plays[playId]).then(
                    (val) => {
                        this.playList[playId] = val;
                        console.log(val);
                        let playEl = new PlayListElement(playId, val.play_name, val.play_image).getControllerElemeent();
                        this.playsListBloc.append(playEl.content);
                        $("#" + playEl.id).on("click", () => {
                            this.deselectAllPlays();
                            $("#" + playEl.id).addClass("selected");
                            this.selectedPLay = playId;
                        });
                    }
                )

            }
        });

        this.buttonPlay.on("click", (e) => {
            this.legend.updateStateElement("stage", this.stages[1]);
        })

        this.buttonExplanations.on("click", (e) => {

        })

        this.buttonIdBloc.on("click", (e) => {
            this.legend.updateStateElement("stage", this.stages[2]);
        });

        this.buttonStartPlay.on("click", (e) => {
            let data = this.playList[this.selectedPLay].play_json;
            this.remainingQuestions = data.questions;
            this.legend.updateStateElement("stage", this.stages[3]);
        });

    }

    chosQuestion() {
        // take a random question from remaining questions
        const randomIndex = Math.floor(Math.random() * this.remainingQuestions.length);
        const randomQuestion = this.remainingQuestions[randomIndex];

        // Remove the question from remaining questions
        this.remainingQuestions.splice(randomIndex, 1);

        // Update the state:
        let state = this.legend.getState();
        state.question = randomQuestion.question;
        state.choices = randomQuestion.choices;
        state.answer = randomQuestion.answer;

        this.legend.setState(state);
    }

    /**
     * 
     * @param {string} question 
     * @param {Array} choices 
     * @param {string} answer 
     */
    showQuestion(question, choices, answer) {
        // set the question text
        $("#controller .question h2").text(question);

        let choiceElements = [
            $("#response-a"), $("#response-b"), $("#response-c"), $("#response-d"),
        ];
        let maxQuestions = Math.min(choices.length, choiceElements.length);
        $(".response").removeClass("right-response");
        for (let i = 0; i < maxQuestions; i++) {
            choiceElements[i].children("p").text(choices[i]);
            if (choices[i] == answer) {
                choiceElements[i].addClass("right-response");
            }
        }

    }


}