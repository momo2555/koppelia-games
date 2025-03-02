//@ts-check

import { PlayListElement } from './components/playListElement.js';

export class ControllerGame {

    /**
     * Constructor of ControllerGame
     * @param {import('legendary/extern/legend').Legend} legend
     */

    constructor(legend) {
        this.legend = legend;
        this.stages = ["home", "identification", "game", "end-game"];
        this.currentStage = "";

        // buttons
        this.buttonPlay = $("#controller #button-play");
        this.buttonExplanations = $("#controller #button-explanations");
        this.buttonStartGame = $("#controller #id-start-game");
        this.buttonStopGame = $("#controller #game-bottom-bloc");
        this.buttonReturnHome = $("#controller #end-game-bottom-bloc");

        // entries
        this.entryPlayerName = $("#controller #id-player-name")


        this.playsListBloc = $("#controller #plays-page");
        this.playList = {};
        this.selectedPLay = "";

        this.remainingQuestions = [];

        // BUZZERS VARS SECTION
        this.availableColors = [[255, 255, 0], [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 0, 255]];
        this.buzzerTab = {};
        this.question = "";

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
            bowls: [],
            score: 0,
            entryPlayerName: "",
            noBuzzTime: false,
        });
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


        // when receiving a new data (the list of plays)
        this.legend.onDeviceData((from, data) => {
           
            for (let valueElement of data) {
                for (let key in valueElement) {
                    if (key == "vd") {
                        console.log("vd = " + valueElement[key] + "; comming from " + from)
                        this.setBowlState(from, valueElement[key])
                    }
                }
            }
            
        });

        this.legend.onDeviceEvent((name, from, event) => {
            console.log("new Device event = " + event + "; device address = " + from);
            let state = this.legend.getState();
            let buzzActivated = state.buzzing != null;
            // if buzzing during identification
            if (state.stage == this.stages[1] && !buzzActivated) {
                let theEvent = "";
                if (name == "mushroom") {
                    this.addNewBowl(from);
                    theEvent = this.getBuzzerColor(from);
                } else {
                    theEvent = event;
                }

                this.legend.sendDeviceData(from, this.colorToBuzzColor(theEvent));
                
                // window.setTimeout(() => {
                //     this.legend.enableVerticalDetector(from);
                // }, 200);
                

            }


            /*else if ((state.stage == this.stages[3]) && !buzzActivated && !state.noBuzzTime) {
                let theEvent = "";
                if (name == "mushroom") {
                    theEvent = this.getBuzzerColor(from);
                } else {
                    theEvent = event;
                }
                for (let player of state.players) {
                    //check also id there is a penality
                    if (player.id == this.colorToHtmlColor(theEvent) && player.penalityTime < Date.now()) {
                        this.legend.updateStateElement("buzzing", {
                            id: this.colorToHtmlColor(theEvent),
                            name: player.name,
                            color: this.colorToHtmlColor(theEvent),
                        });
                        this.legend.sendDeviceData(from, this.colorToBuzzColor(theEvent))
                    }
                }
            }*/

        });

        // buttons EVENTS ===============================

        // Start the game
        this.buttonPlay.on("click", (e) => {
            this.legend.updateStateElement("stage", this.stages[1]);
        });

        this.buttonExplanations.on("click", (e) => {

        });

        this.buttonStopGame.on("click", (e) => {
            this.updateStageToEnd();
        });

        this.buttonStartGame.on("click", (e) => {
            this.legend.updateStateElement("stage", this.stages[2]);
        });

        this.buttonReturnHome.on("click", (e) => {
            this.legend.updateStateElement("stage", this.stages[0]);
        });


        this.entryPlayerName.on('input', (e) => {
            this.legend.updateStateElement("entryPlayerName", this.entryPlayerName.val());
        });
    }


    showIdentification() {
        
    }

    showGame() {

    }







    /**
     * BUZZER FUNCTIONS SECTION
     */

    addNewBowl(address) {
        // check if the address exist
        if (!Object.keys(this.buzzerTab).includes(address) && this.availableColors.length > 0) {
            let state = this.legend.getState();

            this.buzzerTab[address] = this.availableColors.pop();

            state["bowls"].push({
                from: address,
                color: this.colorToHtmlColor(this.buzzerTab[address]),
                vertical: false,
            });

            this.legend.updateStateElement("bowls", state["bowls"]);

        }
    }

    setBowlState(bowlAddr, newValue) {
        let state = this.legend.getState();
        let changed = false;
        for (let bowl of state["bowls"]) {
            if (bowl["from"] == bowlAddr) {
                let oldValue = bowl["vertical"];
                bowl["vertical"] = newValue;
                changed = oldValue != newValue;
            }
        }
        if (changed) {
            console.log("New bowl value changed");
            console.log(state["bowls"]);
            this.legend.updateStateElement("bowls", state["bowls"]);
        }
    }

    colorToBuzzColor(color) {
        return [
            { type: "int", r: color[0] },
            { type: "int", g: color[1] },
            { type: "int", b: color[2] }
        ]
    }

    colorToHtmlColor(color) {
        return "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
    }

    getBuzzerColor(address) {
        return this.buzzerTab[address];
    }



    updateStageToEnd() {
        this.legend.updateStateElement("stage", this.stages[3]);
    }
}

