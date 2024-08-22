//@ts-check


class ControllerGame {
    /**
     * Constructor if ControllerGame
     * @param {import('legendary/extern/legend').Legend} legend
     */
    constructor(legend) {
        this.legend = legend;
        this.stages = ["home", "identification", "plays", "game"];
        this.currentStage = "";

        this.buttonPlay = $("#controller #button-play");
        this.homeButton = $("#controller #button-home");

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
            responses: [],
            buzzing: null,
        });
    }

    initEvents() {
        // State change
        this.legend.onStateChange((from, state) => {
            if (this.currentStage != state["stage"]) {
                this.currentStage = state["stage"];
                this.hideAllStages();
                this.showStage(this.currentStage);
            }

        });
        
        this.buttonPlay.on("click", function (e) {
            
        })



    }



}