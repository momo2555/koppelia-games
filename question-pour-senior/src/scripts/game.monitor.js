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
    
}