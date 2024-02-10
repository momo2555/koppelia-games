class MonitorGame {
    constructor(legend) {
        this.legend = legend;
        this.initGame();

    }
    initGame() {
        //init the first stat
        //init events
        this.initEvents();
    }
    initEvents() {
        this.legend.onStateChange((from, state) => {
            if (state.stage !== undefined) {
                switch (state.stage) {
                    case 0:
                        //choose word
                        $("#big-title").text("LE PENDU");
                        $("#lose").hide();
                        $("#win").hide();
                        $("#lives").hide();
                        $("#letters-list").hide();
                        $("#wrong-error").hide();
                        break;
                    case 1:
                        //write letter
                        $("#lives").show();
                        $("#letters-list").show();
                        $("#letters-list").text(state.usedLetters.join(", ").toUpperCase());
                        let lives_code = 8 - state.lives;
                        if (lives_code > 0) {
                            $("#lives").css({
                                backgroundImage: "url('images/"+lives_code+".png')",
                            });
                        }else {
                            $("#lives").css({
                                backgroundImage: "",
                            });
                        }
                        //$("#lives-value").text(state.lives);
                        $("#big-title").text(state.brokenWord.split("").join(" ").toUpperCase());
                        if (state.error) {
                            $("#wrong-error").show();
                            setTimeout(() => {
                                $("#wrong-error").hide();
                            }, 3000);
                            state.error = false;
                            this.legend.setState(state);
                        }
                        break;
                    case 2:
                        if(state.lives == 0) {
                            $("#lose").show();
                            $("#big-title").text(state.word.split("").join(" ").toUpperCase());
                        }else {
                            $("#win").show();  
                            $("#big-title").text(state.word.split("").join(" ").toUpperCase()); 
                        }
                        break;
                }
            }
        });

    }
    saveState() {

    }
}