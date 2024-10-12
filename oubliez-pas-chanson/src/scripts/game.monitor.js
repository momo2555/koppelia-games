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
        this.stages = ["home", "identification", "plays", "game", "end-game", "special"];
        this.currentStage = "";

        this.playsListBloc = $("#monitor #monitor-plays-list");
        this.playList = {};
        this.buzzing = null;

        this.special = null;

        // temporary :( 
        this.specialBuzzed = false;

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
                console.log(this.currentStage);
                if (this.currentStage == this.stages[4]) {
                    this.audio.pauseBackground();
                    this.audio.playOutro();
                    console.log("Show end game");
                    this.showEndGame(state);
                }
                if (this.currentStage == this.stages[0]) {
                    this.audio.pauseBackground();
                    this.audio.pauseOutro();
                }
                if (this.currentStage == this.stages[5]) {
                    this.audio.pauseBackground();
                    this.audio.pauseOutro();
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

            if (this.currentStage == this.stages[5]) {
                if (state.special != null && state.special != this.special) {
                    if (state.special == true) {
                        // start the special
                        this.showSpecial(state);

                    }
                }
                this.special = state.special;
                // 
                if (state.buzzing != null && !this.specialBuzzed) {
                    $("#special-bottom p").css(
                        {
                            "background-color": state.buzzing.color,
                        }
                    );
                    this.specialBuzzed = true;
                }
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

            if ('checkSpecial' in data) {
                // execute an action sent by controller
                if (data.checkSpecial == true) {
                    this.checkSpecialAnswer();
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
                this.cancelPlayerBuzzing(true);
                // show the result for two seconds
                window.setTimeout(() => {
                    this.deselectResponse(true);
                    this.audio.playBackground();
                }, 3000);
            } else {
                // the chosen answer is wrong
                $(".response-selected").addClass("wrong-response");
                this.audio.pauseBackground();
                this.audio.playWrong();
                // cancel the player who is buzzing
                this.cancelPlayerBuzzing(false);
                // show the result for two seconds
                window.setTimeout(() => {
                    this.deselectResponse(false);
                    this.audio.playBackground();
                }, 1500);
            }

        }
    }

    showEndGame(state) {
        let podium = $("#monitor #podium");

        if (state.players.length > 0) {
            podium.show();
            // class the playersfor
            state.players.sort((a, b) => {
                return b.score - a.score;
            });
            $(".podium-el-first").hide();
            $(".podium-el-second").hide();
            $(".podium-el-third").hide();

            let to = state.players.length >= 3 ? 3 : state.players.length;
            for (let i = 0; i < to; i++) {
                let player = state.players[i];
                if (i == 0) {
                    $(".podium-el-first").show();
                    $("#first-podium-name p").text(player.name);
                    $("#first-podium p").text(player.score);
                    $("#first-podium").css({
                        "background-color": player.color
                    });
                } else if (i == 1) {
                    $(".podium-el-second").show();
                    $("#second-podium-name p").text(player.name);
                    $("#second-podium p").text(player.score);
                    $("#second-podium").css({
                        "background-color": player.color
                    });
                } else if (i == 2) {
                    $(".podium-el-third").show();
                    $("#third-podium-name p").text(player.name);
                    $("#third-podium p").text(player.score);
                    $("#third-podium").css({
                        "background-color": player.color
                    });
                }
            }

        } else {
            podium.hide();
        }



    }

    showSpecial(state) {
        // parse the lyrics 
        const filePath = '/game/content/lyrics.txt';

        // Using the fetch API to read the file
        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();  // Convert the response to text
            })
            .then(text => {
                // parse the lyrics
                this.lyrics = [];
                this.goodAnswer = "Michel Sardou";
                this.specialAnswers = [
                    {
                        answer: "Charles Aznavour",
                        id: 3,
                    },
                    {
                        answer: "Jean-Jacques Goldman",
                        id: 4,
                    },
                    {
                        answer: "Florent Pagny",
                        id: 5,
                    },
                    {
                        answer: "Michel Sardou",
                        id: 6,
                    },
                ]
                this.specialSelectedAnswer = null;
                this.specialAnswerIndex = 1;



                const lines = text.split('\n');
                for (let line of lines) {
                    let data = line.split(' - ');
                    let lyric = data[1];
                    let timeData = data[0].split(":");
                    let time = parseInt(timeData[0]) * 60 + parseInt(timeData[1]);
                    this.lyrics.push({
                        lyric: lyric,
                        time: time
                    });
                }
                console.log(this.lyrics);
                this.shownLyrics = [null, null, this.lyrics[0], this.lyrics[1], this.lyrics[2]];
                this.lyricIndex = 2;
                this.audio.playSpecial();
                let startTime = Math.floor(Date.now() / 1000);
                this.incrementLyrics();
                this.incrementSpecialAnswer();


            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            });



    }

    incrementLyrics() {
        // first show the lyrics
        let state = this.legend.getState();
        let lyricsDOM = [
            $("#lyric-1 p"), $("#lyric-2 p"), $("#lyric-3 p"), $("#lyric-4 p"), $("#lyric-5 p")
        ]
        for (let i = 0; i < this.shownLyrics.length; i++) {
            if (this.shownLyrics[i] != null) {
                lyricsDOM[i].text(this.shownLyrics[i].lyric);
            } else {
                lyricsDOM[i].text("");
            }

        }
        // Add the next lyric
        this.shownLyrics.shift();
        this.lyricIndex++;
        this.shownLyrics.push(this.lyrics[this.lyricIndex]);
        if (state.buzzing == null) {
            window.setTimeout(() => {
                this.incrementLyrics();
            }, (this.shownLyrics[2].time - this.shownLyrics[1].time) * 1000);
        }

    }

    incrementSpecialAnswer() {

        let state = this.legend.getState();
        if (state.buzzing == null) {
            let answerDOM = $("#special-bottom p");

            for (let answer of this.specialAnswers) {
                if (answer.id == this.specialAnswerIndex) {
                    this.specialSelectedAnswer = answer;
                }
            }
            this.specialAnswerIndex++;

            // show the answer
            if (this.specialSelectedAnswer == null) {
                answerDOM.hide();
            } else {
                answerDOM.show();
                answerDOM.text(this.specialSelectedAnswer.answer)
            }


            window.setTimeout(() => {
                this.incrementSpecialAnswer();
            }, 12000);
        }


    }

    checkSpecialAnswer() {
        if (this.specialAnswers != null) {
            let state = this.legend.getState();
            this.audio.pauseSpecial();
            if (this.specialSelectedAnswer.answer == this.goodAnswer) {
                $("#special-bottom p").css(
                    {
                        "background-color": "green",
                    }
                );
                this.audio.playRight();
                if (state.players.length > 0) {
                    for (let player of state.players) {
                        if (player.id == state.buzzing.id) {
                            player.score += 2;
                        }
                    }
                }
                state.buzzing = null;
                this.legend.setState(state);
            } else {
                $("#special-bottom p").css(
                    {
                        "background-color": "red",
                    }
                );
                this.audio.playWrong();
            }

            window.setTimeout(() => {
                this.legend.updateState({
                    stage: this.stages[4],
                    buzzing: null,
                });

            }, 4000);
        }

    }

    requestNewQuestion() {
        // to request a new question just set the question field of the state to null
        this.legend.updateStateElement("question", null);
    }

    deselectResponse(requestNewQuestion = false) {
        let update = {};
        if (requestNewQuestion)
            update.question = null;
        update.selectedAnswer = null;
        update.noBuzzTime = false;
        this.legend.updateState(update);
        $(".response").removeClass("response-selected");
        $(".response").removeClass("right-response");
        $(".response").removeClass("wrong-response");
    }

    cancelPlayerBuzzing(isRight) {
        let state = this.legend.getState();


        state = this.AddUserScore(state, isRight);



        // Cancel de Buzz
        state.buzzing = null
        state.noBuzzTime = true;
        this.legend.setState(state);
        console.log("Cancel buzz", state.players);
    }

    AddUserScore(state, isRight) {
        if (state.players.length > 0 && state.buzzing != null) {
            // If there are players playing
            for (let player of state.players) {
                if (player.id == state.buzzing.id) {
                    if (isRight)
                        // ADD SCORE 
                        player.score += 1;
                    else
                        // ADD PENALITY
                        player.penalityTime = Date.now() + this.penalityTime;
                }
            }
        }
        return state;
    }

    showSlectedPlayer(buzzing) {
        $(".selected-color").show();
        $(".selected-color").css({
            background: "linear-gradient(180deg, " + buzzing.color + " 0%, rgba(0, 212, 255, 0) 100%)"
        });
        $("#identification-player-info p").show();
        $("#identification-player-info p").css({
            "color": buzzing.color
        });
        $("#identification-player-info").css({
            "border-color": buzzing.color,
        });
        let state = this.legend.getState();
        $("#identification-player-info p").text(state.entryPlayerName);
        $(".buzzing-user p").show();
        $(".buzzing-user p").text(buzzing.name);
        $(".buzzing-user p").css({
            "color": buzzing.color,
        });
    }

    showSlectedPlayerName(buzzing) {

    }

    hideSelectedPlayer() {
        $(".selected-color").hide();
        $("#identification-player-info").css({
            "border-color": "#FFC436"
        });
        $("#identification-player-info p").hide();
        $(".buzzing-user p").hide();
    }


}