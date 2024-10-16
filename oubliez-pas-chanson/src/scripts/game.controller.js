//@ts-check

export class ControllerGame {

    /**
     * Constructor of ControllerGame
     * @param {import('legendary/extern/legend').Legend} legend
     */

    constructor(legend) {
        this.legend = legend;
        this.stages = ["home", "game", "explanation", "end-game"];
        this.currentStage = "";

        // buttons
        this.buttonPlay = $("#controller #home-start-button");
        this.buttonHowTo = $("#controller #home-how-to-button");
        
        this.buttonIdBloc = $("#controller #id-bottom-bloc");
        this.buttonStartPlay = $("#plays-bottom-bloc");
        this.buttonResponse = $("#controller .response");
        this.buttonGameVerif = $("#controller #game-verif-button");
        this.buttonGamePass = $("#controller #game-pass-button");
        this.buttonAddPlayer = $("#controller #id-player-add-player");
        this.buttonStopGame = $("#controller #game-bottom-bloc");
        this.buttonReturnHome = $("#controller #end-game-bottom-bloc");
        this.buttonSpecial = $("#controller #go-special-button");
        this.buttonStartSpecial = $("#controller #start-special-bottom-bloc");
        this.buttonCheckSpecial = $("#controller #check-special-bottom-bloc");


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
            question: null,
            choices: [],
            answer: [],
            selectedAnswer: null,
            buzzing: null,
            selectedPlay: null,
            special: null,
            entryPlayerName: "",
            noBuzzTime: false,
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
                /*if (this.currentStage == this.stages[2]) {
                    this.initPlayListStage();
                }*/
            }

            // manage identification stage
            /*if (state.stage == this.stages[1]) {
                if (state.buzzing != null) {
                    $('#id-list-players-bloc').hide();
                    $("#id-add-player-bloc").show();
                    $(".selected-color").show();
                    $(".selected-color").css({
                        background: "linear-gradient(180deg, " + state.buzzing.color + " 0%, rgba(0, 212, 255, 0) 100%)"
                    });
                    $('#id-players').css({
                        "border-color": state.buzzing.color,
                    });
                } else {
                    $('#id-list-players-bloc').show();
                    $("#id-add-player-bloc").hide();
                    $(".selected-color").hide();
                    $('#id-players').css({
                        "border-color": "#FFC436",
                    });
                }

                if (state.players.length > 0) {
                    console.log(state.players);
                    $("#id-bottom-bloc p").text("Continuer");
                    // show the list of players in a list
                    let listPlayers = "";
                    for (let player of state.players) {
                        listPlayers += `
                            <div class="id-player-element" style="border-color: ${player.color};">
                                <p style="color: ${player.color};">
                                    ${player.name}
                                </p>
                            </div>
                        `;
                    }
                    $("#id-list-players-bloc").html(listPlayers)
                } else {
                    $("#id-bottom-bloc p").text("Jouer sans joueurs");
                }
            }*/

