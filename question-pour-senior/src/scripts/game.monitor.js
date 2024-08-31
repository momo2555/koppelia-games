export class MonitorGame {
    constructor(legend) {
        this.legend = legend;
        this.stages = ["home", "identification", "plays", "game"]
        this.currentStage = ""
        this.hideAllStages();
        this.initEvents();


    }
    hideAllStages() {
        for(let stage of this.stages) {
            this.hideSatge(stage);
        }
    }

    hideSatge(stageName) {
        $('#monitor #monitor-'+stageName).hide();
    }

    showStage(stageName) {
        this.hideAllStages();
        $('#monitor #monitor-'+stageName).show();

    }

    initEvents() {
        // State change
        this.legend.onStateChange((from, state) => {
            if (this.currentStage != state["stage"]) {
                this.currentStage = state["stage"];
                this.hideAllStages();
                this.showStage(this.currentStage)
            }

        });
    }

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