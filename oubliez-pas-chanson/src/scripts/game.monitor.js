//@ts-check

import { AudioController } from './controllers/audioController.js';

export class MonitorGame {

    /**
     * Constructor of ControllerGame
     * @param {import('legendary/extern/legend').Legend} legend
     */

    constructor(legend) {
        this.legend = legend;
        this.audio = new AudioController()
        this.stages = ["home", "game", "explanation", "end-game"];
        this.currentStage = "";

        this.playsListBloc = $("#monitor #monitor-plays-list");
        this.playList = {};
        this.buzzing = null;

        this.special = null;

        // temporary :( 
        this.specialBuzzed = false;

        this.gameContent = [
            {
                name: "music1",
                sound: "music1/sound.mp3",
                lyrics: "music1/lyrics.txt",
                answer: "Edith Piaf",
                image: "music1/edith-piaf.jpg"
            },
            {
                name: "music2",
                sound: "music2/sound.mp3",
                lyrics: "music2/lyrics.txt",
                answer: "Joe Dassin",
                image: "music2/joe_dassin.jpg"
            },
            {
                name: "music3",
                sound: "music3/sound.mp3",
                lyrics: "music3/lyrics.txt",
                answer: "Annie Cordy",
                image: "music3/annie_cordy.jpg"
            }
        ]

        this.currentMusic = null;

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
        console.log("stagename = " + stageName);
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
                let lastStage = this.currentStage;
                this.currentStage = state["stage"];
                this.hideAllStages();
                this.showStage(this.currentStage);
                
                if(state["stage"] == this.stages[1]) {
                    if (lastStage == this.stages[2]) {
                        this.currentMusic = null;
                        state.music = null;
                    }
                }


            }


            // Launch the game
            if (this.currentStage == this.stages[1]) {

                // if there is no music choose one
                if (state.music == null) {
                    this.chooseMusic();
                }

                // if there is a music but no music played start a music
                if (state.music != null && this.currentMusic == null) {
                    this.showGame(state);
                }

                this.currentMusic = state.music;

            }

            if (state.stage == this.stages[2]) {
                this.showExplanation(state.music);
            }



        });

        this.legend.onData((from, data) => {
            if ('action' in data) {
                // execute an action sent by controller
                if (data.action == "verif") {
                    this.checkAnswer();
                }
            }

            // if ('checkSpecial' in data) {
            //     // execute an action sent by controller
            //     if (data.checkSpecial == true) {
            //         this.checkSpecialAnswer();
            //     }
            // }


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

    showExplanation(music) {
        this.audio.pauseCustom(music.name);
        $("#explanation-answer p").text(music.answer);
        $("#explanation-image").html('<img src="content/' + music.image + '">');
    }

    showGame(state) {
        let music = state.music;
        // parse the lyrics 
        // add the music in sound controller
        this.audio.addCustom(music.name, "content/" + music.sound)
        // Fetch the music lyrics
        const filePath = '/game/content/' + music.lyrics;

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
                /*this.goodAnswer = "Michel Sardou";
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
                this.specialAnswerIndex = 1;*/



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
                this.audio.playCustom(music.name);
                let startTime = Math.floor(Date.now() / 1000);
                this.incrementLyrics();
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
        if (state.stage == this.stages[1]) {
            window.setTimeout(() => {
                this.incrementLyrics();
            }, (this.shownLyrics[2].time - this.shownLyrics[1].time) * 1000);
        }
    }

    updateStageToEnd() {
        this.legend.updateStateElement("stage", this.stages[3]);
    }

    /*incrementSpecialAnswer() {

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

    }*/

    chooseMusic() {
        if (this.gameContent.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.gameContent.length);
            const randomMusic = this.gameContent[randomIndex];

            // Remove the question from remaining questions
            this.gameContent.splice(randomIndex, 1);
            console.log(this.gameContent.length);

            // Update the state:
            let state = this.legend.getState();
            this.legend.updateStateElement("music", randomMusic);



        } else {
            // end game
            this.updateStageToEnd();

        }
    }




}