            // manage game stage
            if (state.stage == this.stages[1]) {
                // if there is no question, choose question

                if (state.question == null) {
                    if (this.question != null) {
                        console.log(this.question, state.question)
                        // update question, THis is a security : to avaoid choosing several time a question
                        // It's like a mutex, but as we are in a monothread async env, I guess it's okay.
                        this.question = state.question;
                        this.chosQuestion();

                    }
                } else {
                    // update question, THis is a security : to avaoid choosing several time a question
                    // It's like a mutex, but as we are in a monothread async env, I guess it's okay.
                    this.question = state.question;
                    // if is there a question show it
                    this.showQuestion(state.question, state.choices, state.answer);
                    this.showVerifOrPassButton(state.selectedAnswer);
                    //deselect all responses if the selection gone
                    if (state.selectedAnswer == null) this.deselectAllResponses();
                    // show the buzzing player if there is:
                    if (state.buzzing != null) {
                        $(".selected-color").show();
                        $(".selected-color").css({
                            background: "linear-gradient(180deg, " + state.buzzing.color + " 0%, rgba(0, 212, 255, 0) 100%)"
                        });
                        $("#game-buzzing-player").show();
                        $("#game-buzzing-player p").css({
                            color: state.buzzing.color,
                        });
                        $("#game-buzzing-player p").text(state.buzzing.name);
                    } else {
                        $(".selected-color").hide();
                        $("#game-buzzing-player p").hide();
                    }
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

        this.legend.onDeviceEvent((name, from, event) => {
            console.log("new Device event = " + event + "; device address = " + from);
            let state = this.legend.getState();
            let buzzActivated = state.buzzing != null;
            // if buzzing during identification
            if (state.stage == this.stages[1] && !buzzActivated) {
                let theEvent = "";
                if (name == "mushroom") {
                    this.addNewBuzzer(from);
                    theEvent = this.getBuzzerColor(from);
                } else {
                    theEvent = event;
                }

                this.legend.updateStateElement("buzzing", {
                    id: this.colorToHtmlColor(theEvent),
                    name: "",
                    color: this.colorToHtmlColor(theEvent),
                });

                this.legend.sendDeviceData(from, this.colorToBuzzColor(theEvent))

            }


            else if ((state.stage == this.stages[3] || (state.stage == this.stages[5] && state.special == true)) && !buzzActivated && !state.noBuzzTime) {
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
            }

        });

        // buttons EVENTS ===============================

        // Start the game
        this.buttonPlay.on("click", (e) => {
            this.legend.updateStateElement("stage", this.stages[1]);
        });

        this.buttonHowTo.on("click", (e) => {

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

        this.buttonAddPlayer.on("click", (e) => {
            this.addNewPlayer();
        });

        this.buttonStopGame .on("click", (e) => {
            this.updateStageToEnd();
        });

        this.buttonReturnHome.on("click", (e) => {
            this.legend.updateStateElement("stage", this.stages[0]);
        });

        this.buttonSpecial.on("click", (e) => {
            this.legend.updateStateElement("stage", this.stages[5]);
        });

        this.buttonStartSpecial.on("click", (e)=> {
            this.legend.updateStateElement("special", true);

        });

        this.buttonCheckSpecial.on("click", (e) => {
            this.legend.sendToMonitor({
                checkSpecial: true
            })
        });

        this.entryPlayerName.on('input', (e) => {
            this.legend.updateStateElement("entryPlayerName", this.entryPlayerName.val());
        });

    }

    chosQuestion() {
        if (this.remainingQuestions.length > 0) {
            // take a random question from remaining questions
            const randomIndex = Math.floor(Math.random() * this.remainingQuestions.length);
            const randomQuestion = this.remainingQuestions[randomIndex];

            // Remove the question from remaining questions
            this.remainingQuestions.splice(randomIndex, 1);
            console.log(this.remainingQuestions.length);

            // Update the state:
            let state = this.legend.getState();
            state.question = randomQuestion.question;
            state.choices = randomQuestion.choices;
            state.answer = randomQuestion.answer;
            state.selectedAnswer = null;

            this.legend.setState(state);
        } else {
            // there is no question left : this is the end of the game
            this.updateStageToEnd();

        }
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

    /**
     * BUZZER FUNCTIONS SECTION
     */

    addNewBuzzer(address) {
        // check if the address exist
        if (!Object.keys(this.buzzerTab).includes(address) && this.availableColors.length > 0) {
            this.buzzerTab[address] = this.availableColors.pop();
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

    addNewPlayer() {
        let name = $('#id-player-name').val();
        $('#id-player-name').val("");
        let state = this.legend.getState();
        let playerExist = false;
        for (let player of state.players) {
            if (player.id == state.buzzing.id) {
                playerExist = true;
                player.name = name;
            }
        }
        if (!playerExist) {
            state.players.push({
                id: state.buzzing.id,
                color: state.buzzing.color,
                name: name,
                penalityTime: 0,
                score: 0,
            });
        }
        state.buzzing = null;
        this.legend.setState(state);
    }

    updateStageToEnd() {
        this.legend.updateStateElement("stage", this.stages[4]);
    }
}

