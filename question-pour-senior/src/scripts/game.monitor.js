export class MonitorGame {

    /**
     * Constructor of ControllerGame
     * @param {import('legendary/extern/legend').Legend} legend
     */

    constructor(legend) {
        this.legend = legend;
        this.stages = ["home", "identification", "plays", "game"]
        this.currentStage = ""
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

    initEvents() {
        // State change
        this.legend.onStateChange((from, state) => {
            if (this.currentStage != state["stage"]) {
                this.currentStage = state["stage"];
                this.hideAllStages();
                this.showStage(this.currentStage)
            }
            if (state.question != null) {
                this.showQuestion(state.question, state.choices, state.selectedAnswer);

            }

        });

        this.legend.onData((from, data) => {
            if ('action' in data) {
                if (data.action == "verif") {
                    this.checkAnswer();
                }
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
        $(".response").removeClass("right-response");
        $(".response").removeClass("wrong-response");

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
        if(state.selectedAnswer != null) {
            if (state.selectedAnswer == state.answer) {
                // the chosen answer is right
                $(".response-selected").addClass("right-response");
                // show the result for two seconds
                window.setTimeout(() => {
                    this.requestNewQuestion();
                }, 2000);
            } else {
                // the chosen answer is wrong
                $(".response-selected").addClass("wrong-response");
                // show the result for two seconds
                window.setTimeout(() => {
                    this.deselectResponse();
                }, 2000);
            }
            
        }
    }

    requestNewQuestion() {
        // to request a new question just set the question field of the state to null
        this.legend.updateStateElement("question", null);
    }

    deselectResponse() {
        this.legend.updateStateElement("selectedAnswer", null);
    }


}