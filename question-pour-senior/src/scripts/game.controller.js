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
        this.buttonResponse = $("#controller .response");
        this.buttonGameVerif = $("#controller #game-verif-button");
        this.buttonGamePass = $("#controller #game-pass-button");

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
            selectedAnswer: null,
            buzzing: null,
            selectedPlay: null
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

    deselectAllResponses() {
        $(".response").removeClass("selected");
    }

    initEvents() {
        // State change event
        this.legend.onStateChange((from, state) => {
            if (this.currentStage != state["stage"]) {
                this.currentStage = state["stage"];
                this.hideAllStages();
                this.showStage(this.currentStage);
                // launch init functions (init plays list on stage of choosing the play)
                if (this.currentStage == this.stages[2]) {
                    this.initPlayListStage();
                }
            }
            if (state.stage == this.stages[3]) {
                // if there is no question, choose question
                if (state.question == null) {
                    this.chosQuestion();
                } else {
                    // if is there a question show it
                    this.showQuestion(state.question, state.choices, state.answer);
                    this.showVerifOrPassButton(state.selectedAnswer);
                    //deselect all responses if the selection gone
                    if (state.selectedAnswer == null) this.deselectAllResponses();
                }
            }

        });


        // when receiving a new data (the list of plays)
        this.legend.onData((from, data) => {
            console.log(data);
            for (const playId in data.plays) {
                this.legend.parseGamePlay(playId, data.plays[playId]).then(
                    (val) => {
                        // add the id in the play json object
                        val.play_id = playId;
                        // add the play in the list
                        this.playList[playId] = val;
                        // Send it to monitor (to show it)
                        this.legend.sendToMonitor({
                            play: val
                        })
                        console.log(val);
                        let playEl = new PlayListElement(playId, val.play_name, val.play_image).getControllerElemeent();
                        this.playsListBloc.append(playEl.content);
                        $("#" + playEl.id).on("click", () => {
                            this.deselectAllPlays();
                            $("#" + playEl.id).addClass("selected");
                            this.selectedPLay = playId;
                            this.legend.updateStateElement("selectedPlay", playId);
                        });
                    }
                )

            }
        });

        // buttons EVENTS ===============================

        // Start the game
        this.buttonPlay.on("click", (e) => {
            this.legend.updateStateElement("stage", this.stages[1]);
        });

        this.buttonExplanations.on("click", (e) => {

        });

        this.buttonIdBloc.on("click", (e) => {
            this.legend.updateStateElement("stage", this.stages[2]);
        });

        this.buttonStartPlay.on("click", (e) => {
            let data = this.playList[this.selectedPLay].play_json;
            this.remainingQuestions = data.questions;
            this.legend.updateStateElement("stage", this.stages[3]);
        });

        // when click on an answer (on of 4 answers)
        this.buttonResponse.on("click", (e) => {
            this.deselectAllResponses();
            $(e.target).addClass("selected");
            this.legend.updateStateElement("selectedAnswer", $(e.target).children('p').first().text())
        });

        this.buttonGameVerif.on("click", (e) => {
            // Send the response to be checked
            this.legend.sendToMonitor({
                action: "verif"
            });

        });

        this.buttonGamePass.on("click", (e) => {
            // Pass the question and go next question
            this.requestNewQuestion();

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
        state.selectedAnswer = null;

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

    /**
     * Firgure out what button to show 
     * @param {string} selectedAnswer 
     */
    showVerifOrPassButton(selectedAnswer) {
        if (selectedAnswer != null) {
            this.buttonGameVerif.show();
            this.buttonGamePass.hide();
        } else {
            this.buttonGameVerif.hide();
            this.buttonGamePass.show();
        }
    }

    requestNewQuestion() {
        // to request a new question just set the question field of the state to null
        this.legend.updateStateElement("question", null);
    }


}